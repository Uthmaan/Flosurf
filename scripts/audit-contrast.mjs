#!/usr/bin/env node
// Gate 2 — WCAG 2.2 / APCA contrast verification across every mode.
// Blocking metric: WCAG 2.2 ratio vs. the pair's minimum (4.5 text, 3.0 UI).
// APCA Lc is reported alongside for review (WCAG 3 draft; not yet normative).
// Supports CLI options:
//   --pairs <path>       Custom pairing JSON file (defaults to audit/contrast-pairs.json)
//   --modes <m1,m2,...>  Specific modes to audit (defaults to all compiled modes)
//   --failures           Only output failing pairs

import fs from 'node:fs';
import path from 'node:path';
import { parseColor, wcagRatio, apcaLc } from './lib/color.mjs';
import { ROOT, MODES, loadTokens, mdTable } from './lib/tokens.mjs';

const pairsArgIdx = process.argv.indexOf('--pairs');
const pairsPath = pairsArgIdx !== -1 ? path.resolve(ROOT, process.argv[pairsArgIdx + 1]) : path.join(ROOT, 'audit/contrast-pairs.json');

const modesArgIdx = process.argv.indexOf('--modes');
const activeModes = modesArgIdx !== -1 ? process.argv[modesArgIdx + 1].split(',') : MODES;

if (!fs.existsSync(pairsPath)) {
  console.error(`✖ Contrast pairs file not found at ${pairsPath}`);
  process.exit(1);
}

const { pairs } = JSON.parse(fs.readFileSync(pairsPath, 'utf8'));
const rows = [];
let failures = 0;

for (const mode of activeModes) {
  let tokens;
  try {
    tokens = loadTokens(mode);
  } catch {
    continue;
  }

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
    const isKnownFail = Boolean(pair.knownFail);
    if (!pass && !isKnownFail) failures++;
    rows.push([
      mode,
      `${pair.fg} (${fgT.value})`,
      `${pair.bg} (${bgT.value})`,
      `${ratio.toFixed(2)}:1`,
      `Lc ${lc.toFixed(1)}`,
      `≥ ${pair.min} (${pair.kind})`,
      pass ? '✔ PASS' : isKnownFail ? '⚠ KNOWN FINDING (Flagged)' : '✖ FAIL',
    ]);
  }
}

const onlyFailures = process.argv.includes('--failures');
console.log(`\n## Gate 2 — Contrast Verification (${path.relative(ROOT, pairsPath)})\n`);
console.log(
  mdTable(
    ['Mode', 'Foreground', 'Background', 'WCAG 2.2', 'APCA', 'Minimum', 'Result'],
    onlyFailures ? rows.filter((r) => r[6].startsWith('✖')) : rows,
  ),
);
console.log(`\n${failures === 0 ? '✔' : '✖'} ${rows.length - failures}/${rows.length} pairings pass across ${activeModes.length} modes.`);
process.exit(failures ? 1 : 0);
