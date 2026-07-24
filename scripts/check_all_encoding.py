import sys, re
sys.stdout.reconfigure(encoding='utf-8')

files = [
    'src/pages/Home.tsx',
    'src/pages/AgentLibraryPage.tsx',
    'src/pages/ScenarioConfigPage.tsx',
    'src/components/shared/JoyceAiPanel.tsx',
    'src/components/shared/AgentCardsGrid.tsx',
]

for path in files:
    raw = open(path, 'rb').read()
    # Count actual UTF-8 Chinese characters (E4-E9 high bytes)
    chinese_bytes = sum(1 for b in raw if 0xe4 <= b <= 0xe9)
    # Count question marks
    qmarks = raw.count(b'?')
    text = raw.decode('utf-8', errors='replace')
    chinese_chars = len(re.findall(r'[\u4e00-\u9fff]', text))
    print(f'{path}: {chinese_chars} Chinese chars, {qmarks} question marks')
