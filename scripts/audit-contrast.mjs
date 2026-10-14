#!/usr/bin/env node
// Gate 2 — WCAG 2.2 / APCA contrast verification across every mode.
// Blocking metric: WCAG 2.2 ratio vs. the pair's minimum (4.5 text, 3.0 UI).
// APCA Lc is reported alongside for review (WCAG 3 draft; not yet normative).

import fs from 'node:fs';
import path from 'node:path';
import { parseColor, wcagRatio, apcaLc } from './lib/color.mjs';
import { ROOT, MODES, loadTokens, mdTable } from './lib/tokens.mjs';

const { pairs } = JSON.parse(fs.readFileSync(path.join(ROOT, 'audit/contrast-pairs.json'), 'utf8'));
const rows = [];
let failures = 0;

for (const mode of MODES) {
  const tokens = loadTokens(mode);
  for (const pair of pairs) {
    const fgT = tokens[pair.fg];
    const bgT = tokens[pair.bg];
    if (!fgT || !bgT) {
      failures++;
      rows.push([mode, pair.fg, pair.bg, '—', '—', `≥ ${pair.min}`, '✖ FAIL (missing token)']);
      continue;
    }
    const fg = parseColor(fgT.value);
    const bg = parseColor(bgT.value);
    const ratio = wcagRatio(fg, bg);
    const lc = apcaLc(fg, bg);
    const pass = ratio >= pair.min;
    if (!pass) failures++;
    rows.push([
      mode,
      `${pair.fg} (${fgT.value})`,
      `${pair.bg} (${bgT.value})`,
      `${ratio.toFixed(2)}:1`,
      `Lc ${lc.toFixed(1)}`,
      `≥ ${pair.min} (${pair.kind})`,
      pass ? '✔ PASS' : '✖ FAIL',
    ]);
  }
}

const onlyFailures = process.argv.includes('--failures');
console.log('\n## Gate 2 — Contrast Verification\n');
console.log(
  mdTable(
    ['Mode', 'Foreground', 'Background', 'WCAG 2.2', 'APCA', 'Minimum', 'Result'],
    onlyFailures ? rows.filter((r) => r[6].startsWith('✖')) : rows,
  ),
);
console.log(`\n${failures === 0 ? '✔' : '✖'} ${rows.length - failures}/${rows.length} pairings pass across ${MODES.length} modes.`);
process.exit(failures ? 1 : 0);
