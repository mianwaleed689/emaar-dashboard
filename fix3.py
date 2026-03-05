content = open('src/EmaarDashboardV2.jsx', 'r', encoding='utf-8')
c = content.read()
content.close()

c = c.replace(
    'import { T, emaarProjects, emaarFinancials, emaarCommunities, emaarYields, topDevelopers, emaarRisks, dubaiMarket, dubaiSalesHistory, roiPhases, emaarSegments, radarData, megaProjects, communityIntel } from "./data";',
    'import { T, emaarProjects, emaarFinancials, emaarCommunities, emaarYields, topDevelopers, emaarRisks, dubaiMarket, dubaiSalesHistory, roiPhases, emaarSegments, radarData, megaProjects, communityIntel, communityROI } from "./data";'
)

roi = """
              {/* ROI Estimate */}
              {(() => {
                const roi = communityROI[selectedProject_.community];
                if (!roi) return null;
                const price = selectedProject_.price || 0;
                const gross = roi.grossYield?.apt1 || roi.grossYield?.th || roi.grossYield?.villa || 0;
                const net = roi.netYield?.apt1 || roi.netYield?.th || roi.netYield?.villa || 0;
                const appr5 = roi.appreciation5yr || 0;
                const projValue = price > 0 ? price * (1 + appr5/100) : 0;
                const annualRent = roi.estRent?.apt1 || roi.estRent?.th || roi.estRent?.villa || 0;
                return (
                  <ProGate isPro={isPro} message="Unlock ROI Calculator" onUpgrade={() => setShowUpgrade(true)}>
                  <div style={{ marginBottom: 16, background: "linear-gradient(135deg, rgba(16,185,129,0.06), rgba(212,168,67,0.04))", borderRadius: 12, padding: 16, border: "1px solid rgba(16,185,129,0.2)" }}>
                    <h3 style={{ fontSize: 11, fontWeight: 700, color: T.green, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>ROI Estimate</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
                      {[
                        { label: "Gross Yield", value: gross + "%", color: T.green },
                        { label: "Net Yield", value: net + "%", color: T.teal },
                        { label: "5-Yr Appreciation", value: "+" + appr5 + "%", color: T.gold },
                        { label: "Annual YoY", value: "+" + (roi.appreciationYoY || 0) + "%", color: T.blue },
                      ].map((item, i) => (
                        <div key={i} style={{ background: T.surfaceAlt, borderRadius: 8, padding: 10, textAlign: "center" }}>
                          <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{item.label}</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: item.color, fontFamily: "Fraunces, serif" }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                      {price > 0 && <div style={{ background: T.surfaceAlt, borderRadius: 8, padding: 10 }}>
                        <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Est. 5-Yr Value</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.gold }}>AED {(projValue/1e6).toFixed(2)}M</div>
                        <div style={{ fontSize: 9, color: T.green }}>+AED {((projValue-price)/1e6).toFixed(2)}M gain</div>
                      </div>}
                      {annualRent > 0 && <div style={{ background: T.surfaceAlt, borderRadius: 8, padding: 10 }}>
                        <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Est. Annual Rent</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.teal }}>AED {annualRent.toLocaleString()}</div>
                        <div style={{ fontSize: 9, color: T.textMuted }}>1BR estimate</div>
                      </div>}
                      <div style={{ background: T.surfaceAlt, borderRadius: 8, padding: 10 }}>
                        <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Golden Visa</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: roi.goldenVisa ? T.green : T.textMuted }}>{roi.goldenVisa ? "Eligible" : "Not Eligible"}</div>
                        <div style={{ fontSize: 9, color: T.textMuted }}>{roi.goldenVisaNote}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 9, color: T.textMuted }}>Risk: <span style={{ color: roi.riskLevel === "Low" ? T.green : roi.riskLevel === "Medium" ? T.gold : T.red }}>{roi.riskLevel}</span> · Occupancy: {roi.occupancy ? roi.occupancy + "%" : "N/A"}</div>
                  </div>
                  </ProGate>
                );
              })()}

"""

c = c.replace('              {/* Contact CTAs */}', roi + '              {/* Contact CTAs */}')

open('src/EmaarDashboardV2.jsx', 'w', encoding='utf-8').write(c)
print('Done!' if roi in c or '/* Contact CTAs */' in c else 'ERROR: check file')
