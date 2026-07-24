"""
Second pass: show remaining corrupted strings and attempt to fix them.
"""
import subprocess, sys, re
sys.stdout.reconfigure(encoding='utf-8')

result = subprocess.run(['git', 'show', 'HEAD:src/pages/Home.tsx'], cwd='.', capture_output=True)
orig = result.stdout.decode('utf-8')
orig_lines = orig.splitlines(keepends=True)

with open('src/pages/Home.tsx', 'r', encoding='utf-8') as f:
    cur_lines = f.readlines()

print('Lines still with ? in string literals:')
for i, l in enumerate(cur_lines, 1):
    if '?' in l and re.search(r'["\'].*\?.*["\']', l):
        print(f'  L{i}: {repr(l.rstrip()[:100])}')

# Count legitimate ? (not Chinese corruption)
# In JSX, '?' can appear in TypeScript as optional chaining, but those aren't in strings
print()

# Build a bigger lookup: use more context (full line structure) from orig
# For lines that contain Chinese chars in orig
orig_lookup = {}
for i, l in enumerate(orig_lines):
    if re.search(r'[\u4e00-\u9fff]', l):
        # Use a fuzzy key: only ASCII parts
        ascii_only = re.sub(r'[^\x00-\x7f]', '', l).rstrip()
        if ascii_only not in orig_lookup:
            orig_lookup[ascii_only] = l.rstrip()

print(f'Orig lookup entries: {len(orig_lookup)}')

# Try to fix remaining lines
fixes = 0
new_lines = []
for l in cur_lines:
    if '?' in l and re.search(r'["\'].*\?.*["\']', l):
        # Replace ? with Chinese chars by building ASCII key
        ascii_key = re.sub(r'\?+', '', l.rstrip()).rstrip()  # remove ? to get ASCII
        # Try multiple strategies
        fixed = False
        # Strategy 1: exact ASCII match
        if ascii_key in orig_lookup:
            orig_l = orig_lookup[ascii_key]
            # Preserve indentation
            indent = len(l) - len(l.lstrip())
            new_lines.append(' ' * indent + orig_l.lstrip() + '\n')
            fixes += 1
            fixed = True
        # Strategy 2: replace remaining ? groups with Chinese from closest match
        if not fixed:
            new_lines.append(l)
    else:
        new_lines.append(l)

print(f'Additional fixes: {fixes}')
if fixes > 0:
    with open('src/pages/Home.tsx', 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    from scripts.check_all_encoding import *  # just verify
    raw = open('src/pages/Home.tsx', 'rb').read()
    cn_bytes = sum(1 for b in raw if 0xe4 <= b <= 0xe9)
    print(f'Chinese bytes now: {cn_bytes}')
