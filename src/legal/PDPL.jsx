import React from "react";

export default function PDPL() {
  return (
    <div style={{ maxWidth: 800, margin: "40px auto", padding: "0 20px", fontFamily: "'Outfit',sans-serif", color: "#E2E8F0", background: "#04090F", minHeight: "100vh" }}>
      <h1 style={{ fontFamily: "'Fraunces',serif", color: "#D4A843" }}>PDPL Data Processing Addendum</h1>
      <p style={{ color: "#94A3B8", fontSize: 12 }}>Last updated: April 2026</p>

      <h2>1. Purpose</h2>
      <p>This Data Processing Addendum ("DPA") forms part of the Terms of Service between DXB RE Analytics Intelligence Platform ("DXB Analytics", "Processor") and the agency subscribing to the Service ("Customer", "Controller") and governs the processing of personal data in accordance with UAE Federal Decree-Law No. 45 of 2021 on Personal Data Protection ("PDPL").</p>

      <h2>2. Roles</h2>
      <ul>
        <li><strong>Customer is the Controller</strong> of personal data it uploads to the Service (leads, contacts, deals, listings belonging to its clients)</li>
        <li><strong>DXB Analytics is the Processor</strong> of that data, acting only on Customer instructions</li>
      </ul>

      <h2>3. Subject Matter of Processing</h2>
      <p>DXB Analytics processes personal data uploaded by Customer to provide CRM, lead management, pipeline tracking, and analytics services.</p>

      <h2>4. Categories of Data Subjects</h2>
      <ul>
        <li>Customer's own clients (real estate buyers, sellers, tenants, landlords)</li>
        <li>Customer's own staff (managers, agents)</li>
        <li>Third-party contacts added by Customer (other brokers, developers)</li>
      </ul>

      <h2>5. Categories of Personal Data</h2>
      <ul>
        <li>Names, emails, phone numbers, nationalities</li>
        <li>Property preferences, budget, investment criteria</li>
        <li>Transaction history within the platform</li>
        <li>Notes and communications logged by Customer's staff</li>
      </ul>

      <h2>6. Processor Obligations</h2>
      <p>DXB Analytics agrees to: (a) process data only on Customer's documented instructions; (b) ensure confidentiality of personnel with access; (c) implement appropriate technical and organizational security measures; (d) not engage sub-processors without Customer consent (current sub-processors: Google/Firebase, Vercel, Stripe); (e) assist Customer in responding to data subject requests; (f) notify Customer of data breaches within 72 hours; (g) delete or return all data within 30 days of contract termination.</p>

      <h2>7. Security Measures</h2>
      <ul>
        <li>Encryption in transit (HTTPS/TLS 1.2+)</li>
        <li>Encryption at rest (Firebase native encryption)</li>
        <li>Role-based access control with multi-tenant isolation (orgId)</li>
        <li>Audit logging of all admin actions</li>
        <li>Regular security reviews and dependency updates</li>
      </ul>

      <h2>8. Data Subject Rights</h2>
      <p>Customer is primarily responsible for responding to data subject requests under PDPL. DXB Analytics will assist by providing data export, deletion, and correction tools within the admin panel.</p>

      <h2>9. Data Location</h2>
      <p>Personal data is processed on Google Firebase and Vercel infrastructure. Data may be stored in data centers located outside the UAE, protected by the providers' standard contractual clauses and compliance frameworks.</p>

      <h2>10. Contact</h2>
      <p>For DPA-related inquiries, contact our Data Protection Officer: <a href="mailto:dpo@dxb-analytics.com" style={{ color: "#D4A843" }}>dpo@dxb-analytics.com</a></p>
    </div>
  );
}