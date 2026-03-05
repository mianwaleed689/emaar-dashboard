f = open('src/EmaarDashboardV2.jsx', 'r', encoding='utf-8')
c = f.read()
f.close()

old = 'const activeProjects = [...emaarProjects.map(p => { const ov = liveProjects[String(p.id)]; return ov ? { ...p, ...ov } : p; }), ...extraProjects];'
new = 'const activeProjects = [...emaarProjects.map(p => { const ov = liveProjects[String(p.id)] || liveProjects["project_"+p.id]; return ov ? { ...p, ...ov } : p; }), ...extraProjects];'

if old in c:
    c = c.replace(old, new)
    open('src/EmaarDashboardV2.jsx', 'w', encoding='utf-8').write(c)
    print('Fixed!')
else:
    print('Not found')
