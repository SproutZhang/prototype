"""Final targeted fix for remaining corrupted Chinese strings in Home.tsx."""
import subprocess, sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('src/pages/Home.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Check what's actually in the file around each problem area
def show_ctx(needle, n=2):
    idx = content.find(needle)
    if idx == -1:
        print(f'  NOT FOUND: {repr(needle[:50])}')
        return
    start = content.rfind('\n', 0, idx) + 1
    end = content.find('\n', idx + len(needle))
    print(f'  found: {repr(content[start:end][:100])}')

print('Checking problem areas:')
show_ctx("activePage === 'analytics' ? '")
show_ctx("activePage === 'experience' ? '")
show_ctx('placeholder="')

# Get the correct Chinese strings from git HEAD
result = subprocess.run(['git', 'show', 'HEAD:src/pages/Home.tsx'], cwd='.', capture_output=True)
orig = result.stdout.decode('utf-8')

# Build mapping from ASCII context to original line
def find_orig_line(context_ascii):
    """Find line in orig that contains context_ascii and has Chinese chars."""
    for l in orig.splitlines():
        ascii_only = re.sub(r'[^\x00-\x7f]', '', l)
        if context_ascii in ascii_only and re.search(r'[\u4e00-\u9fff]', l):
            return l.strip()
    return None

# Known fixes
known_fixes = {
    "activePage === 'analytics' ? '??'": "activePage === 'analytics' ? '分析'",
    "activePage === 'experience' ? '??'": "activePage === 'experience' ? '体验'",
    "? '??'": None,  # placeholder
    "??????": "运行记录",
    "'在此查看数据指标与运营分析。'": "'在此查看数据指标与运营分析。'",  # already fixed
    "? '科技'": "? '在此试用与预览产品能力。'",
}

# Direct search and replace using exact text
replacements = []

# Fix analytics/experience labels in sectionAriaLabel
for m in re.finditer(r"activePage === '(analytics|experience)' \? '(\?+)'", content):
    page = m.group(1)
    cn = '分析' if page == 'analytics' else '体验'
    replacements.append((m.group(0), f"activePage === '{page}' ? '{cn}'"))

# Fix the experience subtitle '科技' which should be something else
# Find it in the original
orig_subtitle = find_orig_line("'在此试用与预览产品能力")
if orig_subtitle:
    print(f'Found experience subtitle in orig: {repr(orig_subtitle[:80])}')

# Fix ??????  (likely 运行记录)
orig_runs = find_orig_line('manus-runs-title')
if orig_runs:
    print(f'Found runs title in orig: {repr(orig_runs[:80])}')

# Fix placeholder
orig_placeholder = find_orig_line('placeholder=')
if orig_placeholder:
    print(f'Found placeholder in orig: {repr(orig_placeholder[:80])}')

print(f'\nAuto-detected replacements: {len(replacements)}')
for old, new in replacements:
    content = content.replace(old, new)
    print(f'  Fixed: {repr(old[:60])}')

# Fix the experience subtitle (? '科技' -> ? '在此试用与预览产品能力。')
content = content.replace(
    "? '科技'\n",
    "? '在此试用与预览产品能力。'\n"
)

# Fix ?????? run history title  
content = content.replace(
    '??????\n',
    '运行记录\n'
)

# Fix placeholder
content = content.replace(
    'placeholder="输入关键字筛选…"',
    'placeholder="输入关键字筛选…"'
)

with open('src/pages/Home.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

raw = open('src/pages/Home.tsx', 'rb').read()
import re as _re
text = raw.decode('utf-8', errors='replace')
cn_chars = len(_re.findall(r'[\u4e00-\u9fff]', text))
qmarks = raw.count(b'?')
print(f'\nResult: {cn_chars} Chinese chars, {qmarks} question marks')
