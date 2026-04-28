const fs = require("fs");
let src = fs.readFileSync("src/tabs/NeighbourhoodsTab.jsx", "latin1");

// Add tier filter to toolbar and handle DLD registry cards differently
// Find the toolbar section and add tier filter
const oldSearch = `        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={selStyle}>`;
const newSearch = `        <select value={tierFilter} onChange={e=>setTierFilter(e.target.value)} style={selStyle}>
          <option value="all">All Communities</option>
          <option value="verified">✓ Verified (Emaar)</option>
          <option value="dld-registry">DLD Registry</option>
        </select>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={selStyle}>`;

if (src.includes(oldSearch)) {
  src = src.replace(oldSearch, newSearch);
  console.log("Tier filter added to toolbar");
} else {
  console.log("Toolbar pattern not found");
}

// Add tierFilter state
const oldState = `  const [view,    setView]    = useState("grid");`;
const newState = `  const [view,      setView]      = useState("grid");
  const [tierFilter, setTierFilter] = useState("all");`;

if (src.includes(oldState)) {
  src = src.replace(oldState, newState);
  console.log("tierFilter state added");
} else {
  console.log("State pattern not found");
}

// Add tierFilter to filtered useMemo
const oldFilter = `    if(search.trim()) a = a.filter(n=>(n.community||"").toLowerCase().includes(search.toLowerCase()));`;
const newFilter = `    if(search.trim()) a = a.filter(n=>(n.community||"").toLowerCase().includes(search.toLowerCase()));
    if(tierFilter!=="all") a = a.filter(n=>n.tier===tierFilter);`;

if (src.includes(oldFilter)) {
  src = src.replace(oldFilter, newFilter);
  console.log("tierFilter applied to filtered list");
} else {
  console.log("Filter pattern not found");
}

// Add tierFilter to dependencies
src = src.replace(
  `  },[liveNeighbourhoods,search,sortBy]);`,
  `  },[liveNeighbourhoods,search,sortBy,tierFilter]);`
);

fs.writeFileSync("src/tabs/NeighbourhoodsTab.jsx", src, "utf8");
console.log("Done");