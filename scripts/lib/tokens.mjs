import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const MODES = ['light', 'dark', 'high-contrast'];

/** Load resolved tokens for a mode from dist/json (run `npm run build` first). */
export function loadTokens(mode = 'light') {
  const file = path.join(ROOT, 'dist/json', `${mode}.json`);
  if (!fs.existsSync(file)) {
    console.error(`✖ ${path.relative(ROOT, file)} not found. Run \`npm run build\` first.`);
    process.exit(2);
  }
  return JSON.parse(fs.readFileSync(file, 'utf8')).tokens;
}

export function mdTable(headers, rows) {
  const esc = (v) => String(v).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((r) => `| ${r.map(esc).join(' | ')} |`),
  ].join('\n');
}
