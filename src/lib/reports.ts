import { ReportItem } from "../types";

export function mapCategoryToHazard(cat: string) {
  if (cat === "rough_seas") return "rough_seas";
  if (cat === "flooding") return "flood";
  if (cat === "tsunami") return "tsunami";
  if (cat === "pollution" || cat === "oil" || cat === "plastic" || cat === "sewage" || cat === "dead") return "pollution";
  if (cat === "social") return "unknown";
  return "other";
}

export function getSeverityFromCategory(cat: string): "low" | "medium" | "high" {
  if (cat === "tsunami" || cat === "flooding") return "high";
  if (cat === "rough_seas" || cat === "social") return "medium";
  if (cat === "pollution") return "medium";
  return "low";
}

export function getConfidenceFromSeverity(severity: string) {
  if (severity === "high") return 0.91;
  if (severity === "medium") return 0.72;
  return 0.44;
}

export function getFallbackPlaceName(report: Partial<ReportItem>) {
  const lat = parseFloat(report?.Lat || "");
  const lng = parseFloat(report?.Lng || "");
  if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
    if (lat > 8 && lat < 13 && lng > 74 && lng < 77.5) return "Kerala Coast";
    if (lat > 8 && lat < 11 && lng > 78 && lng < 80.5) return "Tamil Nadu Coast";
    if (lat > 14 && lat < 16.5 && lng > 73 && lng < 74.5) return "Goa Coast";
    if (lat > 15 && lat < 18 && lng > 80 && lng < 84) return "Andhra Pradesh Coast";
    if (lat > 18 && lat < 22 && lng > 72 && lng < 73.5) return "Maharashtra Coast";
    if (lat > 20 && lat < 22.5 && lng > 86 && lng < 89) return "Odisha Coast";
  }
  return "Indian Coastline";
}

export function getMarkerColor(report: ReportItem) {
  if (report.type === "social" || report.Category === "social") return "#8b5cf6";
  if (report.severity === "high") return "#ef4444";
  if (report.severity === "medium") return "#f59e0b";
  return "#34d399";
}

export function getMarkerShadow(report: ReportItem) {
  if (report.type === "social" || report.Category === "social")
    return "0 0 18px rgba(139,92,246,0.85)";
  if (report.severity === "high") return "0 0 20px rgba(239,68,68,0.95)";
  if (report.severity === "medium") return "0 0 18px rgba(245,158,11,0.85)";
  return "0 0 14px rgba(52,211,153,0.75)";
}

export function getSeverityLabel(report: ReportItem) {
  const sev = report.severity || getSeverityFromCategory(report.Category);
  return sev.charAt(0).toUpperCase() + sev.slice(1);
}

export function getConfidenceLabel(report: ReportItem) {
  const score =
    typeof report.credibility === "number"
      ? report.credibility
      : typeof report.confidence === "number"
      ? report.confidence
      : 0.5;
  return score.toFixed(2);
}

export async function reverseGeocode(lat: string, lng: string) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
    );
    const data = await res.json();
    const address = data?.address || {};
    return (
      address.city ||
      address.town ||
      address.village ||
      address.county ||
      address.state_district ||
      address.state ||
      data?.name ||
      "Indian Coastline"
    );
  } catch {
    return "Indian Coastline";
  }
}

export const DEMO_REPORTS: ReportItem[] = [
  {
    id: "demo1",
    Title: "Fisherman reports 5m waves near Kochi harbour",
    Lat: "9.9312", Lng: "76.2673",
    Category: "oil", severity: "high", type: "report",
    confidence: 0.91, credibility: 0.91,
    aiHazard: "rough_seas", aiLocation: "Kochi",
    placeName: "Kochi, Kerala",
    createdAt: new Date().toISOString(),
    reason: "Firsthand report of dangerous wave height near named harbour.",
    isSocialSignal: false,
  },
  {
    id: "demo2",
    Title: "Abnormal current near Rameswaram",
    Lat: "9.2876", Lng: "79.3129",
    Category: "sewage", severity: "medium", type: "report",
    confidence: 0.61, credibility: 0.61,
    aiHazard: "pollution", aiLocation: "Rameswaram",
    placeName: "Rameswaram, Tamil Nadu",
    createdAt: new Date().toISOString(),
    reason: "Unusual current reported, no immediate life threat mentioned.",
    isSocialSignal: false,
  },
  {
    id: "demo3",
    Title: "Swell surge observed near Panaji beach",
    Lat: "15.4909", Lng: "73.8278",
    Category: "plastic", severity: "low", type: "report",
    confidence: 0.44, credibility: 0.44,
    aiHazard: "rough_seas", aiLocation: "Panaji",
    placeName: "Panaji, Goa",
    createdAt: new Date().toISOString(),
    reason: "Observation lacks specific detail or urgency.",
    isSocialSignal: false,
  },
  {
    id: "demo4",
    Title: "Multiple social posts mentioning tsunami near Andhra coast",
    Lat: "16.5062", Lng: "80.6480",
    Category: "social", severity: "medium", type: "social",
    confidence: 0.72, credibility: 0.72,
    aiHazard: "tsunami", aiLocation: "Andhra Pradesh Coast",
    placeName: "Andhra Pradesh Coast",
    createdAt: new Date().toISOString(),
    reason: "Multiple social signals from same region, unverified but consistent.",
    isSocialSignal: true,
  },
];