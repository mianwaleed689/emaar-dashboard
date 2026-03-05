import re
with open('src/data.js', 'rb') as f:
    raw = f.read()
print('File size:', len(raw))
tiers = re.findall(rb'tier:"([^"]+)"', raw)
unique = sorted(set(tiers))
print('Tiers found:', len(unique))
for t in unique:
    print(t.decode())
