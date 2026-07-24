import sys
sys.stdout.reconfigure(encoding='utf-8')

raw = open('src/pages/Home.tsx', 'rb').read()
chinese_bytes = sum(1 for b in raw if 0xe4 <= b <= 0xe9)
print(f'Chinese UTF-8 byte sequences found: {chinese_bytes}')

lines = raw.split(b'\n')
for i in range(107, 112):
    print(f'L{i+1} hex: {lines[i][:80].hex()}')
    try:
        print(f'L{i+1} utf8: {lines[i][:80].decode("utf-8")}')
    except Exception as e:
        print(f'L{i+1}: decode failed: {e}')
