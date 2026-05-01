/* �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
   DXB ANALYTICS �€” SAMPLE DATA BANNER
   src/components/SampleDataBanner.jsx

   A small yellow warning bar that appears above tab content when
   the tab is showing hardcoded seed data instead of live Firestore
   data. This is a credibility safeguard �€” users should never be
   confused about whether they are looking at real or placeholder
   information.

   Usage:
     {isShowingSeed && <SampleDataBanner source="Launch Calendar" />}

   Props:
   - source (optional): name of the tab or data source. Defaults to
     just "Sample data" if not provided.
   - message (optional): override the default message entirely.
   �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€ */

import React from "react";

export default function SampleDataBanner({ source, message }) {
  const text = message
    || (source
        ? `${source} is showing sample data �€” live data will appear once projects are added in admin`
        : "Showing sample data �€” live data will appear once projects are added in admin");

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        background: "rgba(245, 158, 11, 0.10)",
        border: "1px solid rgba(245, 158, 11, 0.35)",
        borderRadius: 8,
        padding: "10px 14px",
        marginBottom: 14,
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontFamily: "'Outfit', sans-serif",
        fontSize: 12,
        color: "#F59E0B",
        fontWeight: 600,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <span>{text}</span>
    </div>
  );
}