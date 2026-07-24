import subprocess, sys
sys.stdout.reconfigure(encoding='utf-8')

result = subprocess.run(['git', 'show', 'HEAD:src/pages/Home.tsx'], cwd='.', capture_output=True)
orig = result.stdout.decode('utf-8')
lines = orig.splitlines()

# Show L6773-6785 (runs section)
for i in range(6771, 6790):
    print(f'L{i+1}: {repr(lines[i][:100])}')
