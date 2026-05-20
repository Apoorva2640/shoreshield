import { ReportItem } from "../types";

const RADIUS_KM = 10;
const TIME_WINDOW_HOURS = 6;

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface Cluster {
  id: string;
  place: string;
  reports: ReportItem[];

  hazardType: string;

  alertLevel: "watch" | "warning" | "critical";

  highCount: number;

  confidence: number;

  isSocialCluster: boolean;

  citizenCount: number;
  socialCount: number;

  centerLat: number;
  centerLng: number;

  reason: string;
}

export function buildClusters(reports: ReportItem[]): Cluster[] {
  const used = new Set<string>();

  const clusters: Cluster[] = [];

  const sorted = [...reports].sort((a, b) => {
    const ca =
      typeof a.confidence === "number"
        ? a.confidence
        : 0;

    const cb =
      typeof b.confidence === "number"
        ? b.confidence
        : 0;

    return cb - ca;
  });

  for (const anchor of sorted) {
    if (used.has(anchor.id)) continue;

    const anchorLat = parseFloat(anchor.Lat);
    const anchorLng = parseFloat(anchor.Lng);

    if (isNaN(anchorLat) || isNaN(anchorLng))
      continue;

    const anchorTime = anchor.createdAt
      ? new Date(anchor.createdAt).getTime()
      : Date.now();

    const members: ReportItem[] = [anchor];

    used.add(anchor.id);

    for (const candidate of sorted) {
      if (used.has(candidate.id)) continue;

      const cLat = parseFloat(candidate.Lat);
      const cLng = parseFloat(candidate.Lng);

      if (isNaN(cLat) || isNaN(cLng)) continue;

      // spatial grouping
      const dist = haversineKm(
        anchorLat,
        anchorLng,
        cLat,
        cLng
      );

      if (dist > RADIUS_KM) continue;

      // temporal grouping
      const cTime = candidate.createdAt
        ? new Date(candidate.createdAt).getTime()
        : Date.now();

      const hoursDiff =
        Math.abs(anchorTime - cTime) / 36e5;

      if (hoursDiff > TIME_WINDOW_HOURS)
        continue;

      members.push(candidate);

      used.add(candidate.id);
    }

    // severity counts
    const highCount = members.filter(
      (r) => r.severity === "high"
    ).length;

    // source analysis
    const hasSocial = members.some(
      (r) =>
        r.isSocialSignal || r.type === "social"
    );

    const hasCitizen = members.some(
      (r) =>
        !r.isSocialSignal &&
        r.type !== "social"
    );

    const citizenCount = members.filter(
      (r) =>
        !r.isSocialSignal &&
        r.type !== "social"
    ).length;

    const socialCount = members.filter(
      (r) =>
        r.isSocialSignal ||
        r.type === "social"
    ).length;

    // source diversity bonus
    const sourceDiversityBonus =
      hasSocial && hasCitizen ? 0.1 : 0;

    // AI confidence
    const avgAIConfidence =
      members.reduce(
        (s, r) => s + (r.confidence ?? 0.5),
        0
      ) / members.length;

    // recency weighting
    const recencyScore = members.some((r) => {
      if (!r.createdAt) return false;

      return (
        Date.now() -
          new Date(r.createdAt).getTime() <
        2 * 36e5
      );
    })
      ? 1.0
      : 0.85;

    // report count weighting
    const countWeight = Math.min(
      1,
      0.5 + members.length * 0.1
    );

    // final confidence
    const finalConfidence = Math.min(
      1,
      avgAIConfidence *
        recencyScore *
        countWeight +
        sourceDiversityBonus
    );

    // hazard aggregation
    const hazardCounts: Record<string, number> =
      {};

    members.forEach((r) => {
      const h = r.aiHazard ?? "other";

      hazardCounts[h] =
        (hazardCounts[h] ?? 0) + 1;
    });

    const hazardType = Object.entries(
      hazardCounts
    ).sort((a, b) => b[1] - a[1])[0][0];

    // alert classification
    let alertLevel:
      | "watch"
      | "warning"
      | "critical" = "watch";

    if (
      finalConfidence > 0.85 &&
      highCount >= 3
    ) {
      alertLevel = "critical";
    } else if (finalConfidence > 0.7) {
      alertLevel = "warning";
    }

    // cluster center
    const centerLat =
      members.reduce(
        (sum, r) => sum + parseFloat(r.Lat),
        0
      ) / members.length;

    const centerLng =
      members.reduce(
        (sum, r) => sum + parseFloat(r.Lng),
        0
      ) / members.length;

    // evidence summary
    const evidenceParts: string[] = [];

    if (citizenCount) {
      evidenceParts.push(
        `${citizenCount} citizen report${
          citizenCount > 1 ? "s" : ""
        }`
      );
    }

    if (socialCount) {
      evidenceParts.push(
        `${socialCount} social signal${
          socialCount > 1 ? "s" : ""
        }`
      );
    }

    clusters.push({
      id: anchor.id,

      place:
        anchor.placeName ??
        anchor.aiLocation ??
        "Unknown area",

      reports: members,

      hazardType,

      alertLevel,

      highCount,

      confidence: parseFloat(
        finalConfidence.toFixed(2)
      ),

      isSocialCluster:
        hasSocial && !hasCitizen,

      citizenCount,

      socialCount,

      centerLat,

      centerLng,

      reason: `${
        members.length
      } correlated report${
        members.length > 1 ? "s" : ""
      } near this area — ${evidenceParts.join(
        " + "
      )}. Hazard: ${hazardType}, confidence ${(
        finalConfidence * 100
      ).toFixed(0)}%.`,
    });
  }

  return clusters.sort((a, b) => {
    const levelRank = {
      critical: 3,
      warning: 2,
      watch: 1,
    };

    if (
      levelRank[b.alertLevel] !==
      levelRank[a.alertLevel]
    ) {
      return (
        levelRank[b.alertLevel] -
        levelRank[a.alertLevel]
      );
    }

    return b.confidence - a.confidence;
  });
}