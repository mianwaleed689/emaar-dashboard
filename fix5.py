f = open('src/EmaarDashboardV2.jsx', 'r', encoding='utf-8')
c = f.read()
f.close()

old = 'return ms && mf;'
new = 'const mt = projectTier === "All" || p.tier === projectTier; const my = projectHandover === "All" || (projectHandover === "2030+" ? parseInt(p.handover) >= 2030 : p.handover?.includes(projectHandover)); const mp = projectPriceMax >= 20 || !p.price || p.price <= projectPriceMax * 1e6; return ms && mf && mt && my && mp;'

if old in c:
    c = c.replace(old, new)
    open('src/EmaarDashboardV2.jsx', 'w', encoding='utf-8').write(c)
    print('Fixed!')
else:
    print('Not found')
