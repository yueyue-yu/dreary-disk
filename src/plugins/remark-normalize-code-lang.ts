import type { Plugin } from 'unified';
import type { Root, Code } from 'mdast';
import { visit } from 'unist-util-visit';

/**
 * Normalizes code fence language identifiers to what Expressive Code expects.
 * - Lowercases language ids (e.g., `JavaScript` -> `javascript`)
 * - Maps common aliases to short forms (e.g., `javascript` -> `js`, `typescript` -> `ts`)
 */
const aliasMap: Record<string, string> = {
  javascript: 'js',
  typescript: 'ts',
  jsx: 'jsx',
  tsx: 'tsx',
  shell: 'bash',
  bash: 'bash',
  sh: 'bash',
  zsh: 'bash',
  console: 'bash',
  css: 'css',
  scss: 'scss',
  sass: 'sass',
  html: 'html',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  txt: 'txt',
};

export const remarkNormalizeCodeLang: Plugin<[], Root> = () => (tree) => {
  visit(tree, 'code', (node: Code) => {
    if (!node.lang) return;
    const raw = String(node.lang).trim();
    if (!raw) return;
    const lower = raw.toLowerCase();
    node.lang = aliasMap[lower] ?? lower;
  });
};

export default remarkNormalizeCodeLang;

