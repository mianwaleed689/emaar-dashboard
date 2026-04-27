const fs = require("fs");
const p = "src/tabs/MarketTab.jsx";
let s = fs.readFileSync(p, "latin1");

const oldSources = `      {/* ── Sources footer ─────────────────────────────────────── */}
      <div style={{ paddingTop: 16, borderTop: \`1px solid \${T.border}\`, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 10, color: T.textMuted }}>Sources:</span>
        {["Dubai Land Department", "REIDIN Dec 2025", "ValuStrat Q4 2025", "Knight Frank", "CW Core", "BetterHomes FY2025", "Cavendish Maxwell Q3 2025", "Fitch Ratings", "DXB Analytics"].map(s => (
          <span key={s} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, border: \`1px solid \${T.border}\`, color: T.textMuted }}>{s}</span>
        ))}
      </div>`;

const newSources = `      {/* ── Sources panel ──────────────────────────────────────── */}
      <div style={{ paddingTop: 20, borderTop: \`1px solid \${T.border}\` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.textSecondary, marginBottom: 14, letterSpacing: 1, textTransform: "uppercase" }}>Primary Sources — Verify Any Number</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 10 }}>
          {[
            {
              name: "Dubai Land Department — Full Year 2025 Official Announcement",
              desc: "Total transactions 270,000+ · AED 917B · investor base 193,100 · women investors AED 154B",
              url: "https://mediaoffice.ae/en/news/2026/january/12-01/dubais-real-estate-market-records-new-historic-milestone",
              tag: "DLD Official",
            },
            {
              name: "Dubai Land Department — AED 761B in 2024",
              desc: "2024 full year: 226,000 transactions · AED 761B · +36% volume +20% value YoY",
              url: "https://dubailand.gov.ae/en/news-media/dubai-s-real-estate-sector-records-aed761-billion-in-transactions-in-2024",
              tag: "DLD Official",
            },
            {
              name: "Gulf News — Dubai closes 2025 with AED 682.5B in sales",
              desc: "Sales-only breakdown: 214,912 transactions · AED 682.5B · Q4 monthly records",
              url: "https://gulfnews.com/business/property/dubai-property-market-closes-2025-with-record-dh6825-billion-in-sales-1.500396068",
              tag: "Gulf News",
            },
            {
              name: "Zawya — Dubai real estate market hits AED 682.5B",
              desc: "Off-plan 62.6% share · 50,974 mortgage transactions · AED 179.26B mortgage value",
              url: "https://www.zawya.com/en/press-release/research-and-studies/dubai-real-estate-market-hits-aed-6825bln-with-214-912-transactions-in-2025-lnxen66w",
              tag: "Zawya",
            },
            {
              name: "ValuStrat VPI — Dubai Residential Capital Values December 2025",
              desc: "Citywide weighted avg: AED 1,689/sqft · +19.8% YoY · Villas +25.5% · Apts +14.8%",
              url: "https://valustrat.com/products/vpi-dubai-residential-capital-values-december-2025",
              tag: "ValuStrat",
            },
            {
              name: "REIDIN — UAE Residential Property Price Report",
              desc: "REIDIN index Dec 2025: +12.88% YoY · Villas +15.16% · Apartments +12.52% · Yield 6.55%",
              url: "https://reidin.com",
              tag: "REIDIN",
            },
            {
              name: "Knight Frank — Dubai Residential Market Review Q3 2025",
              desc: "Values +10% YoY · AED 310B+ YTD · supply delivery rate 46% · 2026 forecast +3%/+1%",
              url: "https://www.knightfrank.ae/newsroom/article/2025/11/dubai-residential-market-review-q3-2025",
              tag: "Knight Frank",
            },
            {
              name: "BetterHomes — Dubai Residential Real Estate FY2025",
              desc: "Off-plan 65% of volume · 132,000 off-plan transactions · AED 248B apartment off-plan",
              url: "https://www.constructionweekonline.com/analysis/dubai-off-plan-sales-2025",
              tag: "BetterHomes",
            },
            {
              name: "Cavendish Maxwell — Dubai Residential Q3 2025",
              desc: "~98K units forecast 2026 · 366K through 2028 · Q3 off-plan 76% of transactions",
              url: "https://cavendishmaxwell.com/insights/market-reports/residential/dubai-residential-market-performance-q3-2025",
              tag: "Cavendish Maxwell",
            },
            {
              name: "Global Property Guide — UAE Residential Market Analysis 2026",
              desc: "Multi-source synthesis: DLD + REIDIN + ValuStrat + Knight Frank · yield benchmarks",
              url: "https://www.globalpropertyguide.com/middle-east/united-arab-emirates/price-history",
              tag: "Global Property Guide",
            },
            {
              name: "DXB Analytics — Dubai Property Price Index 2026",
              desc: "Full year 2025: AED 1,863 avg PPSF · Jan 2026: AED 1,976 · sourced from DLD via Dubai Pulse",
              url: "https://www.dxbanalytics.com/blog/dubai-property-price-index-2026",
              tag: "DXB Analytics",
            },
            {
              name: "Roya International — Dubai Real Estate Market Report 2025",
              desc: "Comprehensive synthesis: DLD + ValuStrat + REIDIN + Knight Frank · all cited with methodology",
              url: "https://royainternational.co.uk/pages/market-reports.php",
              tag: "Roya International",
            },
            {
              name: "Dubai Media Office — DLD 2020 Annual Report",
              desc: "2020 full year: 51,414 transactions · AED 175B · Covid year V-shaped recovery",
              url: "https://mediaoffice.ae/en/news/2021/Feb/03-02/souq-dubai",
              tag: "DLD 2020",
            },
            {
              name: "UAE Moments — Dubai Real Estate 2022 Record",
              desc: "2022: 122,658 transactions · AED 528B · first half-trillion year · +44.7% volume",
              url: "https://www.uaemoments.com/amp/dubais-real-estate-transactions-hit-a-record-high-in-2022-553424.html",
              tag: "DLD 2022",
            },
            {
              name: "The National — Dubai 2023 Record 1.6M Transactions",
              desc: "2023: 166,400 transactions · AED 634B · +36% volume · +20% value · new investment high",
              url: "https://www.thenationalnews.com/business/property/2024/02/07/dubais-real-estate-transactions-surge-17-to-record-16-million-in-2023/",
              tag: "DLD 2023",
            },
          ].map(src => (
            <a key={src.name} href={src.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
              <div style={{
                background: "rgba(255,255,255,0.02)", border: \`1px solid \${T.border}\`,
                borderRadius: 10, padding: "12px 14px", transition: "border-color 0.2s, background 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold + "50"; e.currentTarget.style.background = "rgba(212,168,67,0.04)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.white, lineHeight: 1.4 }}>{src.name}</span>
                  <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 8, background: "rgba(212,168,67,0.1)", color: T.gold, whiteSpace: "nowrap", flexShrink: 0 }}>{src.tag}</span>
                </div>
                <div style={{ fontSize: 10, color: T.textMuted, lineHeight: 1.5, marginBottom: 6 }}>{src.desc}</div>
                <div style={{ fontSize: 10, color: T.gold, display: "flex", alignItems: "center", gap: 4 }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  Open source →
                </div>
              </div>
            </a>
          ))}
        </div>
        <div style={{ marginTop: 14, fontSize: 10, color: T.textMuted, lineHeight: 1.6 }}>
          All data on this tab is sourced from official government reports (DLD, Dubai Media Office), independent research firms (ValuStrat, REIDIN, Knight Frank, Cavendish Maxwell), and market aggregators (BetterHomes, Roya International, DXB Analytics). Every metric links to its primary source above. Last updated: Session 7 · April 2026.
        </div>
      </div>`;

if (s.includes(oldSources.substring(0, 60))) {
  s = s.replace(oldSources, newSources);
  fs.writeFileSync(p, s, "latin1");
  console.log("Sources panel replaced.");
} else {
  // Find and replace the sources section by unique string
  const marker = `        {["Dubai Land Department", "REIDIN Dec 2025"`;
  const endMarker = `        </div>\n    </div>\n  );\n}\n\nexport default MarketTab;`;
  const idx = s.indexOf(marker);
  if (idx > -1) {
    // Find the parent div start
    const sectionStart = s.lastIndexOf(`      {/* ── Sources footer`, idx);
    const sectionEnd = s.indexOf("</div>\n    </div>\n  );\n}", sectionStart) + "</div>\n    </div>\n  );\n}".length;
    s = s.substring(0, sectionStart) + newSources + "\n    </div>\n  );\n}\n\nexport default MarketTab;";
    fs.writeFileSync(p, s, "latin1");
    console.log("Sources panel replaced via fallback.");
  } else {
    console.log("Could not find sources section - checking file...");
    const lines = s.split("\n");
    lines.forEach((l, i) => { if (l.includes("Sources")) console.log(i+1, l.trim()); });
  }
}