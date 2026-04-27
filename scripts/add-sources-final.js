const fs = require("fs");
const p = "src/tabs/MarketTab.jsx";
let s = fs.readFileSync(p, "latin1");

const oldBlock = `                {/* Data sources */}
                <div style={{ paddingTop: 16, borderTop: \`1px solid \${T.border}\`, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: T.textMuted }}>Sources:</span>
                  {["Dubai Land Department", "REIDIN Dec 2025", "ValuStrat Q4 2025", "Knight Frank", "CW Core", "Fitch Ratings", "Gulf News Property"].map((s, i) => (
                    <span key={i} style={{ fontSize: 10, color: T.textMuted, padding: "2px 8px", borderRadius: 10, border: \`1px solid \${T.border}\`, background: T.surfaceAlt }}>{s}</span>
                  ))}
                </div>`;

const newBlock = `                {/* Sources panel */}
                <div style={{ paddingTop: 20, borderTop: \`1px solid \${T.border}\` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, marginBottom: 12, letterSpacing: 1, textTransform: "uppercase" }}>Primary Sources — Click to Verify</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 8 }}>
                    {[
                      { name: "DLD Full Year 2025 — Dubai Media Office", desc: "270,000+ transactions · AED 917B · investor base 193,100", url: "https://mediaoffice.ae/en/news/2026/january/12-01/dubais-real-estate-market-records-new-historic-milestone", tag: "DLD Official" },
                      { name: "DLD — AED 761B in 2024", desc: "226,000 transactions · AED 761B · +36% volume +20% value YoY", url: "https://dubailand.gov.ae/en/news-media/dubai-s-real-estate-sector-records-aed761-billion-in-transactions-in-2024", tag: "DLD Official" },
                      { name: "Gulf News — Dubai closes 2025 at AED 682.5B", desc: "Sales-only: 214,912 transactions · Q4 monthly records", url: "https://gulfnews.com/business/property/dubai-property-market-closes-2025-with-record-dh6825-billion-in-sales-1.500396068", tag: "Gulf News" },
                      { name: "Zawya — Dubai RE market hits AED 682.5B", desc: "Off-plan 62.6% · 50,974 mortgage deals · AED 179.26B mortgage value", url: "https://www.zawya.com/en/press-release/research-and-studies/dubai-real-estate-market-hits-aed-6825bln-with-214-912-transactions-in-2025-lnxen66w", tag: "Zawya" },
                      { name: "ValuStrat VPI — December 2025", desc: "AED 1,689/sqft citywide · +19.8% YoY · Villas +25.5%", url: "https://valustrat.com/products/vpi-dubai-residential-capital-values-december-2025", tag: "ValuStrat" },
                      { name: "REIDIN — UAE Residential Price Report", desc: "+12.88% YoY Dec 2025 · Villas +15.16% · Yield 6.55%", url: "https://reidin.com", tag: "REIDIN" },
                      { name: "Knight Frank — Dubai Residential Q3 2025", desc: "+10% YoY values · 46% delivery rate · 2026: +3%/+1%", url: "https://www.knightfrank.ae/newsroom/article/2025/11/dubai-residential-market-review-q3-2025", tag: "Knight Frank" },
                      { name: "BetterHomes — Dubai Residential FY2025", desc: "Off-plan 65% · 132,000 off-plan deals · AED 248B apts", url: "https://www.constructionweekonline.com/analysis/dubai-off-plan-sales-2025", tag: "BetterHomes" },
                      { name: "Cavendish Maxwell — Q3 2025", desc: "~98K units 2026 · 366K through 2028 · Q3 off-plan 76%", url: "https://cavendishmaxwell.com/insights/market-reports/residential/dubai-residential-market-performance-q3-2025", tag: "Cavendish Maxwell" },
                      { name: "DXB Analytics — Price Index 2026", desc: "FY2025: AED 1,863 avg PPSF · Jan 2026: AED 1,976", url: "https://www.dxbanalytics.com/blog/dubai-property-price-index-2026", tag: "DXB Analytics" },
                      { name: "Roya International — Dubai RE Report 2025", desc: "Full methodology: DLD + ValuStrat + REIDIN + Knight Frank", url: "https://royainternational.co.uk/pages/market-reports.php", tag: "Roya International" },
                      { name: "Global Property Guide — UAE 2026", desc: "Multi-source synthesis with yield benchmarks", url: "https://www.globalpropertyguide.com/middle-east/united-arab-emirates/price-history", tag: "Global Prop Guide" },
                      { name: "DLD 2020 Annual — Media Office", desc: "51,414 transactions · AED 175B · Covid year recovery", url: "https://mediaoffice.ae/en/news/2021/Feb/03-02/souq-dubai", tag: "DLD 2020" },
                      { name: "UAE Moments — 2022 Record Year", desc: "122,658 transactions · AED 528B · first half-trillion year", url: "https://www.uaemoments.com/amp/dubais-real-estate-transactions-hit-a-record-high-in-2022-553424.html", tag: "DLD 2022" },
                      { name: "The National — 2023 Record", desc: "166,400 transactions · AED 634B · +36% volume YoY", url: "https://www.thenationalnews.com/business/property/2024/02/07/dubais-real-estate-transactions-surge-17-to-record-16-million-in-2023/", tag: "DLD 2023" },
                    ].map(src => (
                      <a key={src.name} href={src.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                        <div style={{ background: "rgba(255,255,255,0.02)", border: \`1px solid \${T.border}\`, borderRadius: 10, padding: "10px 12px" }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold + "60"; e.currentTarget.style.background = "rgba(212,168,67,0.04)"; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 5 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: T.white, lineHeight: 1.4 }}>{src.name}</span>
                            <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 8, background: "rgba(212,168,67,0.1)", color: T.gold, whiteSpace: "nowrap", flexShrink: 0 }}>{src.tag}</span>
                          </div>
                          <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 5 }}>{src.desc}</div>
                          <div style={{ fontSize: 10, color: T.gold }}>Open source \u2192</div>
                        </div>
                      </a>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, fontSize: 10, color: T.textMuted, lineHeight: 1.6 }}>
                    All data sourced from official DLD reports, independent research firms (ValuStrat, REIDIN, Knight Frank, Cavendish Maxwell), and market aggregators. Last updated: Session 7 \u00b7 April 2026.
                  </div>
                </div>`;

if (s.includes(oldBlock)) {
  s = s.replace(oldBlock, newBlock);
  fs.writeFileSync(p, s, "latin1");
  console.log("Done. Total lines:", s.split("\n").length);
} else {
  console.log("No match. Checking line 236...");
  const lines = s.split("\n");
  console.log(JSON.stringify(lines[235]));
}