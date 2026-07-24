"""Find and fix all remaining ? in string literals in Home.tsx."""
import subprocess, sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('src/pages/Home.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print('All lines with ? in string literals:')
for i, l in enumerate(lines, 1):
    if re.search(r'["\'].*\?+.*["\']|>\s*\?+\s*<', l):
        # Skip lines where ? is clearly a ternary operator
        # (surrounded by spaces on both sides as JS ternary, or in className ternary)
        stripped = l.strip()
        # Count ? not surrounded by spaces (string content)
        qmarks_in_str = re.findall(r"'[^']*\?+[^']*'|\"[^\"]*\?+[^\"]*\"|>\s*(\?+)\s*<", l)
        if qmarks_in_str:
            print(f'  L{i}: {repr(l.rstrip()[:100])}')

# Get original
result = subprocess.run(['git', 'show', 'HEAD:src/pages/Home.tsx'], cwd='.', capture_output=True)
orig = result.stdout.decode('utf-8')
orig_lines = orig.splitlines(keepends=True)

# Build mapping from ASCII skeleton to orig line
def ascii_skeleton(s):
    """Replace Chinese chars with placeholder."""
    return re.sub(r'[\u4e00-\u9fff]+', 'CN', s)

orig_by_skeleton = {}
for l in orig_lines:
    if re.search(r'[\u4e00-\u9fff]', l):
        sk = ascii_skeleton(l.rstrip())
        if sk not in orig_by_skeleton:
            orig_by_skeleton[sk] = l.rstrip()

# Now try to fix each corrupted line
new_lines = []
fixed = 0
for l in lines:
    # Check if this line has ?s that look like corrupted Chinese
    # Heuristic: ?+ inside quotes (not ternary operators)
    has_qmark_in_str = bool(re.search(r"'[^']*\?+[^']*'|\"[^\"]*\?+[^\"]*\"", l))
    has_qmark_in_jsx = bool(re.search(r'>\s*\?+\s*<', l))
    
    if has_qmark_in_str or has_qmark_in_jsx:
        # Build skeleton with ? replaced by CN
        sk = re.sub(r'\?+', 'CN', ascii_skeleton(l.rstrip()))
        if sk in orig_by_skeleton:
            orig_l = orig_by_skeleton[sk]
            indent = len(l) - len(l.lstrip())
            new_l = ' ' * indent + orig_l.lstrip() + '\n'
            new_lines.append(new_l)
            fixed += 1
            continue
    new_lines.append(l)

print(f'\nFixed {fixed} more lines')

with open('src/pages/Home.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

raw = open('src/pages/Home.tsx', 'rb').read()
text = raw.decode('utf-8', errors='replace')
cn = len(re.findall(r'[\u4e00-\u9fff]', text))
qm = raw.count(b'?')
print(f'Chinese chars: {cn}, question marks: {qm}')
