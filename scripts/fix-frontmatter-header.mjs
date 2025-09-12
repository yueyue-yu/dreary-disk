#!/usr/bin/env node
/**
 * Wraps top-of-file metadata lines in proper YAML frontmatter.
 * Specifically targets files that start with YAML-like key:value lines
 * and contain a closing '---' later, but are missing the opening '---'.
 *
 * Usage: node scripts/fix-frontmatter-header.mjs [dir]
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const targetDir = path.resolve(ROOT, process.argv[2] || 'src/content/post/moon');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (/\.(md|mdx)$/i.test(entry.name)) out.push(p);
  }
  return out;
}

function startsWithFrontmatter(text) {
  return /^---\s*\n/.test(text);
}

function findClosingFence(lines, maxScan = 100) {
  for (let i = 0; i < Math.min(lines.length, maxScan); i++) {
    if (/^---\s*$/.test(lines[i])) return i; // index where '---' occurs
  }
  return -1;
}

if (!fs.existsSync(targetDir)) {
  console.error('Directory not found:', targetDir);
  process.exit(1);
}

const files = walk(targetDir);
let updated = 0;
for (const file of files) {
  const raw = fs.readFileSync(file, 'utf8');
  if (startsWithFrontmatter(raw)) continue;
  const lines = raw.split(/\r?\n/);
  // Heuristic: if the first non-empty line looks like `key: value` or `key:`
  // and we can find a later line that is exactly '---', assume it's the closing fence.
  const firstLine = lines.find((l) => l.trim().length > 0) ?? '';
  if (!/^[-_a-zA-Z0-9]+\s*:\s*/.test(firstLine)) continue;
  const closingIdx = findClosingFence(lines);
  if (closingIdx === -1) continue;
  // Insert opening fence at top
  const fixed = ['---', ...lines].join('\n');
  fs.writeFileSync(file, fixed);
  updated++;
  console.log('Inserted opening frontmatter fence:', path.relative(ROOT, file));
}

console.log(`Scanned ${files.length} files. Fixed ${updated}.`);

