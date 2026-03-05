content = open('src/EmaarDashboardV2.jsx', 'r', encoding='utf-8').read()

content = content.replace(
    'const [projectFilter, setProjectFilter] = useState("All");',
    'const [projectFilter, setProjectFilter] = useState("All");\n  const [projectTier, setProjectTier] = useState("All");\n  const [projectHandover, setProjectHandover] = useState("All");\n  const [projectPriceMax, setProjectPriceMax] = useState(20);'
)

content = content.replace(
    'const matchFilter = projectFilter === "All" || p.district === projectFilter || (projectFilter === "Branded" && p.branded);\n                  return matchSearch && matchFilter;',
    'const matchFilter = projectFilter === "All" || p.district === projectFilter || (projectFilter === "Branded" && p.branded);\n                  const matchTier = projectTier === "All" || p.tier === projectTier;\n                  const matchHandover = projectHandover === "All" || (projectHandover === "2030+" ? parseInt(p.handover) >= 2030 : p.handover?.includes(projectHandover));\n                  const matchPrice = projectPriceMax >= 20 || !p.price || p.price <= projectPriceMax * 1e6;\n                  return matchSearch && matchFilter && matchTier && matchHandover && matchPrice;'
)

open('src/EmaarDashboardV2.jsx', 'w', encoding='utf-8').write(content)
print('Done!')
