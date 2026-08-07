import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('src/pages/Home.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print('Lines with ? (showing context):')
for i, l in enumerate(lines, 1):
    if '?' in l:
        # categorize
        stripped = l.strip()
        # Likely legitimate: ternary operators (word ? word), optional chaining (x?.y), TypeScript types (Type?)
        if re.search(r'\s\?\s|\?\.|React\?|undefined\?|\?:', stripped):
            cat = 'LEGIT (ternary/optional)'
        elif re.search(r"'[^']*\?[^']*'|\"[^\"]*\?[^\"]*\"", stripped):
            cat = 'STRING ? (may be corrupted)'
        elif re.match(r'.*\s\?\s.*', stripped):
            cat = 'LEGIT (ternary)'
        else:
            cat = 'CHECK'
        if 'STRING' in cat or cat == 'CHECK':
            print(f'  L{i} [{cat}]: {repr(stripped[:90])}')
