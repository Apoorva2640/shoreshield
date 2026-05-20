"use client";

import Map, { Marker, Popup } from "react-map-gl/maplibre";
import { ReportItem } from "../types";
import { getMarkerColor, getMarkerShadow, getSeverityLabel, getConfidenceLabel, getFallbackPlaceName } from "../lib/reports";

interface Props {
  reports: ReportItem[];
  selected: ReportItem | null;
  setSelected: (r: ReportItem | null) => void;
  viewState: { latitude: number; longitude: number; zoom: number };
  setViewState: (v: { latitude: number; longitude: number; zoom: number }) => void;
}

export default function MapView({ reports, selected, setSelected, viewState, setViewState }: Props) {
  return (
    <div style={{ flex: 1.2, position: "relative", minWidth: 0 }}>
      <div style={{
        position: "absolute", top: 18, left: 20, zIndex: 10,
        pointerEvents: "none", display: "flex", flexDirection: "column", gap: 4,
      }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#8de0d1" }}>
          ShoreShield · INCOIS
        </div>
        <div style={{
          fontSize: 12, color: "rgba(255,255,255,0.5)",
          letterSpacing: "1.6px", textTransform: "uppercase",
        }}>
          Indian coastline · AI-assisted monitoring
        </div>
      </div>

      <div style={{
        position: "absolute", top: 16, right: 16, zIndex: 10,
        background: "rgba(5,17,29,0.9)", border: "1px solid rgba(90,132,168,0.22)",
        borderRadius: 18, padding: "8px 14px", display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{
          background: "rgba(16,185,129,0.18)", color: "#7ff3d0",
          border: "1px solid rgba(16,185,129,0.25)",
          padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600,
        }}>Live</span>
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>AI triage active</span>
      </div>

      <Map
        {...viewState}
        onMove={(e: any) => setViewState(e.viewState)}
        style={{ width: "100%", height: "100%" }}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
      >
        {reports.map((report) => (
          <Marker
            key={report.id}
            latitude={parseFloat(report.Lat)}
            longitude={parseFloat(report.Lng)}
            onClick={() => {
              setSelected(report);
              setViewState({ latitude: parseFloat(report.Lat), longitude: parseFloat(report.Lng), zoom: 7 });
            }}
          >
            <div style={{
              width: selected?.id === report.id ? 20 : 14,
              height: selected?.id === report.id ? 20 : 14,
              borderRadius: "50%",
              background: getMarkerColor(report),
              boxShadow: getMarkerShadow(report),
              border: "2px solid rgba(255,255,255,0.15)",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }} />
          </Marker>
        ))}

        {selected && (
          <Popup
            latitude={parseFloat(selected.Lat)}
            longitude={parseFloat(selected.Lng)}
            onClose={() => setSelected(null)}
            closeOnClick={false}
            offset={16}
          >
            <div style={{ maxWidth: 220, fontFamily: "Inter, sans-serif", color: "#111827" }}>
              <p style={{ margin: "0 0 6px", fontWeight: 600, fontSize: 14, lineHeight: 1.4 }}>
                {selected.Title}
              </p>
              <p style={{ margin: "0 0 3px", fontSize: 12, color: "#6b7280" }}>
                {selected.placeName || getFallbackPlaceName(selected)}
              </p>
              <p style={{ margin: "0 0 3px", fontSize: 12 }}>
                Severity: {getSeverityLabel(selected)}
              </p>
              <p style={{ margin: "0 0 3px", fontSize: 12 }}>
                Hazard: {selected.aiHazard || "unknown"}
              </p>
              <p style={{ margin: "0 0 6px", fontSize: 12 }}>
                Confidence: {getConfidenceLabel(selected)}
              </p>
              {selected.reason && (
                <p style={{ margin: 0, fontSize: 11, color: "#6b7280", fontStyle: "italic", lineHeight: 1.4 }}>
                  {selected.reason}
                </p>
              )}
            </div>
          </Popup>
        )}
      </Map>

      <div style={{
        position: "absolute", left: 16, bottom: 16, zIndex: 10,
        background: "rgba(4,16,27,0.84)", border: "1px solid rgba(90,132,168,0.2)",
        borderRadius: 12, padding: "8px 14px",
        display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap",
      }}>
        {[
          { label: "High", color: "#ef4444" },
          { label: "Medium", color: "#f59e0b" },
          { label: "Low", color: "#34d399" },
          { label: "Social", color: "#8b5cf6" },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: item.color, boxShadow: `0 0 8px ${item.color}` }} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}