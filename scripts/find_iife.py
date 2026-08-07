import subprocess, sys
sys.stdout.reconfigure(encoding='utf-8')

result = subprocess.run(['git', 'show', 'HEAD:src/pages/Home.tsx'], cwd='.', capture_output=True)
orig = result.stdout.decode('utf-8')
lines = orig.splitlines()

print(f'Git HEAD lines: {len(lines)}')

# Show what lines 6160-6240 look like
for i in range(6159, min(6245, len(lines))):
    print(f'L{i+1}: {repr(lines[i][:80])}')
