#!/usr/bin/env node
/**
 * Add minimal frontmatter to Markdown files that don't have any,
 * under a given directory (default: src/content/post/moon).
 *
 * Fields added:
 * - title: derived from filename
 * - description: ""
 * - publishDate: file mtime as YYYY-MM-DD
 * - tags: []
 * - draft: false
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const targetDir = path.resolve(ROOT, process.argv[2] || 'src/content/post/moon');

function toTitle(name) {
  const base = name.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  return base.charAt(0).toUpperCase() + base.slice(1);
}

function fmtDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function hasFrontmatter(text) {
  // Starts with --- on first line
  return /^---\s*\n/.test(text);
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (/\.(md|mdx)$/i.test(entry.name)) out.push(p);
  }
  return out;
}

if (!fs.existsSync(targetDir)) {
  console.error(`Directory not found: ${targetDir}`);
  process.exit(1);
}

const files = walk(targetDir);
let changed = 0;
for (const file of files) {
  const raw = fs.readFileSync(file, 'utf8');
  if (hasFrontmatter(raw)) continue;

  const stat = fs.statSync(file);
  const mtime = new Date(stat.mtimeMs || stat.mtime || Date.now());
  const title = toTitle(path.basename(file, path.extname(file)));
  const publishDate = fmtDate(mtime);
  const fm = [
    '---',
    `title: "${title}"`,
    'description: ""',
    `publishDate: "${publishDate}"`,
    'tags: []',
    'draft: false',
    '---',
    '',
  ].join('\n');

  fs.writeFileSync(file, fm + raw);
  changed++;
  console.log(`Added frontmatter: ${path.relative(ROOT, file)}`);
}

console.log(`Checked ${files.length} files. Updated ${changed}.`);

