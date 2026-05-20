"use client";

import { useState } from "react";
import { reverseGeocode } from "../lib/reports";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    Title: string; Description: string; Lat: string; Lng: string;
    category: string; locationLabel: string;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export default function SubmitModal({ isOpen, onClose, onSubmit, isSubmitting }: Props) {
  const [Title, setTitle] = useState("");
  const [Description, setDescription] = useState("");
  const [Lat, setLat] = useState("");
  const [Lng, setLng] = useState("");
  const [category, setCategory] = useState("");
  const [locationLabel, setLocationLabel] = useState("");

  if (!isOpen) return null;

  const getLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude.toString();
        const lng = pos.coords.longitude.toString();
        setLat(lat); setLng(lng);
        setLocationLabel(await reverseGeocode(lat, lng));
      },
      () => alert("Unable to fetch location")
    );
  };

  const handleSubmit = async () => {
    if (!Title || !Lat || !Lng || !category) return;
    await onSubmit({ Title, Description, Lat, Lng, category, locationLabel });
    setTitle(""); setDescription(""); setLat(""); setLng("");
    setCategory(""); setLocationLabel("");
  };

  const inp: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: 10,
    boxSizing: "border-box", border: "1px solid rgba(148,163,184,0.2)",
    background: "rgba(15,23,42,0.8)", color: "white",
    outline: "none", fontSize: 14, fontFamily: "Inter, sans-serif",
  };

  const label: React.CSSProperties = {
    display: "block", fontSize: 12,
    color: "rgba(255,255,255,0.6)", marginBottom: 6,
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(2,6,23,0.75)",
        backdropFilter: "blur(8px)", display: "flex", alignItems: "center",
        justifyContent: "center", zIndex: 2000, padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 500,
          background: "linear-gradient(180deg, #081423 0%, #06111d 100%)",
          border: "1px solid rgba(148,163,184,0.15)",
          borderRadius: 20, padding: 22, color: "white",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              New coastal incident
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>Report hazard</div>
          </div>
          <button onClick={onClose} style={{
            width: 36, height: 36, borderRadius: "50%",
            border: "1px solid rgba(148,163,184,0.16)",
            background: "rgba(255,255,255,0.04)", color: "white",
            fontSize: 16, cursor: "pointer",
          }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={label}>Hazard title</label>
            <input
              style={inp}
              placeholder="e.g. Huge waves hitting Vizag coast"
              value={Title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label style={label}>Describe what you observed <span style={{ color: "rgba(255,255,255,0.35)" }}>(optional but helps AI accuracy)</span></label>
            <textarea
              style={{ ...inp, height: 90, resize: "none", lineHeight: 1.5 }}
              placeholder="e.g. Waves are about 4-5 metres high, fishermen cannot launch boats, water is unusually dark and rough since morning"
              value={Description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label style={label}>Hazard category</label>
            <select style={inp} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Select category</option>
              <option value="rough_seas">Rough seas / dangerous waves</option>
              <option value="flooding">Coastal flooding</option>
              <option value="tsunami">Tsunami warning</option>
              <option value="pollution">Pollution (oil, sewage, plastic)</option>
              <option value="social">Social signal / secondhand report</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label style={label}>Location</label>
            <button onClick={getLocation} style={{
              padding: "10px 16px", borderRadius: 10, background: "#059669",
              color: "white", border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 600,
            }}>
              Use my location
            </button>
            {locationLabel && (
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>
                Detected: {locationLabel}
              </div>
            )}
          </div>

          <div style={{
            background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)",
            borderRadius: 10, padding: 12, fontSize: 12, color: "#7dd3fc", lineHeight: 1.6,
          }}>
            AI will classify hazard type, severity, confidence, and extract a reason automatically.
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={onClose} style={{
              flex: 1, padding: "12px", borderRadius: 10,
              border: "1px solid rgba(148,163,184,0.16)",
              background: "rgba(255,255,255,0.04)", color: "white",
              cursor: "pointer", fontSize: 14,
            }}>Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !Title || !Lat || !category}
              style={{
                flex: 1, padding: "12px", borderRadius: 10, border: "none",
                background: isSubmitting || !Title || !Lat || !category
                  ? "#334155" : "#0ea5e9",
                color: "white",
                cursor: isSubmitting || !Title || !Lat || !category
                  ? "not-allowed" : "pointer",
                fontWeight: 700, fontSize: 14,
              }}
            >
              {isSubmitting ? "Analyzing..." : "Submit report"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}