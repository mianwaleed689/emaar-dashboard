// scripts/add-tier-grouping.js
// Migration: convert flat commOptions string array into tier-organized objects,
// and render the dropdown with native <optgroup> for Consumer/Master/Sub tiers.
// Idempotent — safe to run multiple times (each edit checks first).

const fs = require("fs");
const path = "src/tabs/ProjectsTab.jsx";
let content = fs.readFileSync(path, "utf8");

// ============================================================================
// EDIT 1: Replace flat commOptions block with tier-enriched version
// ============================================================================

const OLD_COMM_OPTIONS = `            // commOptions: full Firestore community list (user-facing only) merged with project-derived names
            // Session 5: data source = communities collection via useUserFacingCommunities hook
            const commNamesFromDb = (allCommunitiesFromDb || []).map(c => c.name).filter(Boolean);
            const commNamesFromProjects = rawProjects.filter(p => projMode === "All" || normalizeType(p)===projMode).map(p=>p.community).filter(Boolean);
            const commOptions = ["All", ...new Set([...commNamesFromDb, ...commNamesFromProjects])].slice(0, 500);`;

const NEW_COMM_OPTIONS = `            // commOptions: tier-organized community list (Session 5 hierarchy)
            // Pulls from Firestore via useUserFacingCommunities, groups by displayCategory.
            // Sub-communities show parent prefix (e.g. "Dubai Hills Estate > Maple 1").
            const dbByName = new Map();
            (allCommunitiesFromDb || []).forEach(c => { if (c.name) dbByName.set(c.name, c); });
            const projectNames = new Set(rawProjects.filter(p => projMode === "All" || normalizeType(p)===projMode).map(p=>p.community).filter(Boolean));
            const allNames = new Set([...dbByName.keys(), ...projectNames]);
            const TIER_ORDER = { "consumer-community": 1, "master-community": 2, "sub-community": 3 };
            const enrichedComms = Array.from(allNames).map(name => {
              const doc = dbByName.get(name);
              const tier = doc?.displayCategory || "unknown";
              const parentId = doc?.parentCommunity || null;
              const parentDoc = parentId ? (allCommunitiesFromDb || []).find(c => c.id === parentId) : null;
              const parentName = parentDoc?.name || null;
              return {
                value: name,
                label: name,
                tier,
                tierOrder: TIER_ORDER[tier] || 99,
                parentName,
                projectCount: doc?.totalProjects || 0,
              };
            }).sort((a, b) => {
              if (a.tierOrder !== b.tierOrder) return a.tierOrder - b.tierOrder;
              return a.label.localeCompare(b.label);
            });
            const commOptionsByTier = {
              consumer: enrichedComms.filter(c => c.tier === "consumer-community"),
              master:   enrichedComms.filter(c => c.tier === "master-community"),
              sub:      enrichedComms.filter(c => c.tier === "sub-community"),
              other:    enrichedComms.filter(c => !TIER_ORDER[c.tier]),
            };
            // Legacy flat array kept for backward compat
            const commOptions = ["All", ...enrichedComms.map(c => c.value)].slice(0, 500);`;

if (content.includes("commOptionsByTier")) {
  console.log("Edit 1: SKIP (already applied — commOptionsByTier present)");
} else if (!content.includes(OLD_COMM_OPTIONS)) {
  console.error("Edit 1: FAIL — old commOptions block not found exactly. Has the file changed?");
  process.exit(1);
} else {
  content = content.replace(OLD_COMM_OPTIONS, NEW_COMM_OPTIONS);
  console.log("Edit 1: applied — commOptions enriched with tier metadata");
}

// ============================================================================
// EDIT 2: Replace flat dropdown render with tiered <optgroup> version
// ============================================================================

const OLD_DROPDOWN = `                          <select value={projCommunity} onChange={e => setProjCommunity(e.target.value)} style={{
                            width: "100%", padding: "10px 12px",
                            background: "rgba(255,255,255,0.04)",
                            border: \`1px solid \${projCommunity !== "All" ? "rgba(212,168,67,0.4)" : "rgba(255,255,255,0.08)"}\`,
                            borderRadius: 8,
                            color: projCommunity !== "All" ? T.gold : T.white,
                            fontSize: 13, fontWeight: projCommunity !== "All" ? 600 : 500,
                            fontFamily: "'Outfit',sans-serif", cursor: "pointer",
                          }}>
                            {(commOptions || ["All"]).map(c => (
                              <option key={c} value={c}>{c === "All" ? "All Communities" : c}</option>
                            ))}
                          </select>`;

const NEW_DROPDOWN = `                          <select value={projCommunity} onChange={e => setProjCommunity(e.target.value)} style={{
                            width: "100%", padding: "10px 12px",
                            background: "rgba(255,255,255,0.04)",
                            border: \`1px solid \${projCommunity !== "All" ? "rgba(212,168,67,0.4)" : "rgba(255,255,255,0.08)"}\`,
                            borderRadius: 8,
                            color: projCommunity !== "All" ? T.gold : T.white,
                            fontSize: 13, fontWeight: projCommunity !== "All" ? 600 : 500,
                            fontFamily: "'Outfit',sans-serif", cursor: "pointer",
                          }}>
                            <option value="All">All Communities</option>
                            {commOptionsByTier.consumer.length > 0 && (
                              <optgroup label={\`— Consumer Communities (\${commOptionsByTier.consumer.length}) —\`}>
                                {commOptionsByTier.consumer.map(c => (
                                  <option key={c.value} value={c.value}>
                                    {c.label}{c.projectCount > 0 ? \` · \${c.projectCount}\` : ""}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            {commOptionsByTier.master.length > 0 && (
                              <optgroup label={\`— Master Communities (\${commOptionsByTier.master.length}) —\`}>
                                {commOptionsByTier.master.map(c => (
                                  <option key={c.value} value={c.value}>
                                    {c.label}{c.projectCount > 0 ? \` · \${c.projectCount}\` : ""}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            {commOptionsByTier.sub.length > 0 && (
                              <optgroup label={\`— Sub-Communities (\${commOptionsByTier.sub.length}) —\`}>
                                {commOptionsByTier.sub.map(c => {
                                  const cleaned = c.parentName
                                    ? c.label.replace(c.parentName + " - ", "").replace(c.parentName + " ", "").replace(c.parentName, "").replace(/^- /, "").replace(/^---+/, "").trim()
                                    : c.label;
                                  const display = c.parentName && cleaned && cleaned !== c.label
                                    ? \`\${c.parentName} → \${cleaned}\`
                                    : c.label;
                                  return (
                                    <option key={c.value} value={c.value}>{display}</option>
                                  );
                                })}
                              </optgroup>
                            )}
                            {commOptionsByTier.other.length > 0 && (
                              <optgroup label={\`— Other (\${commOptionsByTier.other.length}) —\`}>
                                {commOptionsByTier.other.map(c => (
                                  <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                              </optgroup>
                            )}
                          </select>`;

if (content.includes("commOptionsByTier.consumer")) {
  console.log("Edit 2: SKIP (already applied — optgroup hierarchy present)");
} else if (!content.includes(OLD_DROPDOWN)) {
  console.error("Edit 2: FAIL — old dropdown JSX not found exactly.");
  process.exit(1);
} else {
  content = content.replace(OLD_DROPDOWN, NEW_DROPDOWN);
  console.log("Edit 2: applied — dropdown now uses optgroup tiers");
}

fs.writeFileSync(path, content, "utf8");
console.log("");
console.log("Done. ProjectsTab.jsx now has hierarchical community dropdown.");
