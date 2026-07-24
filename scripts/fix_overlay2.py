"""Fix the partial overlay remnant left in Home.tsx."""
import sys
sys.stdout.reconfigure(encoding='utf-8')

HOME = 'src/pages/Home.tsx'

with open(HOME, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Remove lines 591-599 (0-indexed 590-598) - the overlay fragment
before = lines[:590]  # L1-590
after = lines[599:]   # L600 onwards
new_lines = before + after

with open(HOME, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f'Home.tsx lines after fix: {len(new_lines)}')
for i in range(max(0, len(before)-3), len(new_lines)):
    print(f'L{i+1}: {repr(new_lines[i])}')
