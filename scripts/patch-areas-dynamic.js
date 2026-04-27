const fs = require('fs');
const path = 'src/admin/DataManagerV2/CommunitiesSection.jsx';
let content = fs.readFileSync(path, 'utf8');

// === Edit 1: Replace hardcoded AREAS with empty array + comment ===
const oldAreas = `const AREAS = [
  "Downtown", "Business Bay", "New Dubai", "Old Dubai", "Marina", "Dubai South",
  "Dubailand", "MBR City", "Bur Dubai", "Deira", "Dubai Harbour", "DIP", "JLT",
  "Expo City", "Waterfront", "CBD", "Suburban",
];`;

const newAreas = `// AREAS dropdown is now derived dynamically from community data via dynamicAreas useMemo
// Old hardcoded list kept here as fallback only if data is empty
const FALLBACK_AREAS = [
  "Bur Dubai", "Deira", "New Dubai", "Dubai South", "Dubailand",
  "Hatta", "Jebel Ali", "MBR City", "Trade Center", "Dubai Marina",
];`;

if (!content.includes(oldAreas)) {
  console.error('FAIL: Old AREAS constant not found exactly. Content may have changed.');
  process.exit(1);
}
content = content.replace(oldAreas, newAreas);
console.log('Edit 1: AREAS constant replaced');

// === Edit 2: Add dynamicAreas useMemo right after counts useMemo ===
const oldCountsEnd = `  }, [items]);

  // ──────────────────────────────────────────────────────────────────────────
  // FILTERING — applies search, category filter, area, cadastral toggle`;

const newCountsEnd = `  }, [items]);

  // Distinct area values derived from data (no more hardcoded list)
  const dynamicAreas = useMemo(() => {
    const set = new Set();
    items.forEach(c => {
      if (c.area && c.area.trim()) set.add(c.area.trim());
    });
    const arr = [...set].sort();
    return arr.length > 0 ? arr : FALLBACK_AREAS;
  }, [items]);

  // ──────────────────────────────────────────────────────────────────────────
  // FILTERING — applies search, category filter, area, cadastral toggle`;

if (!content.includes(oldCountsEnd)) {
  console.error('FAIL: counts useMemo end not found.');
  process.exit(1);
}
content = content.replace(oldCountsEnd, newCountsEnd);
console.log('Edit 2: dynamicAreas useMemo added');

// === Edit 3: Replace AREAS.map in filter dropdown with dynamicAreas.map ===
// Filter bar dropdown
const oldFilterAreas = `          <select value={fArea} onChange={e => setFArea(e.target.value)} style={inputStyle}>
            <option value="All">All Areas</option>
            {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>`;

const newFilterAreas = `          <select value={fArea} onChange={e => setFArea(e.target.value)} style={inputStyle}>
            <option value="All">All Areas</option>
            {dynamicAreas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>`;

if (!content.includes(oldFilterAreas)) {
  console.error('FAIL: Filter AREAS dropdown not found.');
  process.exit(1);
}
content = content.replace(oldFilterAreas, newFilterAreas);
console.log('Edit 3: Filter dropdown uses dynamicAreas');

// === Edit 4: Edit modal AREAS dropdown — needs different fix because modal is in different scope ===
// The edit modal is a separate component so it needs the areas passed in OR uses FALLBACK
// Easiest: pass dynamicAreas as a prop. Let me find and update.
const oldModalAreas = `              <select style={inputStyle} value={form.area} onChange={e => update("area", e.target.value)}>
                <option value="">-- Select area --</option>
                {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>`;

const newModalAreas = `              <select style={inputStyle} value={form.area} onChange={e => update("area", e.target.value)}>
                <option value="">-- Select area --</option>
                {(availableAreas || FALLBACK_AREAS).map(a => <option key={a} value={a}>{a}</option>)}
              </select>`;

if (!content.includes(oldModalAreas)) {
  console.error('FAIL: Modal AREAS dropdown not found.');
  process.exit(1);
}
content = content.replace(oldModalAreas, newModalAreas);
console.log('Edit 4: Modal dropdown uses availableAreas prop');

// === Edit 5: Add availableAreas prop to CommEditModal call ===
const oldModalCall = `      {editing !== null && (
        <CommEditModal
          initial={editing}
          allItems={items}
          onClose={() => setEditing(null)}
          onSave={save}
          saving={saving}
        />
      )}`;

const newModalCall = `      {editing !== null && (
        <CommEditModal
          initial={editing}
          allItems={items}
          availableAreas={dynamicAreas}
          onClose={() => setEditing(null)}
          onSave={save}
          saving={saving}
        />
      )}`;

if (!content.includes(oldModalCall)) {
  console.error('FAIL: Modal call site not found.');
  process.exit(1);
}
content = content.replace(oldModalCall, newModalCall);
console.log('Edit 5: Modal call passes availableAreas prop');

// === Edit 6: Add availableAreas to CommEditModal signature ===
const oldModalSig = `function CommEditModal({ initial, allItems, onClose, onSave, saving }) {`;
const newModalSig = `function CommEditModal({ initial, allItems, availableAreas, onClose, onSave, saving }) {`;

if (!content.includes(oldModalSig)) {
  console.error('FAIL: Modal signature not found.');
  process.exit(1);
}
content = content.replace(oldModalSig, newModalSig);
console.log('Edit 6: Modal signature accepts availableAreas');

fs.writeFileSync(path, content, 'utf8');
console.log('');
console.log('All edits applied successfully.');