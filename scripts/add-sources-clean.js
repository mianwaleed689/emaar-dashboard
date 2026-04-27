const fs = require("fs");
const p = "src/tabs/MarketTab.jsx";
let s = fs.readFileSync(p, "latin1");

// Find the sources footer section and replace just that part
const oldFooter = `      {/* \u00e2\u0080\u0094\u00e2\u0080\u0094 Sources footer \u00e2\u0080\u0094\u00e2\u0080\u0094\u00e2\u0080\u0094\u00e2\u0080\u0094\u00e2\u0080\u0094\u00e2\u0080\u0094\u00e2\u0080\u0094\u00e2\u0080\u0094\u00e2\u0080\u0094\u00e2\u0080\u0094\u00e2\u0080\u0094\u00e2\u0080\u0094\u00e2\u0080\u0094\u00e2\u0080\u0094\u00e2\u0080\u0094\u00e2\u0080\u0094\u00e2\u0080\u0094\u00e2\u0080\u0094\u00e2\u0080\u0094\u00e2\u0080\u0094\u00e2\u0080\u0094\u00e2\u0080\u0094 */}`;

// Just find "Sources footer" comment and replace the whole div after it
const idx = s.indexOf("Sources footer");
if (idx === -1) { console.log("Marker not found"); process.exit(1); }

// Find the start of that comment block
const blockStart = s.lastIndexOf("{/*", idx);
// Find the end — next closing </div> after the sources tags map
const endMarker = "</div>\n    </div>\n  );\n}";
const blockEnd = s.indexOf(endMarker, blockStart) + endMarker.length;

