import re
import os
from collections import Counter

ROOT = os.path.join(os.path.dirname(__file__), "..", "src")

hex_pat = re.compile(r"#([0-9a-fA-F]{3,8})\b")
rgba_pat = re.compile(
    r"rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)"
)


def norm_hex(h: str) -> str:
    h = h.lower()
    if len(h) == 3:
        return "#" + "".join(c * 2 for c in h)
    if len(h) == 4:
        return "#" + "".join(a + b for a, b in zip(h[0::2], h[1::2]))
    if len(h) == 6:
        return "#" + h
    if len(h) == 8:
        return "#" + h[:6]
    return "#" + h


hexes: Counter[str] = Counter()
rgbas: Counter[str] = Counter()
by_file: dict[str, set[str]] = {}

for root, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in ("node_modules",)]
    for name in files:
        if not name.endswith((".css", ".tsx", ".ts", ".jsx", ".js")):
            continue
        path = os.path.join(root, name)
        rel = os.path.relpath(path, ROOT)
        try:
            text = open(path, encoding="utf-8", errors="ignore").read()
        except OSError:
            continue
        fh: set[str] = set()
        for m in hex_pat.finditer(text):
            h = norm_hex(m.group(1))
            hexes[h] += 1
            fh.add(h)
        for m in rgba_pat.finditer(text):
            a = m.group(4) or "1"
            r = f"rgba({m.group(1)}, {m.group(2)}, {m.group(3)}, {a})"
            rgbas[r] += 1
        if fh:
            by_file[rel] = fh

print(f"HEX unique: {len(hexes)}, refs: {sum(hexes.values())}")
for h, c in sorted(hexes.items(), key=lambda x: (-x[1], x[0])):
    print(f"{c:5d}  {h}")

print(f"\nRGBA/RGB unique: {len(rgbas)}, refs: {sum(rgbas.values())}")
for r, c in sorted(rgbas.items(), key=lambda x: -x[1])[:50]:
    print(f"{c:5d}  {r}")

print("\nNon-App.css hex in TS/TSX:")
for rel, colors in sorted(by_file.items()):
    if rel == "App.css":
        continue
    for h in sorted(colors):
        print(f"  {rel}: {h}")
