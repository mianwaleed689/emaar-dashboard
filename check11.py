f = open('src/AdminPanel.jsx', 'r', encoding='utf-8')
c = f.read()
f.close()
idx = c.find('emaarProjects\n')
if idx == -1:
    idx = c.find('emaarProjects.filter')
if idx == -1:
    idx = c.find('emaarProjects.map')
print(repr(c[idx-50:idx+400]))
