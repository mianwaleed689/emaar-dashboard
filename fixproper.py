f = open('src/EmaarDashboardV2.jsx', 'r', encoding='utf-8')
c = f.read()
f.close()

# Step 1: revert setLiveProjects back to object map, add extraProjects
old = '''const baseIds = new Set(emaarProjects.map(p => String(p.id)));
          const newProjects = Object.entries(overrides).filter(([id]) => !baseIds.has(id)).map(([id, data]) => ({ id, ...data }));
          setLiveProjects([...merged, ...newProjects]);'''

new = '''setLiveProjects(overrides);
          const baseIds = new Set(emaarProjects.map(p => String(p.id)));
          const newProjects = Object.entries(overrides).filter(([id]) => !baseIds.has(id)).map(([id, data]) => ({ id, ...data }));
          setExtraProjects(newProjects);'''

if old in c:
    c = c.replace(old, new)
    print('Step 1 done')
else:
    print('Step 1 not found')

# Step 2: add extraProjects state near liveProjects state
old2 = 'const [liveProjects, setLiveProjects] = useState(null);'
new2 = 'const [liveProjects, setLiveProjects] = useState({});\n  const [extraProjects, setExtraProjects] = useState([]);'

if old2 in c:
    c = c.replace(old2, new2)
    print('Step 2 done')
else:
    print('Step 2 not found')

# Step 3: update activeProjects to include extraProjects
old3 = 'const activeProjects = liveProjects || emaarProjects;'
new3 = 'const activeProjects = [...emaarProjects.map(p => { const ov = liveProjects[String(p.id)]; return ov ? { ...p, ...ov } : p; }), ...extraProjects];'

if old3 in c:
    c = c.replace(old3, new3)
    print('Step 3 done')
else:
    print('Step 3 not found')

open('src/EmaarDashboardV2.jsx', 'w', encoding='utf-8').write(c)
