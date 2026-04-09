import React from "react";

export default function Privacy() {
  return (
    <div style={{ maxWidth: 800, margin: "40px auto", padding: "0 20px", fontFamily: "'Outfit',sans-serif", color: "#E2E8F0", background: "#04090F", minHeight: "100vh" }}>
      <h1 style={{ fontFamily: "'Fraunces',serif", color: "#D4A843" }}>Privacy Policy</h1>
      <p style={{ color: "#94A3B8", fontSize: 12 }}>Last updated: April 2026</p>

      <h2>1. Who We Are</h2>
      <p>DXB RE Analytics Intelligence Platform ("DXB Analytics") is a real estate intelligence service operating in the United Arab Emirates. We are committed to protecting your personal data in accordance with UAE Federal Decree-Law No. 45 of 2021 on the Protection of Personal Data ("PDPL").</p>

      <h2>2. What Data We Collect</h2>
      <ul>
        <li><strong>Account data:</strong> name, email, phone, agency name, RERA number, trade license, role</li>
        <li><strong>Usage data:</strong> pages visited, features used, login times, IP address</li>
        <li><strong>CRM data you upload:</strong> leads, deals, listings, contacts</li>
        <li><strong>Payment data:</strong> handled by Stripe, not stored on our servers</li>
      </ul>

      <h2>3. How We Use Your Data</h2>
      <p>We use your data to: (a) provide and improve the Service; (b) authenticate and secure your account; (c) send transactional emails (welcome, verification, billing); (d) generate aggregated market insights; (e) comply with legal obligations.</p>

      <h2>4. Legal Basis for Processing</h2>
      <p>Under UAE PDPL, we process your data based on: (a) your consent (signup, marketing); (b) contract performance (service delivery); (c) legal obligation (tax records, regulatory compliance); (d) legitimate interest (fraud prevention, product improvement).</p>

      <h2>5. Data Sharing</h2>
      <p>We do not sell your data. We share data only with: (a) trusted service providers (Firebase/Google, Vercel, Stripe, EmailJS) under strict contracts; (b) law enforcement when legally required; (c) in case of business transfer (merger, acquisition), with notice to you.</p>

      <h2>6. Data Retention</h2>
      <p>Account data is retained for as long as your account is active, plus 2 years after deletion for legal records. CRM data you upload is deleted within 30 days of account termination. Audit logs are retained for 7 years per UAE commercial law.</p>

      <h2>7. Your Rights Under PDPL</h2>
      <ul>
        <li>Right to access the personal data we hold about you</li>
        <li>Right to correct inaccurate data</li>
        <li>Right to delete your data ("right to be forgotten")</li>
        <li>Right to restrict or object to processing</li>
        <li>Right to data portability (export in machine-readable format)</li>
        <li>Right to withdraw consent at any time</li>
      </ul>
      <p>To exercise these rights, email <a href="mailto:privacy@dxb-analytics.com" style={{ color: "#D4A843" }}>privacy@dxb-analytics.com</a>. We respond within 30 days.</p>

      <h2>8. Data Security</h2>
      <p>We use industry-standard measures: HTTPS encryption, Firebase Auth, role-based access control, audit logging, and regular security reviews. No system is 100% secure; we notify you of breaches affecting your data within 72 hours as required by PDPL.</p>

      <h2>9. International Transfers</h2>
      <p>Your data may be processed on servers located outside the UAE (Firebase/Google Cloud, Vercel). These transfers are protected by standard contractual clauses and the providers' own compliance with GDPR and equivalent frameworks.</p>

      <h2>10. Children</h2>
      <p>The Service is not intended for users under 18. We do not knowingly collect data from minors.</p>

      <h2>11. Changes to This Policy</h2>
      <p>We may update this Privacy Policy periodically. Material changes will be notified via email. The "Last updated" date at the top reflects the most recent revision.</p>

      <h2>12. Contact</h2>
      <p>Privacy questions: <a href="mailto:privacy@dxb-analytics.com" style={{ color: "#D4A843" }}>privacy@dxb-analytics.com</a></p>
    </div>
  );
}