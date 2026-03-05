f = open('src/ProjectManager.jsx', 'r', encoding='utf-8')
c = f.read()
f.close()
import re
cols = re.findall(r'collection\(db,\s*["\x27]([^"\']+)["\x27]\)', c)
print('Collections used in ProjectManager:', set(cols))
