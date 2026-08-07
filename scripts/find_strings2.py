import subprocess, sys, re
sys.stdout.reconfigure(encoding='utf-8')

result = subprocess.run(['git', 'show', 'HEAD:src/pages/Home.tsx'], cwd='.', capture_output=True)
orig = result.stdout.decode('utf-8')
lines = orig.splitlines()

for i, l in enumerate(lines, 1):
    if 'manus-runs-title' in l or ('runs' in l and re.search(r'[\u4e00-\u9fff]', l)):
        print(f'L{i}: {repr(l.strip()[:100])}')
