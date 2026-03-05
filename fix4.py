f = open('src/EmaarDashboardV2.jsx', 'r', encoding='utf-8')
c = f.read()
f.close()

# Fix the no-results check
old = 'filter(p => { const ms = !projectSearch || p.name.toLowerCase().includes(projectSearch.toLowerCase()) || p.community.toLowerCase().includes(projectSearch.toLowerCase()); const mf = projectFilter === "All" || p.district === projectFilter || (projectFilter === "Branded" && p.branded); return ms && mf; }).length === 0'
new = 'filter(p => { const ms = !projectSearch || p.name.toLowerCase().includes(projectSearch.toLowerCase()) || p.community.toLowerCase().includes(projectSearch.toLowerCase()); const mf = projectFilter === "All" || p.district === projectFilter || (projectFilter === "Branded" && p.branded); const mt = projectTier === "All" || p.tier === projectTier; const my = projectHandover === "All" || (projectHandover === "2030+" ? parseInt(p.handover) >= 2030 : p.handover?.includes(projectHandover)); const mp = projectPriceMax >= 20 || !p.price || p.price <= projectPriceMax * 1e6; return ms && mf && mt && my && mp; }).length === 0'

if old in c:
    c = c.replace(old, new)
    print('no-results check fixed')
else:
    print('no-results check not found')

open('src/EmaarDashboardV2.jsx', 'w', encoding='utf-8').write(c)
