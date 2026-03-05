f = open('src/EmaarDashboardV2.jsx', 'r', encoding='utf-8')
c = f.read()
f.close()
idx = c.find('liveProjects,')
if idx == -1:
    idx = c.find('const [liveProjects')
print(repr(c[idx:idx+200]))