const sourcesPanel = `      {/* Sources panel */}
      <div style={{ paddingTop: 20, borderTop: \`1px solid \${T.border}\` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.textSecondary, marginBottom: 14, letterSpacing: 1, textTransform: "uppercase" }}>Primary Sources — Verify Any Number</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 10 }}>
          {[
            { name: "DLD Full Year 2025 — Dubai Media Office", desc: "270,000+ transactions · AED 917B · investor base 193,100 · women investors AED 154B", url: "https://mediaoffice.ae/en/news/2026/january/12-01/dubais-real-estate-market-records-new-historic-milestone", tag: "DLD Official" },
            { name: "DLD — AED 761B in 2024", desc: "226,000 transactions · AED 761B · +36% volume +20% value YoY", url: "https://dubailand.gov.ae/en/news-media/dubai-s-real-estate-sector-records-aed761-billion-in-transactions-in-2024", tag: "DLD Official" },
            { name: "Gulf News — Dubai closes 2025 with AED 682.5B in sales", desc: "Sales-only: 214,912 transactions · Q4 monthly records breakdown", url: "https://gulfnews.com/business/property/dubai-property-market-closes-2025-with-record-dh6825-billion-in-sales-1.500396068", tag: "Gulf News" },
            { name: "Zawya — Dubai real estate market hits AED 682.5B", desc: "Off-plan 62.6% · 50,974 mortgage transactions · AED 179.26B mortgage value", url: "https://www.zawya.com/en/press-release/research-and-studies/dubai-real-estate-market-hits-aed-6825bln-with-214-912-transactions-in-2025-lnxen66w", tag: "Zawya" },
            { name: "ValuStrat VPI — December 2025", desc: "Citywide AED 1,689/sqft · +19.8% YoY · Villas +25.5% · Apts +14.8%", url: "https://valustrat.com/products/vpi-dubai-residential-capital-values-december-2025", tag: "ValuStrat" },
            { name: "REIDIN — UAE Residential Property Price Report", desc: "REIDIN Dec 2025: +12.88% YoY · Villas +15.16% · Apts +12.52% · Yield 6.55%", url: "https://reidin.com", tag: "REIDIN" },
            { name: "Knight Frank — Dubai Residential Q3 2025", desc: "Values +10% YoY · supply delivery rate 46% · 2026 forecast: +3% prime / +1% mainstream", url: "https://www.knightfrank.ae/newsroom/article/2025/11/dubai-residential-market-review-q3-2025", tag: "Knight Frank" },
            { name: "BetterHomes — Dubai Residential FY2025", desc: "Off-plan 65% of volume · 132,000 off-plan transactions · AED 248B apartment off-plan value", url: "https://www.constructionweekonline.com/analysis/dubai-off-plan-sales-2025", tag: "BetterHomes" },
            { name: "Cavendish Maxwell — Q3 2025 Residential Report", desc: "~98K units forecast 2026 · 366K through 2028 · off-plan 76% of Q3 transactions", url: "https://cavendishmaxwell.com/insights/market-reports/residential/dubai-residential-market-performance-q3-2025", tag: "Cavendish Maxwell" },
            { name: "Global Property Guide — UAE 2026 Analysis", desc: "Multi-source synthesis: DLD + REIDIN + ValuStrat + Knight Frank · yield benchmarks", url: "https://www.globalpropertyguide.com/middle-east/united-arab-emirates/price-history", tag: "Global Property Guide" },
            { name: "DXB Analytics — Dubai Property Price Index 2026", desc: "Full year 2025: AED 1,863 avg PPSF · Jan 2026: AED 1,976 · sourced from DLD via Dubai Pulse", url: "https://www.dxbanalytics.com/blog/dubai-property-price-index-2026", tag: "DXB Analytics" },
            { name: "Roya International — Dubai RE Market Report 2025", desc: "Comprehensive synthesis with methodology: DLD + ValuStrat + REIDIN + Knight Frank", url: "https://royainternational.co.uk/pages/market-reports.php", tag: "Roya International" },
            { name: "DLD 2020 Annual — Dubai Media Office", desc: "2020: 51,414 transactions · AED 175B · Covid year V-shaped recovery", url: "https://mediaoffice.ae/en/news/2021/Feb/03-02/souq-dubai", tag: "DLD 2020" },
            { name: "UAE Moments — Dubai Real Estate 2022 Record", desc: "2022: 122,658 transactions · AED 528B · first half-trillion year · +44.7% volume", url: "https://www.uaemoments.com/amp/dubais-real-estate-transactions-hit-a-record-high-in-2022-553424.html", tag: "DLD 2022" },
            { name: "The National — Dubai 2023 Record", desc: "2023: 166,400 transactions · AED 634B · +36% volume · +20% value YoY", url: "https://www.thenationalnews.com/business/property/2024/02/07/dubais-real-estate-transactions-surge-17-to-record-16-million-in-2023/", tag: "DLD 2023" },
          ].map(src => (
            <a key={src.name} href={src.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
              <div style={{ background: "rgba(255,255,255,0.02)", border: \`1px solid \${T.border}\`, borderRadius: 10, padding: "12px 14px", cursor: "pointer" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold + "60"; e.currentTarget.style.background = "rgba(212,168,67,0.04)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.white, lineHeight: 1.4 }}>{src.name}</span>
                  <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 8, background: "rgba(212,168,67,0.1)", color: T.gold, whiteSpace: "nowrap", flexShrink: 0 }}>{src.tag}</span>
                </div>
                <div style={{ fontSize: 10, color: T.textMuted, lineHeight: 1.5, marginBottom: 6 }}>{src.desc}</div>
                <div style={{ fontSize: 10, color: T.gold }}>Open source →</div>
              </div>
            </a>
          ))}
        </div>
        <div style={{ marginTop: 14, fontSize: 10, color: T.textMuted, lineHeight: 1.6 }}>
          All data sourced from official DLD reports, independent research firms (ValuStrat, REIDIN, Knight Frank, Cavendish Maxwell), and market aggregators. Every metric links to its primary source above. Last updated: Session 7 · April 2026.
        </div>
      </div>
    </div>
  );
}

export default MarketTab;`;

s = s.substring(0, blockStart) + sourcesPanel;
fs.writeFileSync(p, s, "latin1");

// Verify
const result = fs.readFileSync(p, "latin1");
const lines = result.split("\n");
console.log("Total lines:", lines.length);
console.log("Last 5 lines:");
lines.slice(-5).forEach((l, i) => console.log(lines.length - 4 + i, l));