f = open('src/EmaarDashboardV2.jsx', 'r', encoding='utf-8')
c = f.read()
f.close()

old = '''const merged = emaarProjects.map(p => {
            const override = overrides[String(p.id)];
            return override ? { ...p, ...override } : p;
          });
          setLiveProjects(overrides);
          const baseIds = new Set(emaarProjects.map(p => String(p.id)));
          const newProjects = Object.entries(overrides).filter(([id]) => !baseIds.has(id)).map(([id, data]) => ({ id, ...data }));
          setExtraProjects(newProjects);'''

new = '''const merged = emaarProjects.map(p => {
            const override = overrides[String(p.id)] || overrides["project_" + p.id];
            return override ? { ...p, ...override } : p;
          });
          setLiveProjects(overrides);
          const baseIds = new Set(emaarProjects.map(p => String(p.id)));
          const basePrefixIds = new Set(emaarProjects.map(p => "project_" + p.id));
          const newProjects = Object.entries(overrides).filter(([id]) => !baseIds.has(id) && !basePrefixIds.has(id)).map(([id, data]) => ({ id, ...data }));
          setExtraProjects(newProjects);'''

if old in c:
    c = c.replace(old, new)
    open('src/EmaarDashboardV2.jsx', 'w', encoding='utf-8').write(c)
    print('Fixed!')
else:
    print('Not found')
