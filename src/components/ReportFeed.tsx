"use client";

import { useEffect, useMemo } from "react";
import { ReportItem } from "../types";
import { fireAlertIfNeeded } from "../lib/alertNotifier";
import { Cluster } from "../lib/clusters";
import {
  getMarkerColor, getMarkerShadow,
  getSeverityLabel, getConfidenceLabel, getFallbackPlaceName
} from "../lib/reports";

interface Props {
  reports: ReportItem[];
  clusters: Cluster[];
  filter: string;
  setFilter: (f: string) => void;
  onSelectReport: (r: ReportItem) => void;
  onOpenModal: () => void;
}

export default function ReportFeed({
  reports, clusters, filter, setFilter, onSelectReport, onOpenModal
}: Props) {
  console.log("🔥 REPORT FEED COMPONENT RENDERED");
  const filteredReports = useMemo(
    () => filter ? reports.filter((r) => r.Category === filter) : reports,
    [reports, filter]
  );

  const alertClusters = clusters.filter((c) => c.alertLevel !== "watch");
  const socialClusters = clusters.filter((c) => c.isSocialCluster);
  const socialCount = reports.filter((r) => r.type === "social" || r.Category === "social").length;
  const avgConf = reports.length
    ? (reports.reduce((s, r) => s + (r.confidence ?? 0.5), 0) / reports.length).toFixed(2)
    : "0.00";

    useEffect(() => {
      console.log("🚨 useEffect firing", alertClusters);
  alertClusters.forEach((c) => {
    fireAlertIfNeeded({
      clusterPlace: c.place,
      hazardType: c.hazardType,
      confidence: c.confidence,
      reportCount: c.reports.length,
      highCount: c.highCount,
      reason: c.reason,
    });
  });
}, [alertClusters]);

  return (
    <div style={{
      flex: 1.8,
      display: "flex",
      flexDirection: "column",
      background: "#f8fafc",
      borderLeft: "1px solid #e2e8f0",
      overflow: "hidden",
      minWidth: 0,
    }}>

      {/* Header */}
      <div style={{
        padding: "14px 20px",
        background: "#fff",
        borderBottom: "1px solid #e2e8f0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.8px" }}>
            Intelligence feed · INCOIS ShoreShield
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginTop: 2 }}>
            Coastal hazard monitor
          </div>
        </div>
        <button
          onClick={onOpenModal}
          style={{
            background: "#0ea5e9", color: "#fff", border: "none",
            borderRadius: 10, padding: "9px 18px",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >
          + Report hazard
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Active reports", value: reports.length, color: "#0f172a" },
            { label: "Social signals", value: socialCount, color: "#7c3aed" },
            { label: "Avg confidence", value: avgConf, color: "#0369a1" },
          ].map((s) => (
            <div key={s.label} style={{
              background: "#fff", border: "1px solid #e2e8f0",
              borderRadius: 12, padding: "12px 14px",
            }}>
              <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
                {s.label}
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>





        {/* Insight callouts — this is your Flow C research lens */}
{reports.length >= 2 && (() => {
  const highRisk = reports.filter((r) => r.severity === "high");
  const swCoast = reports.filter((r) => {
    const lat = parseFloat(r.Lat);
    const lng = parseFloat(r.Lng);
    return lat < 13 && lng < 78;
  });
  const avgC = reports.reduce((s, r) => s + (r.confidence ?? 0.5), 0) / reports.length;

  const insights: string[] = [];

  if (highRisk.length > 0) {
    insights.push(
      `${highRisk.length} of ${reports.length} reports are high severity — concentrated review recommended.`
    );
  }
  if (swCoast.length >= 2) {
    insights.push(
      `${swCoast.length} reports from the southwest coastline — possible regional pattern.`
    );
  }
  if (avgC > 0.7) {
    insights.push(
      `Average confidence ${(avgC).toFixed(2)} — signal quality is high this session.`
    );
  } else if (avgC < 0.5) {
    insights.push(
      `Average confidence ${(avgC).toFixed(2)} — most signals are unverified. Field check advised.`
    );
  }

  if (insights.length === 0) return null;

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: 11, fontWeight: 600, color: "#94a3b8",
        textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10,
      }}>
        Pattern insights
      </div>
      {insights.map((insight, i) => (
        <div key={i} style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderLeft: "3px solid #0ea5e9",
          borderRadius: 10,
          padding: "10px 14px",
          marginBottom: 8,
          fontSize: 12,
          color: "#374151",
          lineHeight: 1.6,
        }}>
          {insight}
        </div>
      ))}
    </div>
  );
})()}

        {/* Alert clusters — this is the signature feature */}
        {alertClusters.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: 11, fontWeight: 600, color: "#94a3b8",
              textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10,
            }}>
              Active alerts
            </div>
            {alertClusters.map((c) => (
              <div key={c.id} style={{
                background: "#fff",
                border: "1.5px solid #fca5a5",
                borderLeft: "4px solid #ef4444",
                borderRadius: 12,
                padding: "14px 16px",
                marginBottom: 10,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                    {c.place}
                  </div>
                  <div style={{
                    background: "#fef2f2", color: "#b91c1c",
                    border: "1px solid #fecaca",
                    fontSize: 11, fontWeight: 600,
                    padding: "3px 10px", borderRadius: 999,
                  }}>
                    HIGH RISK
                  </div>
                </div>
                <div style={{ fontSize: 13, color: "#374151", marginBottom: 6 }}>
                  {c.reports.length} report{c.reports.length > 1 ? "s" : ""} · {c.highCount} high severity · hazard: {c.hazardType}
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8, marginBottom: c.reason ? 8 : 0
                }}>
                  <div style={{ flex: 1, height: 4, background: "#fee2e2", borderRadius: 99 }}>
                    <div style={{
                      width: `${Math.round(c.confidence * 100)}%`,
                      height: "100%",
                      background: c.confidence > 0.75 ? "#ef4444" : c.confidence > 0.5 ? "#f59e0b" : "#34d399",
                      borderRadius: 99,
                      transition: "width 0.4s ease",
                    }} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", minWidth: 36 }}>
                    {Math.round(c.confidence * 100)}%
                  </div>
                </div>
                {c.reason && (
                  <div style={{
                    fontSize: 11, color: "#6b7280", fontStyle: "italic",
                    lineHeight: 1.5, borderTop: "1px solid #fee2e2", paddingTop: 8,
                  }}>
                    {c.reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Social clusters */}
        {socialClusters.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: 11, fontWeight: 600, color: "#94a3b8",
              textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10,
            }}>
              Social signal clusters
            </div>
            {socialClusters.map((c) => (
              <div key={c.id} style={{
                background: "#fff",
                border: "1.5px solid #fde68a",
                borderLeft: "4px solid #f59e0b",
                borderRadius: 12,
                padding: "14px 16px",
                marginBottom: 10,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{c.place}</div>
                  <div style={{
                    background: "#fffbeb", color: "#92400e",
                    border: "1px solid #fde68a",
                    fontSize: 11, fontWeight: 600,
                    padding: "3px 10px", borderRadius: 999,
                  }}>
                    UNVERIFIED
                  </div>
                </div>
                <div style={{ fontSize: 13, color: "#374151", marginBottom: 6 }}>
                  {c.reports.length} signal{c.reports.length > 1 ? "s" : ""} · awaiting field verification · hazard: {c.hazardType}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: c.reason ? 8 : 0 }}>
                  <div style={{ flex: 1, height: 4, background: "#fef3c7", borderRadius: 99 }}>
                    <div style={{
                      width: `${Math.round(c.confidence * 100)}%`,
                      height: "100%", background: "#f59e0b",
                      borderRadius: 99, transition: "width 0.4s ease",
                    }} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", minWidth: 36 }}>
                    {Math.round(c.confidence * 100)}%
                  </div>
                </div>
                {c.reason && (
                  <div style={{
                    fontSize: 11, color: "#6b7280", fontStyle: "italic",
                    lineHeight: 1.5, borderTop: "1px solid #fde68a", paddingTop: 8,
                  }}>
                    {c.reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {alertClusters.length === 0 && socialClusters.length === 0 && (
          <div style={{
            background: "#f0fdf4", border: "1px solid #bbf7d0",
            borderRadius: 12, padding: "12px 16px", marginBottom: 20,
            fontSize: 13, color: "#166534",
          }}>
            No active clusters — coastline nominal.
          </div>
        )}

        {/* Reports feed */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 12,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 600, color: "#94a3b8",
            textTransform: "uppercase", letterSpacing: "0.8px",
          }}>
            Recent reports
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: "6px 10px", borderRadius: 8, fontSize: 12,
              border: "1px solid #e2e8f0", background: "#fff",
              color: "#374151", outline: "none",
            }}
          >
            <option value="">All categories</option>
            <option value="oil">Oil spill</option>
            <option value="plastic">Plastic waste</option>
            <option value="sewage">Sewage</option>
            <option value="dead">Dead marine life</option>
            <option value="social">Social signal</option>
          </select>
        </div>

        {filteredReports.map((report) => {
          const isSocial = report.type === "social" || report.Category === "social";
          const sevColor = isSocial ? { bg: "#ede9fe", text: "#7c3aed" }
            : report.severity === "high" ? { bg: "#fef2f2", text: "#b91c1c" }
            : report.severity === "medium" ? { bg: "#fffbeb", text: "#b45309" }
            : { bg: "#f0fdf4", text: "#166534" };

          return (
            <div
              key={report.id}
              onClick={() => onSelectReport(report)}
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 12, padding: "14px 16px",
                marginBottom: 10, cursor: "pointer",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#94a3b8")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{
                  marginTop: 5, width: 10, height: 10, minWidth: 10,
                  borderRadius: "50%",
                  background: getMarkerColor(report),
                  boxShadow: getMarkerShadow(report),
                  flexShrink: 0,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 2, lineHeight: 1.4 }}>
                    {report.Title}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>
                    {report.placeName || getFallbackPlaceName(report)}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: report.reason ? 8 : 0 }}>
                    <span style={{
                      fontSize: 11, padding: "3px 9px", borderRadius: 999,
                      background: sevColor.bg, color: sevColor.text,
                      fontWeight: 600,
                    }}>
                      {isSocial ? "Social" : getSeverityLabel(report)}
                    </span>
                    <span style={{
                      fontSize: 11, padding: "3px 9px", borderRadius: 999,
                      background: "#e0f2fe", color: "#0369a1", fontWeight: 600,
                    }}>
                      {getConfidenceLabel(report)}
                    </span>
                    <span style={{
                      fontSize: 11, padding: "3px 9px", borderRadius: 999,
                      background: "#f1f5f9", color: "#475569",
                    }}>
                      {report.aiHazard || "unknown"}
                    </span>
                  </div>
                  {report.reason && (
                    <div style={{
                      fontSize: 11, color: "#94a3b8",
                      fontStyle: "italic", lineHeight: 1.5,
                    }}>
                      {report.reason}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}