"""Fix AgentLibraryPage.tsx: convert IIFE routing to proper component return."""
import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('src/pages/AgentLibraryPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the IIFE block inside the component
# It starts with the IIFE opener and ends with the closer
IIFE_OPENER = re.compile(r'^\s+\(\(\) => \{', re.MULTILINE)
IIFE_CLOSER = re.compile(r'^\s+\}\)\(\)', re.MULTILINE)

m_open = IIFE_OPENER.search(content)
if not m_open:
    print('IIFE opener not found')
    exit()

m_close = IIFE_CLOSER.search(content, m_open.start())
if not m_close:
    print('IIFE closer not found')
    exit()

# Extract the IIFE content (between opener and closer)
iife_start = m_open.start()
iife_end = m_close.end()

before_iife = content[:iife_start]
iife_content = content[m_open.end():m_close.start()]  # content between { and })()
after_iife = content[iife_end:]

print(f'IIFE opener: {repr(content[iife_start:m_open.end()].strip()[:50])}')
print(f'IIFE closer: {repr(content[m_close.start():iife_end].strip()[:50])}')
print(f'IIFE content lines: {iife_content.count(chr(10))}')

# Find the indentation of the opener
opener_line = content[content.rfind('\n', 0, iife_start) + 1:m_open.end()]
indent_count = len(opener_line) - len(opener_line.lstrip())
print(f'IIFE indentation: {indent_count} spaces')

# De-indent the IIFE content
def deindent(text, n):
    """Remove n leading spaces from each line."""
    result = []
    for line in text.splitlines(keepends=True):
        if line.startswith(' ' * n):
            result.append(line[n:])
        elif line.strip() == '':
            result.append('\n')
        else:
            result.append(line)
    return ''.join(result)

# De-indent by indent_count + 2 (the opener is at N spaces, content is at N+2 spaces)
# We want to go from N+2 spaces to 2 spaces, so remove N spaces
deindented = deindent(iife_content, indent_count)

# Now also remove any trailing whitespace-only lines
deindented = deindented.strip('\n') + '\n'

# Assemble the fixed content
new_content = before_iife + deindented + after_iife

# Clean up the after_iife - it has a newline from the IIFE closer before '}\n'
# Make sure there's a clean newline before the closing }
new_content = new_content.rstrip('\n') + '\n}\n'

# But we might have an extra '}\n' from the original. Check:
# The after_iife should start with '\n' then '}\n' (component closing brace)
# Let's just ensure the file ends with '}\n'
if new_content.endswith('\n}\n'):
    pass
else:
    # Remove the last } that was originally there
    print('Checking end...')

with open('src/pages/AgentLibraryPage.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

with open('src/pages/AgentLibraryPage.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()
print(f'AgentLibraryPage.tsx: {len(lines)} lines')
print('Last 10 lines:')
for l in lines[-10:]:
    print(f'  {repr(l.rstrip()[:80])}')
