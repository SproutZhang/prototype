"""Comprehensive fix of all Chinese character corruption in Home.tsx."""
import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('src/pages/Home.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# All known corrupted strings → correct strings (based on git HEAD analysis)
fixes = [
    # Nav item labels (JSX text nodes in spans)
    ('>??<', '>首页<'),           # home nav label
    ('>????<', '>场景配置<'),    # scenarios nav label  
    
    # Large blocks that are JSX text nodes on their own lines
    ('                ??????\n', '                历史记录\n'),   # runs title
    
    # Home page title  
    ('>??????????<', '>今天你想自动化什么?<'),
    
    # Agent desc strings that got corrupted
    ("desc: '????????????????????????????',", "desc: '帮你创建一个多智能体项目，实现员工入职、培训一系列流程…',"),
    
    # Experience/analytics subtitle
    ("? '?????????????????????????????'", "? '在此试用与预览产品能力。'"),
    ("'?????????????????????????????'", "'在此试用与预览产品能力。'"),
    
    # Run history items (if corrupted)
    # sectionAriaLabel 分析/体验  (may be already fixed)
]

# Also fix JSX text nodes that are just Chinese chars on their own line
# Pattern: line with only whitespace + question marks + newline
def fix_jsx_text_nodes(content):
    lines = content.splitlines(keepends=True)
    
    import subprocess
    result = subprocess.run(['git', 'show', 'HEAD:src/pages/Home.tsx'], cwd='.', capture_output=True)
    orig = result.stdout.decode('utf-8')
    orig_lines = orig.splitlines(keepends=True)
    
    # Build index of orig lines that are pure Chinese text (JSX text nodes)
    # Key: number of leading spaces
    # Value: map from ? count to correct Chinese text
    orig_text_nodes = {}  # (indent, qmark_count) -> correct_text
    for l in orig_lines:
        stripped = l.rstrip()
        text = stripped.lstrip()
        if re.match(r'^[\u4e00-\u9fff，。、！？…·「」『』【】《》""''：；,.!?]+$', text):
            indent = len(stripped) - len(text)
            # Compute what the corrupted version would look like
            # Each Chinese char in text becomes ?
            qmark_count = len(text)  # rough estimate
            key = (indent, qmark_count)
            if key not in orig_text_nodes:
                orig_text_nodes[key] = text
    
    # Fix each line in current content
    new_lines = []
    for l in lines:
        stripped = l.rstrip()
        text = stripped.lstrip()
        if re.match(r'^\?+$', text):
            indent = len(stripped) - len(text)
            qmark_count = len(text)
            key = (indent, qmark_count)
            if key in orig_text_nodes:
                correct_text = orig_text_nodes[key]
                new_l = ' ' * indent + correct_text + '\n'
                new_lines.append(new_l)
                continue
        new_lines.append(l)
    return ''.join(new_lines)

content = fix_jsx_text_nodes(content)

# Apply direct fixes
fixed = 0
for old, new in fixes:
    if old in content:
        content = content.replace(old, new)
        fixed += 1
        print(f'Fixed: {repr(old[:60])} -> {repr(new[:60])}')
    else:
        print(f'Not found: {repr(old[:60])}')

print(f'\nDirect fixes: {fixed}')

with open('src/pages/Home.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

raw = open('src/pages/Home.tsx', 'rb').read()
text = raw.decode('utf-8', errors='replace')
cn = len(re.findall(r'[\u4e00-\u9fff]', text))
qm = raw.count(b'?')
print(f'Chinese chars: {cn}, question marks: {qm}')

# Show remaining issues
lines = content.splitlines()
print('\nRemaining lines with possible corruption:')
for i, l in enumerate(lines, 1):
    if re.match(r'^\s*\?+\s*$', l) or re.search(r"'[^']*\?[^']*'|\"[^\"]*\?[^\"]*\"", l):
        # Filter out obvious ternary/TypeScript operators
        stripped = l.strip()
        if not re.match(r'.*\s\?\s.*', stripped) and '??' not in stripped.replace('?:', ''):
            print(f'  L{i}: {repr(l.rstrip()[:90])}')
