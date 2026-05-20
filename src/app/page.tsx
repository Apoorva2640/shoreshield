"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, onSnapshot } from "firebase/firestore";
import { ReportItem } from "../types";
import { buildClusters } from "../lib/clusters";
import {
  getSeverityFromCategory, getConfidenceFromSeverity,
  mapCategoryToHazard, getFallbackPlaceName,
  reverseGeocode, DEMO_REPORTS,
} from "../lib/reports";
import MapView from "../components/MapView";
import ReportFeed from "../components/ReportFeed";
import SubmitModal from "../components/SubmitModal";

export default function Home() {
  const [reports, setReports] = useState<ReportItem[]>(DEMO_REPORTS);
  const [selected, setSelected] = useState<ReportItem | null>(null);
  const [filter, setFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewState, setViewState] = useState({
    latitude: 13.5,
    longitude: 80.5,
    zoom: 5.8,
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "reports"), (snap) => {
      const live: ReportItem[] = snap.docs.map((doc) => {
        const d = doc.data() as Omit<ReportItem, "id">;
        const severity = d.severity || getSeverityFromCategory(d.Category);
        const confidence = typeof d.confidence === "number"
          ? d.confidence : getConfidenceFromSeverity(severity);
        return {
          id: doc.id, ...d, severity, confidence,
          credibility: typeof d.credibility === "number" ? d.credibility : confidence,
          aiHazard: d.aiHazard || mapCategoryToHazard(d.Category),
          type: d.type || (d.Category === "social" ? "social" : "report"),
          placeName: d.placeName || d.aiLocation || getFallbackPlaceName(d),
        };
      });
      setReports([...DEMO_REPORTS, ...live]);
    });
    return () => unsub();
  }, []);

  const clusters = useMemo(() => buildClusters(reports), [reports]);

  const handleSubmit = async ({ Title, Description, Lat, Lng, category, locationLabel }: {
    Title: string; Description: string; Lat: string; Lng: string;
    category: string; locationLabel: string;
  }) => {
    setIsSubmitting(true);
    try {
      const textForAI = Description ? `${Title}. ${Description}` : Title;

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textForAI }),
      });
      const analysis = res.ok ? await res.json() : null;

      const severity = analysis?.severity && ["low","medium","high"].includes(analysis.severity)
        ? analysis.severity as "low"|"medium"|"high"
        : getSeverityFromCategory(category);
      const confidence = typeof analysis?.confidence === "number"
        ? analysis.confidence : getConfidenceFromSeverity(severity);
      const placeName = analysis?.location && analysis.location !== "unknown"
        ? analysis.location
        : locationLabel || await reverseGeocode(Lat, Lng);

      await addDoc(collection(db, "reports"), {
        Title,
        Description: Description || "",
        Lat, Lng,
        Category: category,
        severity, confidence, credibility: confidence,
        aiHazard: analysis?.hazard || "unknown",
        aiLocation: analysis?.location || "unknown",
        isSocialSignal: analysis?.isSocialSignal ?? false,
        reason: analysis?.reason ?? "",
        type: analysis?.isSocialSignal ? "social"
          : category === "social" ? "social" : "report",
        placeName,
        createdAt: new Date().toISOString(),
      });
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      display: "flex", height: "100vh", overflow: "hidden",
      background: "#020b16",
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    }}>
      <MapView
        reports={reports}
        selected={selected}
        setSelected={(r) => {
          setSelected(r);
          if (r) setViewState({ latitude: parseFloat(r.Lat), longitude: parseFloat(r.Lng), zoom: 7 });
        }}
        viewState={viewState}
        setViewState={setViewState}
      />
      <ReportFeed
        reports={reports}
        clusters={clusters}
        filter={filter}
        setFilter={setFilter}
        onSelectReport={(r) => {
          setSelected(r);
          setViewState({ latitude: parseFloat(r.Lat), longitude: parseFloat(r.Lng), zoom: 7 });
        }}
        onOpenModal={() => setIsModalOpen(true)}
      />
      <SubmitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}