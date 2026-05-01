import React, { useState } from "react";
import { C } from "./tokens";
import OverviewSection from "./OverviewSection";
import DevelopmentsSection from "./DevelopmentsSection";
import ProjectsSection from "./ProjectsSection";
import DevelopersSection from "./DevelopersSection";
import CommunitiesSection from "./CommunitiesSection";
import ComplianceSection from "./ComplianceSection";
import ClaimsSection from "./ClaimsSection";

/**
 * DXB ANALYTICS - DATA MANAGER V2
 * Central command center for managing all platform data
 * Schema reference: docs/schema-v1.md (v2 hybrid two-collection model)
 */
export default function DataManagerV2({ currentUserId = null, currentUserEmail = null }) {
  const [section, setSection] = useState("overview");

  const nav = [
    { id: "overview",     label: "Overview",     icon: "âŠâ„¢", color: C.gold },
    { id: "developments", label: "Developments", icon: "ââ€”‰", color: C.teal },
    { id: "projects",     label: "Projects",     icon: "ââ€”ˆ", color: C.blue },
    { id: "developers",   label: "Developers",   icon: "ââ€”†", color: C.purple },
    { id: "communities",  label: "Communities",  icon: "ââ€”Ž", color: C.cyan },
    { id: "compliance",  label: "Compliance",   icon: "âšâ€“", color: C.red },
    { id: "claims",      label: "Claims",       icon: "ââ€”ˆ", color: C.amber },
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.w, fontFamily: C.ff }}>
      <div style={{
        padding: "20px 28px",
        borderBottom: "1px solid " + C.border,
        background: "linear-gradient(180deg, " + C.s2 + ", " + C.bg + ")",
      }}>
        <h1 style={{ margin: 0, fontSize: 22, fontFamily: C.ffH, color: C.gold, fontWeight: 600 }}>
          Data Manager
        </h1>
        <p style={{ margin: "4px 0 0 0", fontSize: 12, color: C.t2 }}>
          Central command for developments, projects, developers, communities, and compliance
        </p>
      </div>

      <div style={{ display: "flex", minHeight: "calc(100vh - 80px)" }}>
        <nav style={{
          width: 220,
          borderRight: "1px solid " + C.border,
          padding: "20px 12px",
          background: C.s1,
          flexShrink: 0,
        }}>
          {nav.map(n => (
            <button
              key={n.id}
              type="button"
              onClick={() => setSection(n.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "10px 14px",
                marginBottom: 4,
                background: section === n.id ? n.color + "15" : "transparent",
                border: section === n.id ? "1px solid " + n.color + "40" : "1px solid transparent",
                borderRadius: 8,
                color: section === n.id ? n.color : C.t2,
                fontSize: 13,
                fontFamily: C.ff,
                fontWeight: section === n.id ? 600 : 400,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: 16 }}>{n.icon}</span>
              <span>{n.label}</span>
            </button>
          ))}
        </nav>

        <main style={{ flex: 1, padding: 28, overflow: "auto" }}>
          {section === "overview" && <OverviewSection currentUserId={currentUserId} />}
          {section === "developments" && <DevelopmentsSection currentUserId={currentUserId} currentUserEmail={currentUserEmail} />}
          {section === "projects" && <ProjectsSection currentUserId={currentUserId} currentUserEmail={currentUserEmail} />}
          {section === "developers" && <DevelopersSection currentUserId={currentUserId} currentUserEmail={currentUserEmail} />}
          {section === "communities" && <CommunitiesSection currentUserId={currentUserId} currentUserEmail={currentUserEmail} />}
          {section === "compliance" && <ComplianceSection />}
          {section === "claims" && <ClaimsSection currentUserId={currentUserId} currentUserEmail={currentUserEmail} />}
        </main>
      </div>
    </div>
  );
}
