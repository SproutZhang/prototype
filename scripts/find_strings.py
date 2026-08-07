"""Find specific strings in git HEAD to use for the final fix."""
import subprocess, sys, re
sys.stdout.reconfigure(encoding='utf-8')

result = subprocess.run(['git', 'show', 'HEAD:src/pages/Home.tsx'], cwd='.', capture_output=True)
orig = result.stdout.decode('utf-8')
orig_lines = orig.splitlines()

targets = ['manus-nav-item-label', 'manus-title', 'manus-runs-title', 'Joyce', 'What can I']
for t in targets:
    for i, l in enumerate(orig_lines, 1):
        if t in l:
            print(f'L{i}: {repr(l.strip()[:100])}')
