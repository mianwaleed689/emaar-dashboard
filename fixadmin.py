f = open('src/AdminPanel.jsx', 'r', encoding='utf-8')
c = f.read()
f.close()

old = '''                    {emaarProjects
                      .filter(p => !dataSearch || p.name.toLowerCase().includes(dataSearch.toLowerCase()) || (p.community || "").toLowerCase().includes(dataSearch.toLowerCase()))
                      .map((p, i) => {
                        const merged = getMergedProject(p);
                        const hasOverride = !!liveProjects[p.id];'''

new = '''                    {(() => {
                        const baseIds = new Set(emaarProjects.map(p => String(p.id)));
                        const firestoreOnly = Object.entries(liveProjects).filter(([id]) => !baseIds.has(id)).map(([id, data]) => ({ id, ...data }));
                        return [...emaarProjects, ...firestoreOnly];
                      })()
                      .filter(p => !dataSearch || (p.name||"").toLowerCase().includes(dataSearch.toLowerCase()) || (p.community || "").toLowerCase().includes(dataSearch.toLowerCase()))
                      .map((p, i) => {
                        const merged = getMergedProject(p);
                        const hasOverride = !!liveProjects[p.id];'''

if old in c:
    c = c.replace(old, new)
    open('src/AdminPanel.jsx', 'w', encoding='utf-8').write(c)
    print('Fixed!')
else:
    print('Not found')
