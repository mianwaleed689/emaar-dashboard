f = open('src/AdminPanel.jsx', 'r', encoding='utf-8')
c = f.read()
f.close()

# Restore Data Manager to nav
c = c.replace(
    '    { id: "projects", label: "Project Manager", icon: I.projects },',
    '    { id: "data", label: "Data Manager", icon: I.data },\n    { id: "projects", label: "Project Manager", icon: I.projects },'
)

# Restore default tab
c = c.replace('useState("projects")', 'useState("data")')

open('src/AdminPanel.jsx', 'w', encoding='utf-8').write(c)
print('Done!')
