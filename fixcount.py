f = open('src/EmaarDashboardV2.jsx', 'r', encoding='utf-8')
c = f.read()
f.close()
c = c.replace(
    'label="Total Projects" value="48"',
    'label="Total Projects" value={activeProjects.length}'
)
open('src/EmaarDashboardV2.jsx', 'w', encoding='utf-8').write(c)
print('Fixed!' if 'activeProjects.length' in c else 'Not found')
