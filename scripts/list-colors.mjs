import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../src");
const hexRe = /#([0-9a-fA-F]{3,8})\b/g;
const rgbaRe = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/g;

function normHex(h) {
  h = h.toLowerCase();
  if (h.length === 3) return "#" + [...h].map((c) => c + c).join("");
  if (h.length === 6) return "#" + h;
  if (h.length === 8) return "#" + h.slice(0, 6);
  return "#" + h;
}

const hex = new Map();
const rgba = new Map();
const otherFiles = new Map();

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules") continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      walk(p);
      continue;
    }
    if (!/\.(css|tsx?|jsx?)$/.test(name)) continue;
    const text = fs.readFileSync(p, "utf8");
    const rel = path.relative(ROOT, p);
    let m;
    hexRe.lastIndex = 0;
    while ((m = hexRe.exec(text))) {
      const h = normHex(m[1]);
      hex.set(h, (hex.get(h) || 0) + 1);
      if (rel !== "App.css") {
        if (!otherFiles.has(rel)) otherFiles.set(rel, new Set());
        otherFiles.get(rel).add(h);
      }
    }
    rgbaRe.lastIndex = 0;
    while ((m = rgbaRe.exec(text))) {
      const r = `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${m[4] ?? "1"})`;
      rgba.set(r, (rgba.get(r) || 0) + 1);
    }
  }
}

walk(ROOT);

const sortEntries = (map) =>
  [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

console.log(`HEX unique: ${hex.size}, refs: ${[...hex.values()].reduce((a, b) => a + b, 0)}`);
for (const [h, c] of sortEntries(hex)) {
  console.log(`${String(c).padStart(5)}  ${h}`);
}

console.log(`\nRGBA unique: ${rgba.size}, refs: ${[...rgba.values()].reduce((a, b) => a + b, 0)}`);
for (const [r, c] of sortEntries(rgba).slice(0, 35)) {
  console.log(`${String(c).padStart(5)}  ${r}`);
}

console.log("\nHex in non-App.css files:");
for (const [f, set] of [...otherFiles.entries()].sort()) {
  console.log(`  ${f}: ${[...set].sort().join(", ")}`);
}
