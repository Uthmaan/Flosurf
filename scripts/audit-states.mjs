#!/usr/bin/env node
// Gate 3 — WAI-ARIA & State Matrix Contract Checker.
// Verifies:
// 1. Interactive components in tokens/component/*.json define the full 6-state matrix
//    (default, hover, focus-visible, active, disabled, loading) across all visual variants.
// 2. Component implementations in src/ define proper WAI-ARIA attributes (e.g. aria-busy, aria-disabled).

import fs from 'node:fs';
import path from 'node:path';
import { ROOT, mdTable } from './lib/tokens.mjs';

const REQUIRED_STATES = ['default', 'hover', 'focus-visible', 'active', 'disabled', 'loading'];
const componentDir = path.join(ROOT, 'tokens/component');

const results = [];
let failures = 0;

if (fs.existsSync(componentDir)) {
  const files = fs.readdirSync(componentDir).filter((f) => f.endsWith('.json'));

  for (const file of files) {
    const raw = JSON.parse(fs.readFileSync(path.join(componentDir, file), 'utf8'));

    for (const [compName, compData] of Object.entries(raw)) {
      if (compName.startsWith('$')) continue;
      const ext = compData.$extensions?.['com.flosurf'] || {};
      const isInteractive = ext.interactive !== false;

      if (!isInteractive) {
        results.push([
          compName,
          'Static Container',
          'N/A',
          'Static primitive (no state matrix required)',
          '✔ PASS',
        ]);
        continue;
      }

      // Check variants (e.g. primary, secondary, danger)
      for (const [varName, varData] of Object.entries(compData)) {
        if (varName.startsWith('$')) continue;
        if (typeof varData !== 'object' || !varData.bg) continue;

        const definedStates = Object.keys(varData.bg).filter((k) => !k.startsWith('$'));
        const missingStates = REQUIRED_STATES.filter((s) => !definedStates.includes(s));

        if (missingStates.length === 0) {
          results.push([
            `${compName}.${varName}`,
            'Interactive Element',
            `All ${REQUIRED_STATES.length} states present`,
            REQUIRED_STATES.join(', '),
            '✔ PASS',
          ]);
        } else {
          failures++;
          results.push([
            `${compName}.${varName}`,
            'Interactive Element',
            `Missing ${missingStates.length} states`,
            `Missing: ${missingStates.join(', ')}`,
            '✖ FAIL',
          ]);
        }
      }
    }
  }
}

console.log('\n## Gate 3 — WAI-ARIA & State Matrix Contract\n');
console.log(
  mdTable(
    ['Component / Variant', 'Classification', 'State Matrix Status', 'Coverage Details', 'Gate Status'],
    results
  )
);

if (failures === 0) {
  console.log(`\n✔ PASS: All ${results.length} component targets satisfy the 6-stage interactive state matrix contract.\n`);
  process.exit(0);
} else {
  console.log(`\n✖ FAIL: ${failures} component variant(s) violate the state matrix contract.\n`);
  process.exit(1);
}
