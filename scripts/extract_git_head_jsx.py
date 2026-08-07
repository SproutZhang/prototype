"""Extract sidebar JSX from git HEAD and save for comparison."""
import subprocess, sys, re
sys.stdout.reconfigure(encoding='utf-8')

# Get git HEAD Home.tsx as raw bytes
result = subprocess.run(
    ['git', 'show', 'HEAD:src/pages/Home.tsx'],
    cwd='.',
    capture_output=True
)
raw = result.stdout
print(f'Git HEAD Home.tsx: {len(raw)} bytes')

# Decode as UTF-8
text = raw.decode('utf-8', errors='replace')
lines = text.splitlines(keepends=True)
print(f'Git HEAD Home.tsx: {len(lines)} lines')

# Find Chinese chars
chinese = re.findall(r'[\u4e00-\u9fff]+', text)
print(f'Chinese string groups: {len(chinese)}')
for c in chinese[:5]:
    print(f'  {repr(c)}')

# Find the main return statement
for i, l in enumerate(lines, 1):
    if l.strip() == 'return (':
        print(f'\nMain return at L{i}')
        # Save lines from this point
        jsx_lines = lines[i-1:]
        print(f'JSX return: {len(jsx_lines)} lines')
        # Save to file
        with open('scripts/git_head_jsx.tsx', 'w', encoding='utf-8') as f:
            f.writelines(jsx_lines)
        print('Saved to scripts/git_head_jsx.tsx')
        break

# Also find Chinese chars in the sidebar area
print('\nChinese strings in sidebar (lines containing manus-sidebar):')
for i, l in enumerate(lines, 1):
    if 'manus-sidebar' in l or 'aria-label' in l:
        # Print surrounding lines
        for j in range(max(0, i-1), min(len(lines), i+2)):
            cl = ''.join(re.findall(r'[\u4e00-\u9fff]+', lines[j]))
            if cl:
                print(f'  L{j+1}: {repr(lines[j].rstrip()[:80])}')
        break
