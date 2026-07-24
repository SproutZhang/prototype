import subprocess, sys
sys.stdout.reconfigure(encoding='utf-8')

result = subprocess.run(['git', 'show', 'HEAD:src/pages/Home.tsx'], cwd='.', capture_output=True)
orig = result.stdout.decode('utf-8')
lines = orig.splitlines()

# Show L6795-6820 (runs title text)
for i in range(6793, 6820):
    print(f'L{i+1}: {repr(lines[i][:100])}')
