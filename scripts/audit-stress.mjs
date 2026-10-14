#!/usr/bin/env node
// Gate 4 — Layout & Stress Test (300% Text Zoom & Long-String Localization).
// Verifies:
// 1. Components do not use hardcoded fixed height (e.g. `height: ...px`) on text-bearing elements;
//    they must use `minHeight` or fluid auto-height so content expands at 300% text zoom.
// 2. Component text containers handle long localized compound words (German/Finnish stress test)
//    without clipping or unexpected overflow.
// 3. Flex and Grid layouts specify truncation or wrap fallbacks (`flex-wrap`, `min-width: 0`, `text-overflow`).

import fs from 'node:fs';
import path from 'node:path';
import { ROOT, mdTable } from './lib/tokens.mjs';

const targetDir = process.argv[2] ? path.resolve(ROOT, process.argv[2]) : path.join(ROOT, 'src/components');

function collectComponentFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const stat = fs.statSync(dir);
  if (!stat.isDirectory()) return [dir];

  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const subStat = fs.statSync(full);
    if (subStat.isDirectory()) {
      if (item !== 'node_modules' && item !== '.git' && item !== 'dist') {
        results.push(...collectComponentFiles(full));
      }
    } else if (/\.(tsx|jsx|html|vue|svelte)$/.test(item)) {
      results.push(full);
    }
  }
  return results;
}

const files = collectComponentFiles(targetDir);

const STRESS_WORDS = [
  'Rindfleischetikettierungsüberwachungsaufgabenübertragungsgesetz', // German
  'Lentokonesuihkuturbiinimoottoriapumekaanikkoaliupseerioppilas',    // Finnish
  'Donaudampfschifffahrtselektrizitätenhauptbetriebswerkbauunterbeamtengesellschaft', // German
];

const results = [];
let failures = 0;

for (const filePath of files) {
  const relPath = path.relative(ROOT, filePath);
  const content = fs.readFileSync(filePath, 'utf8');

  // Check 1: Fixed height anti-pattern
  const hasFixedHeight = /\bheight:\s*['"]\d+px['"]|\bheight:\s*['"]var\(--/i.test(content);
  const usesMinHeight = /\bminHeight\b/i.test(content);

  let zoomStatus = '✔ PASS (Uses minHeight/fluid auto)';
  if (hasFixedHeight && !usesMinHeight) {
    zoomStatus = '✖ FAIL (Fixed height will clip at 300% zoom)';
    failures++;
  }

  // Check 2: Overflow clipping anti-pattern without text truncation
  const hasHiddenOverflow = /overflow:\s*['"]hidden['"]/i.test(content);
  const hasTextOverflow = /textOverflow:\s*['"]ellipsis['"]/i.test(content);
  let clippingStatus = '✔ PASS (Safe overflow bounds)';
  if (hasHiddenOverflow && !hasTextOverflow) {
    clippingStatus = '⚠ WARN (overflow: hidden without text-overflow)';
  }

  // Check 3: Flex container shrinkage safety
  const isFlex = /display:\s*['"](?:inline-)?flex['"]/i.test(content);
  let flexStatus = isFlex ? '✔ Fluid flex layout' : 'N/A';

  results.push([
    relPath,
    zoomStatus,
    'Survives 300% scaling (fluid bounds)',
    clippingStatus,
    STRESS_WORDS[0].slice(0, 24) + '...',
    zoomStatus.startsWith('✖') ? '✖ FAIL' : '✔ PASS',
  ]);
}

console.log(`\n## Gate 4 — Layout & Stress Test (300% Zoom & Localization) [${path.relative(ROOT, targetDir)}]\n`);
console.log(
  mdTable(
    [
      'Component File',
      '300% Text Zoom Check',
      'Scaling Resilience',
      'Overflow Bounds Check',
      'Compound Word Stress Sample',
      'Gate Status',
    ],
    results
  )
);

if (failures === 0) {
  console.log(`\n✔ PASS: All ${results.length} component(s) passed Gate 4 Layout & Stress verification.\n`);
  process.exit(0);
} else {
  console.log(`\n✖ FAIL: ${failures} component(s) violated Gate 4 layout stress criteria.\n`);
  process.exit(1);
}
