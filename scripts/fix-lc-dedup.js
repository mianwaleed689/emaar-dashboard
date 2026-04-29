const fs = require("fs");
let src = fs.readFileSync("src/tabs/LaunchCalendarTab.jsx","utf8");

// Fix duplicate — liveProjects already merged in dashboard
src = src.replace(
  `const allProjects = useMemo(()=>[
    ...(liveProjects||[]),
    ...(extraProjects||[]),
  ].filter(p=>!p.archived),[liveProjects,extraProjects]);`,
  `const allProjects = useMemo(()=>
    [...(liveProjects||[]),...(extraProjects||[])]
    .filter(p=>!p.archived)
    .filter((p,i,arr)=>arr.findIndex(x=>x.id===p.id||x.name===p.name)===i)
  ,[liveProjects,extraProjects]);`
);

fs.writeFileSync("src/tabs/LaunchCalendarTab.jsx", src, "utf8");
console.log("Fixed dedup");