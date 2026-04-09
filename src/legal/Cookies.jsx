import React from "react";

export default function Cookies() {
  return (
    <div style={{ maxWidth: 800, margin: "40px auto", padding: "0 20px", fontFamily: "'Outfit',sans-serif", color: "#E2E8F0", background: "#04090F", minHeight: "100vh" }}>
      <h1 style={{ fontFamily: "'Fraunces',serif", color: "#D4A843" }}>Cookie Policy</h1>
      <p style={{ color: "#94A3B8", fontSize: 12 }}>Last updated: April 2026</p>

      <h2>1. What Are Cookies?</h2>
      <p>Cookies are small text files stored on your device by your browser when you visit a website. They help us remember your login session, preferences, and usage patterns.</p>

      <h2>2. Cookies We Use</h2>
      <p><strong>Essential cookies (required):</strong></p>
      <ul>
        <li>Firebase Auth session tokens (keeps you logged in)</li>
        <li>CSRF protection tokens</li>
        <li>User preference storage (theme, language)</li>
      </ul>
      <p><strong>Analytics cookies (optional, not currently used):</strong></p>
      <p>We do not currently use Google Analytics, Meta Pixel, or any third-party marketing trackers. If this changes, we will update this policy and request your consent.</p>

      <h2>3. Managing Cookies</h2>
      <p>You can disable cookies in your browser settings, but the Service will not function correctly without essential cookies (you will be logged out on every page load).</p>

      <h2>4. Contact</h2>
      <p>Questions: <a href="mailto:privacy@dxb-analytics.com" style={{ color: "#D4A843" }}>privacy@dxb-analytics.com</a></p>
    </div>
  );
}