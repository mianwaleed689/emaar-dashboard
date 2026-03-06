import React from "react";

const T = { bg: "#04090F", gold: "#D4A843", goldLight: "#E8C96A", textMuted: "#64748B", textSecondary: "#94A3B8", white: "#FFFFFF", surface: "#0A1628", surfaceAlt: "#0D1F35", border: "rgba(212,168,67,0.12)", borderHover: "rgba(212,168,67,0.25)" };

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 40 }}>
    <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, color: T.gold, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${T.border}` }}>{title}</h2>
    <div style={{ fontSize: 14, color: T.textSecondary, lineHeight: 1.9 }}>{children}</div>
  </div>
);

const P = ({ children }) => <p style={{ marginBottom: 12 }}>{children}</p>;

export default function Terms() {
  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Outfit', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,900&display=swap');`}</style>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${T.border}`, background: T.surface }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.bg} strokeWidth="2.5" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <span style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 700, color: T.white }}>DXB Analytics</span>
          </a>
          <a href="/" style={{ fontSize: 13, color: T.textMuted, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Back
          </a>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 24px 80px" }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.gold, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Legal</div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 36, fontWeight: 900, color: T.white, marginBottom: 12 }}>Terms of Service</h1>
          <p style={{ fontSize: 13, color: T.textMuted }}>Last updated: March 2026 · Effective immediately</p>
        </div>

        <Section title="1. Acceptance of Terms">
          <P>By accessing or using DXB Analytics ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform.</P>
          <P>DXB Analytics is operated by The Address Holding, based in Dubai, UAE. These terms are governed by the laws of the United Arab Emirates.</P>
        </Section>

        <Section title="2. Description of Service">
          <P>DXB Analytics is a real estate intelligence platform providing data, analytics, and insights related to Emaar Properties developments and the broader Dubai real estate market.</P>
          <P>The Platform offers tiered access: a free tier with limited features, and paid Pro and Enterprise tiers with full access to all data, analytics tools, ROI calculators, and market intelligence.</P>
        </Section>

        <Section title="3. User Accounts">
          <P>You must create an account to access the Platform. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.</P>
          <P>You agree to provide accurate and complete information when creating your account and to update it as necessary. You must be at least 18 years old to use the Platform.</P>
          <P>We reserve the right to suspend or terminate accounts that violate these terms or engage in fraudulent activity.</P>
        </Section>

        <Section title="4. Subscription & Payments">
          <P>Paid subscriptions are billed on a monthly basis. Prices are listed in AED (UAE Dirhams) and are subject to change with 30 days' notice.</P>
          <P>Subscriptions automatically renew unless cancelled before the renewal date. Refunds are not provided for partial months of service.</P>
          <P>Enterprise plan pricing is negotiated separately. Contact us at mianwaleed689@gmail.com for enterprise enquiries.</P>
        </Section>

        <Section title="5. Disclaimer of Investment Advice">
          <P>All data, analytics, projections, and content provided on the Platform are for informational purposes only and do not constitute financial, investment, or legal advice.</P>
          <P>Past performance of any property or market does not guarantee future results. You should conduct your own due diligence and consult qualified professionals before making any investment decisions.</P>
          <P>DXB Analytics makes no representation or warranty regarding the accuracy, completeness, or timeliness of any information provided on the Platform.</P>
        </Section>

        <Section title="6. Intellectual Property">
          <P>All content on the Platform, including data compilations, analytics, design, and software, is the property of The Address Holding and is protected by applicable intellectual property laws.</P>
          <P>You may not reproduce, distribute, or create derivative works from any content on the Platform without prior written permission.</P>
        </Section>

        <Section title="7. Prohibited Use">
          <P>You agree not to: scrape or bulk-download data from the Platform; share your account credentials with others; use the Platform for any unlawful purpose; attempt to reverse engineer or compromise the Platform's security; or misrepresent data from the Platform.</P>
        </Section>

        <Section title="8. Limitation of Liability">
          <P>To the maximum extent permitted by UAE law, DXB Analytics and The Address Holding shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Platform.</P>
          <P>Our total liability to you shall not exceed the amount you paid for the Platform in the 12 months preceding the claim.</P>
        </Section>

        <Section title="9. Changes to Terms">
          <P>We may update these terms from time to time. We will notify you of material changes via email or a notice on the Platform. Continued use of the Platform after changes constitutes acceptance of the new terms.</P>
        </Section>

        <Section title="10. Contact">
          <P>For questions about these terms, contact us at: <a href="mailto:mianwaleed689@gmail.com" style={{ color: T.gold }}>mianwaleed689@gmail.com</a></P>
        </Section>
      </div>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${T.border}`, padding: "24px", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: T.textMuted }}>© 2026 DXB Analytics by The Address Holding. Dubai, UAE.</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 8 }}>
          <a href="/terms" style={{ fontSize: 12, color: T.gold, textDecoration: "none" }}>Terms</a>
          <a href="/privacy" style={{ fontSize: 12, color: T.textMuted, textDecoration: "none" }}>Privacy</a>
          <a href="mailto:mianwaleed689@gmail.com" style={{ fontSize: 12, color: T.textMuted, textDecoration: "none" }}>Contact</a>
        </div>
      </div>
    </div>
  );
}
