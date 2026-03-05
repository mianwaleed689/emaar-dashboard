f = open('src/EmaarDashboardV2.jsx', 'r', encoding='utf-8')
c = f.read()
f.close()

old = '''const overrides = {};
          snapshot.forEach(doc => { overrides[String(doc.id)] = doc.data(); });
          const merged = emaarProjects.map(p => { const override = overrides[String(p.id)]; return override ? { ...p, ...override } : p; });
          setActiveProjects(merged);'''

new = '''const overrides = {};
          snapshot.forEach(doc => { overrides[String(doc.id)] = doc.data(); });
          const merged = emaarProjects.map(p => { const override = overrides[String(p.id)]; return override ? { ...p, ...override } : p; });
          const baseIds = new Set(emaarProjects.map(p => String(p.id)));
          const newProjects = Object.entries(overrides).filter(([id]) => !baseIds.has(id)).map(([id, data]) => ({ id, ...data }));
          setActiveProjects([...merged, ...newProjects]);'''

if old in c:
    c = c.replace(old, new)
    f = open('src/EmaarDashboardV2.jsx', 'w', encoding='utf-8')
    f.write(c)
    f.close()
    print('Fixed!')
else:
    print('Not found - check merge logic')
