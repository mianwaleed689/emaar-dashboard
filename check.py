content = open('src/EmaarDashboardV2.jsx', 'r', encoding='utf-8').read()
idx = content.find('Search & Filters')
print(repr(content[idx:idx+500]))
