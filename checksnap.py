f = open('src/EmaarDashboardV2.jsx', 'r', encoding='utf-8')
c = f.read()
f.close()
idx = c.find('snap.forEach')
if idx == -1:
    idx = c.find('forEach(d =>')
print(repr(c[idx-50:idx+200]))
