f = open('src/AdminPanel.jsx', 'r', encoding='utf-8')
c = f.read()
f.close()

# Remove Data Manager from nav
c = c.replace('    { id: "data", label: "Data Manager", icon: I.data },\n', '')

# Change default tab from data to projects if needed
c = c.replace('useState("data")', 'useState("projects")')
c = c.replace("useState('data')", "useState('projects')")

open('src/AdminPanel.jsx', 'w', encoding='utf-8').write(c)
print('Done!')
