"""Fix the partial overlay remnant left in Home.tsx after step3 script."""
import sys
sys.stdout.reconfigure(encoding='utf-8')

HOME = 'src/pages/Home.tsx'

with open(HOME, 'r', encoding='utf-8') as f:
    content = f.read()

# The partial overlay starts with 'e">\n' (end of aria-hidden="true">)
# and ends with ') : null}\n'
fragment_start = 'e">\n'
# More specific context:
before_fragment = 'agent-detail-blank-page-back-icon" aria-hidden="tru'

si = content.find(before_fragment)
if si == -1:
    print('No overlay fragment found - already clean')
else:
    # Find end of the fragment
    fragment_end_marker = '    ) : null}\n'
    ei = content.find(fragment_end_marker, si)
    if ei == -1:
        print('Could not find fragment end')
    else:
        ei += len(fragment_end_marker)
        removed = content[si:ei]
        content = content[:si] + content[ei:]
        print(f'Removed {len(removed.splitlines())} lines of overlay fragment')

with open(HOME, 'w', encoding='utf-8') as f:
    f.write(content)
print(f'Home.tsx lines: {content.count(chr(10))}')
