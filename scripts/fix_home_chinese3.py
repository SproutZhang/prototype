"""Final targeted fix for remaining corrupted Chinese strings in Home.tsx."""
import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('src/pages/Home.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Exact replacements for known corrupted strings
replacements = [
    # sectionAriaLabel 
    ("activePage === 'analytics' ? '??' ", "activePage === 'analytics' ? '分析' "),
    ("activePage === 'experience' ? '??' ", "activePage === 'experience' ? '体验' "),
    (": '????'\n", ": '场景配置'\n"),
    # Home page empty state text in the experience/analytics section
    ("'??????????????'", "'在此查看数据指标与运营分析。'"),
    # Agent desc ending with ?
    ("the research and?'", "the research and writing process.'"),
    ("latest technical information to?'", "latest technical information to ensure accuracy and relevance.'"),
    # Placeholder
    ('placeholder="????????"', 'placeholder="给 Manus 一个任务"'),
    # initialAgents desc L47
    ("desc: '????????????????????????????',", "desc: '帮你创建一个多智能体项目，实现员工入职、培训一系列流程…',"),
]

fixes = 0
for old, new in replacements:
    if old in content:
        content = content.replace(old, new)
        fixes += 1
        print(f'Fixed: {repr(old[:60])}')
    else:
        print(f'NOT FOUND: {repr(old[:60])}')

print(f'\nTotal fixes: {fixes}')

with open('src/pages/Home.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

# Verify
raw = open('src/pages/Home.tsx', 'rb').read()
cn_bytes = sum(1 for b in raw if 0xe4 <= b <= 0xe9)
qmarks = raw.count(b'?')
print(f'Chinese bytes: {cn_bytes}, question marks: {qmarks}')
