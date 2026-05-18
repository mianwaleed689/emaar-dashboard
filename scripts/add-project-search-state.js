const fs = require('fs');
let c = fs.readFileSync('src/tabs/ProjectsTab.jsx', 'utf8');

// Add projSearch state after filtersOpen state
c = c.replace(
  'const [filtersOpen, setFiltersOpen] = useState(false);',
  'const [filtersOpen, setFiltersOpen] = useState(false);\n  const [projSearch, setProjSearch] = useState("");'
);

// Add search filter to the filtered array
// Find where filtered is defined
const filterIdx = c.indexOf('let filtered = activeProjects');
if (filterIdx < 0) {
  // Try alternate
  const alt = c.indexOf('.filter(p =>');
  console.log('Filter not found directly, alt at:', alt);
} else {
  console.log('Found filtered at:', filterIdx);
}

// Find the existing filter chain and add search at the beginning
const searchFilter = `
  // Project name/developer/community search
  if (projSearch && projSearch.trim()) {
    const sq = projSearch.toLowerCase().trim();
    filtered = filtered.filter(p =>
      (p.project||p.name||"").toLowerCase().includes(sq) ||
      (p.developer||"").toLowerCase().includes(sq) ||
      (p.community||p.areaName||"").toLowerCase().includes(sq) ||
      (p.masterProject||p.masterCommunity||"").toLowerCase().includes(sq)
    );
  }`;

// Find where to insert - after the initial filtered definition
const filteredStart = c.indexOf('let filtered =');
if (filteredStart > 0) {
  // Find end of that statement
  const lineEnd = c.indexOf('\n', filteredStart);
  c = c.substring(0, lineEnd + 1) + searchFilter + c.substring(lineEnd + 1);
  console.log('Added search filter');
} else {
  console.log('Could not find filtered definition');
}

fs.writeFileSync('src/tabs/ProjectsTab.jsx', c, 'utf8');
console.log('Done. Has projSearch state:', c.includes("useState(\"\")") && c.includes('projSearch'));
