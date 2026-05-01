/* eslint-disable */
/*
  DXB ANALYTICS ‚‚Ç¨‚Äù WELCOME SCREEN
  Session 12 ‚‚Ç¨‚Äù First login only
  Tips: WhatsApp, Email, Call
*/

import React, { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function WelcomeScreen({ userName, orgName, managerName, userId, onDismiss }) {
  const [dismissing, setDismissing] = useState(false);

  const dismiss = async () => {
    setDismissing(true);
    try {
      if (userId) {
        await updateDoc(doc(db, "users", userId), {
          onboardingComplete: true,
          onboardingCompletedAt: new Date().toISOString(),
        });
      }
    } catch(e) { console.error(e); }
    onDismiss?.();
    setDismissing(false);
  };

  const TIPS = [
    {
      icon: "ü‚Äô¨",
      color: "#25D366",
      title: "WhatsApp your leads instantly",
      body: "Every lead has a WhatsApp button. Click it to open a pre-written message. Always log the conversation in the activity tab after.",
    },
    {
      icon: "ü‚Äúß",
      color: "#3B82F6",
      title: "Email leads directly from the platform",
      body: "Tap the email link on any lead to open your email client with the lead's address pre-filled. Keep your communication in one place.",
    },
    {
      icon: "ü‚Äúû",
      color: "#10B981",
      title: "Call and log every conversation",
      body: "Use the Call button to dial directly. After every call, add a note in the Activity tab ‚‚Ç¨‚Äù your manager can see your progress in real time.",
    },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(4,9,15,0.96)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      fontFamily: "'Outfit', sans-serif",
    }}>
      <div style={{
        background: "#0D1117",
        borderRadius: 16,
        border: "1px solid rgba(212,168,67,0.3)",
        width: "100%",
        maxWidth: 520,
        overflow: "hidden",
        boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
      }}>

        {/* Header */}
        <div style={{
          padding: "28px 28px 20px",
          background: "linear-gradient(135deg, rgba(212,168,67,0.08), rgba(212,168,67,0.02))",
          borderBottom: "1px solid rgba(212,168,67,0.15)",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>ü‚Äòã</div>
          <div style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 22,
            fontWeight: 900,
            color: "#FFFFFF",
            marginBottom: 6,
          }}>
            Welcome, {userName || "Agent"}!
          </div>
          <div style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.6 }}>
            You have joined <strong style={{ color: "#D4A843" }}>{orgName || "your agency"}</strong>
            {managerName ? <> ¬∑ Your manager is <strong style={{ color: "#D4A843" }}>{managerName}</strong></> : ""}
          </div>
        </div>

        {/* Tips */}
        <div style={{ padding: "20px 28px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 14 }}>
            How to contact your leads
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {TIPS.map((tip, i) => (
              <div key={i} style={{
                display: "flex",
                gap: 14,
                padding: "13px 14px",
                background: "rgba(255,255,255,0.03)",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.06)",
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 9,
                  background: tip.color + "18",
                  border: "1px solid " + tip.color + "30",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, flexShrink: 0,
                }}>
                  {tip.icon}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", marginBottom: 3 }}>{tip.title}</div>
                  <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.55 }}>{tip.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ padding: "0 28px 28px" }}>
          <button
            type="button"
            onClick={dismiss}
            disabled={dismissing}
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: 9,
              border: "none",
              background: dismissing ? "rgba(212,168,67,0.4)" : "linear-gradient(135deg, #D4A843, #B8902E)",
              color: "#0A0E1A",
              fontSize: 14,
              fontWeight: 700,
              cursor: dismissing ? "not-allowed" : "pointer",
              fontFamily: "'Outfit', sans-serif",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {dismissing ? "Setting up..." : (
              <>
                Go to Dashboard
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
