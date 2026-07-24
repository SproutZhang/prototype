"""
Fix corrupted Chinese characters in Home.tsx by comparing with git HEAD version.
The git HEAD version (7108-line original) has correct Chinese chars.
We extract the correct strings from git HEAD and patch current Home.tsx.
"""
import subprocess, sys, re, difflib
sys.stdout.reconfigure(encoding='utf-8')

# ─── Step 1: Get git HEAD version ────────────────────────────────────────────
result = subprocess.run(['git', 'show', 'HEAD:src/pages/Home.tsx'], cwd='.', capture_output=True)
orig = result.stdout.decode('utf-8')
orig_lines = orig.splitlines(keepends=True)
print(f'Git HEAD: {len(orig_lines)} lines')

# ─── Step 2: Build a Chinese-string lookup table from git HEAD ────────────────
# Extract every string literal that contains Chinese characters
cn_strings_in_orig = set()
for l in orig_lines:
    # Find all quoted strings containing Chinese chars
    for m in re.finditer(r"'([^']*[\u4e00-\u9fff][^']*)'" + r"|" + r'"([^"]*[\u4e00-\u9fff][^"]*)"', l):
        s = m.group(1) or m.group(2)
        cn_strings_in_orig.add(s)

print(f'Chinese strings in original: {len(cn_strings_in_orig)}')

# ─── Step 3: Read current Home.tsx ───────────────────────────────────────────
with open('src/pages/Home.tsx', 'r', encoding='utf-8') as f:
    current = f.read()
    cur_lines = current.splitlines(keepends=True)
print(f'Current Home.tsx: {len(cur_lines)} lines')

# Count corrupted (?-containing) string literals
corrupted = re.findall(r"'[^']*\?[^']*'" + r"|" + r'"[^"]*\?[^"]*"', current)
print(f'String literals with ? chars: {len(corrupted)}')

# ─── Step 4: Build precise patch by finding non-Chinese orig lines that correspond ──
# Strategy: for each line in current Home.tsx that has ? in string literals,
# find the matching line in orig_lines by comparing the non-Chinese/non-? parts.

def strip_chinese_and_qmarks(s):
    """Remove Chinese chars and ? to get a key for matching."""
    return re.sub(r'[\u4e00-\u9fff?]+', '§', s)

# Build index of orig_lines stripped
orig_stripped = {}
for i, l in enumerate(orig_lines):
    key = strip_chinese_and_qmarks(l.rstrip())
    if '§' in key and key not in orig_stripped:
        orig_stripped[key] = l

# Now patch current Home.tsx line by line
patched_lines = []
fixes = 0
for l in cur_lines:
    if '?' in l and re.search(r'["\'].*\?.*["\']', l):
        key = strip_chinese_and_qmarks(l.rstrip())
        if key in orig_stripped:
            orig_line = orig_stripped[key]
            # Reconstruct: same whitespace prefix + correct content
            prefix_len = len(l) - len(l.lstrip())
            new_line = l[:prefix_len] + orig_line.lstrip()
            patched_lines.append(new_line)
            fixes += 1
            continue
    patched_lines.append(l)

print(f'Fixed {fixes} lines')

with open('src/pages/Home.tsx', 'w', encoding='utf-8') as f:
    f.writelines(patched_lines)
print('Wrote patched Home.tsx')

# Verify
with open('src/pages/Home.tsx', 'rb') as f:
    raw = f.read()
cn_bytes = sum(1 for b in raw if 0xe4 <= b <= 0xe9)
print(f'Chinese UTF-8 bytes in patched Home.tsx: {cn_bytes}')
