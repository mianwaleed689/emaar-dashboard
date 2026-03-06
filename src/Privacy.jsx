import React from "react";

const T = { bg: "#04090F", gold: "#D4A843", goldLight: "#E8C96A", textMuted: "#64748B", textSecondary: "#94A3B8", white: "#FFFFFF", surface: "#0A1628", surfaceAlt: "#0D1F35", border: "rgba(212,168,67,0.12)", borderHover: "rgba(212,168,67,0.25)" };

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 40 }}>
    <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, color: T.gold, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${T.border}` }}>{title}</h2>
    <div style={{ fontSize: 14, color: T.textSecondary, lineHeight: 1.9 }}>{children}</div>
  </div>
);

const P = ({ children }) => <p style={{ marginBottom: 12 }}>{children}</p>;

export default function Privacy() {
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
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 36, fontWeight: 900, color: T.white, marginBottom: 12 }}>Privacy Policy</h1>
          <p style={{ fontSize: 13, color: T.textMuted }}>Last updated: March 2026 · Effective immediately</p>
        </div>

        <Section title="1. Information We Collect">
          <P>When you create an account, we collect your name, email address, and account preferences. When you subscribe to a paid plan, payment is processed by Stripe — we do not store your card details.</P>
          <P>We automatically collect usage data including pages visited, features used, search queries within the Platform, and device/browser information to improve the service.</P>
        </Section>

        <Section title="2. How We Use Your Information">
          <P>We use your information to: provide and improve the Platform; send you account-related emails (receipts, alerts you configure, trial expiry notices); respond to your support requests; and analyse usage patterns to improve features.</P>
          <P>We do not sell your personal data to third parties. We do not use your data for advertising purposes.</P>
        </Section>

        <Section title="3. Data Storage & Security">
          <P>Your account data is stored in Google Firebase (Firestore), hosted in Europe West (Belgium). Firebase provides enterprise-grade encryption at rest and in transit.</P>
          <P>We implement role-based access controls ensuring only you can access your personal data, and only authorised administrators can access aggregate platform data.</P>
          <P>Despite our best efforts, no system is completely secure. We recommend using a strong, unique password for your account.</P>
        </Section>

        <Section title="4. Third-Party Services">
          <P>We use the following third-party services to operate the Platform:</P>
          <P>
            <strong style={{ color: T.white }}>Firebase (Google)</strong> — authentication and database storage.<br/>
            <strong style={{ color: T.white }}>Stripe</strong> — payment processing for subscriptions.<br/>
            <strong style={{ color: T.white }}>Cloudinary</strong> — image hosting for project media.<br/>
            <strong style={{ color: T.white }}>EmailJS</strong> — transactional email delivery.<br/>
            <strong style={{ color: T.white }}>Vercel</strong> — platform hosting and deployment.
          </P>
          <P>Each of these providers has their own privacy policy governing how they handle data.</P>
        </Section>

        <Section title="5. Cookies">
          <P>We use essential cookies to maintain your login session. We do not use tracking cookies or third-party advertising cookies.</P>
          <P>Your language preference is stored in your browser's local storage to remember your chosen language between sessions.</P>
        </Section>

        <Section title="6. Your Rights">
          <P>You have the right to: access the personal data we hold about you; request correction of inaccurate data; request deletion of your account and associated data; and export your data.</P>
          <P>To exercise any of these rights, contact us at mianwaleed689@gmail.com. We will respond within 30 days.</P>
        </Section>

        <Section title="7. Data Retention">
          <P>We retain your account data for as long as your account is active. If you delete your account, we will remove your personal data within 30 days, except where we are required to retain it for legal or financial compliance purposes.</P>
        </Section>

        <Section title="8. Children's Privacy">
          <P>The Platform is not intended for users under 18 years of age. We do not knowingly collect personal information from minors. If you believe a minor has created an account, please contact us immediately.</P>
        </Section>

        <Section title="9. Changes to This Policy">
          <P>We may update this Privacy Policy from time to time. We will notify you of material changes via email. Continued use of the Platform after changes constitutes acceptance of the updated policy.</P>
        </Section>

        <Section title="10. Contact">
          <P>For privacy-related questions or requests, contact us at: <a href="mailto:mianwaleed689@gmail.com" style={{ color: T.gold }}>mianwaleed689@gmail.com</a></P>
          <P>The Address Holding, Dubai, UAE.</P>
        </Section>
      </div>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${T.border}`, padding: "24px", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: T.textMuted }}>© 2026 DXB Analytics by The Address Holding. Dubai, UAE.</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 8 }}>
          <a href="/terms" style={{ fontSize: 12, color: T.textMuted, textDecoration: "none" }}>Terms</a>
          <a href="/privacy" style={{ fontSize: 12, color: T.gold, textDecoration: "none" }}>Privacy</a>
          <a href="mailto:mianwaleed689@gmail.com" style={{ fontSize: 12, color: T.textMuted, textDecoration: "none" }}>Contact</a>
        </div>
      </div>
    </div>
  );
}
