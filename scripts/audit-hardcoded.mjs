#!/usr/bin/env node
// Gate 1 — Hardcoded Value Linter.
// Detects raw hex/rgb colors, hardcoded pixel values (spacing, radius, dimensions),
// raw font-size/weight, and z-indexes in component files (*.tsx, *.jsx, *.css, *.vue, etc.).
// For each violation, it maps the raw value to its nearest Tier-2 Semantic Token.

import fs from 'node:fs';
import path from 'node:path';
import { parseColor, deltaE } from './lib/color.mjs';
import { ROOT, loadTokens, mdTable } from './lib/tokens.mjs';

const targetDirs = process.argv.slice(2).length > 0 ? process.argv.slice(2) : ['src'];
const lightTokens = loadTokens('light');

// Build semantic candidate lookup pools
const colorCandidates = Object.entries(lightTokens)
  .filter(([, t]) => t.tier === 'semantic' && t.type === 'color')
  .map(([key, t]) => ({ key, cssVar: t.cssVar, parsed: parseColor(t.value) }))
  .filter((c) => c.parsed !== null);

const dimCandidates = Object.entries(lightTokens)
  .filter(([, t]) => t.tier === 'semantic' && t.type === 'dimension' && typeof t.value === 'string' && t.value.endsWith('px'))
  .map(([key, t]) => ({ key, cssVar: t.cssVar, px: parseFloat(t.value) }));

function findNearestColor(rawColor) {
  const parsed = parseColor(rawColor);
  if (!parsed || colorCandidates.length === 0) return null;
  let best = null;
  let minDiff = Infinity;
  for (const cand of colorCandidates) {
    const diff = deltaE(parsed, cand.parsed);
    if (diff < minDiff) {
      minDiff = diff;
      best = cand;
    }
  }
  return best ? `var(${best.cssVar}) /* ${best.key} (ΔE=${minDiff.toFixed(1)}) */` : null;
}

function findNearestDimension(rawPx) {
  const val = parseFloat(rawPx);
  if (isNaN(val) || dimCandidates.length === 0) return null;
  let best = null;
  let minDiff = Infinity;
  for (const cand of dimCandidates) {
    const diff = Math.abs(val - cand.px);
    if (diff < minDiff) {
      minDiff = diff;
      best = cand;
    }
  }
  return best ? `var(${best.cssVar}) /* ${best.key} (${best.px}px) */` : null;
}

const HEX_REGEX = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const RGB_REGEX = /\brgba?\([^)]+\)/g;
const PX_REGEX = /\b(\d+(?:\.\d+)?)px\b/g;
const Z_INDEX_REGEX = /\bzIndex:\s*(\d+)\b|\bz-index:\s*(\d+)/g;

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const violations = [];

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    // Skip comments or token definition lines
    if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.includes('$value') || line.includes('--')) return;

    // Check Hex
    let match;
    while ((match = HEX_REGEX.exec(line)) !== null) {
      const raw = match[0];
      const fix = findNearestColor(raw);
      violations.push({
        loc: `${path.relative(ROOT, filePath)}:${lineNum}`,
        type: 'Hardcoded Color (Hex)',
        current: raw,
        fix: fix || 'Reference Tier 2 semantic token --color-*',
      });
    }

    // Check RGB/RGBA
    while ((match = RGB_REGEX.exec(line)) !== null) {
      const raw = match[0];
      const fix = findNearestColor(raw);
      violations.push({
        loc: `${path.relative(ROOT, filePath)}:${lineNum}`,
        type: 'Hardcoded Color (RGB)',
        current: raw,
        fix: fix || 'Reference Tier 2 semantic token --color-*',
      });
    }

    // Check Pixel Dimensions (exclude 0px and 1px borders if permitted)
    while ((match = PX_REGEX.exec(line)) !== null) {
      const raw = match[0];
      const pxVal = parseFloat(match[1]);
      if (pxVal === 0) continue;
      const fix = findNearestDimension(pxVal);
      violations.push({
        loc: `${path.relative(ROOT, filePath)}:${lineNum}`,
        type: 'Hardcoded Dimension (px)',
        current: raw,
        fix: fix || 'Reference Tier 2 semantic token --space-* or --layout-*',
      });
    }

    // Check raw z-index
    while ((match = Z_INDEX_REGEX.exec(line)) !== null) {
      const val = match[1] || match[2];
      violations.push({
        loc: `${path.relative(ROOT, filePath)}:${lineNum}`,
        type: 'Hardcoded z-index',
        current: match[0],
        fix: `var(--elevation-z-*) /* Reference Tier 2 elevation scale */`,
      });
    }
  });

  return violations;
}

function collectFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        results.push(...collectFiles(full));
      }
    } else if (/\.(tsx|ts|jsx|js|css|scss|vue|svelte|html)$/.test(file)) {
      results.push(full);
    }
  }
  return results;
}

let allViolations = [];
for (const target of targetDirs) {
  const resolvedTarget = path.resolve(ROOT, target);
  if (!fs.existsSync(resolvedTarget)) continue;
  const stat = fs.statSync(resolvedTarget);
  const files = stat.isDirectory() ? collectFiles(resolvedTarget) : [resolvedTarget];
  for (const f of files) {
    allViolations.push(...scanFile(f));
  }
}

console.log('\n## Gate 1 — Hardcoded Value Linter (Zero Raw Hex/Px)');

if (allViolations.length === 0) {
  console.log('\n✔ PASS: Zero hardcoded hex, RGB, or pixel values detected. All properties reference design tokens.\n');
  process.exit(0);
} else {
  console.log(`\nFound ${allViolations.length} token policy violation(s):\n`);
  const rows = allViolations.map((v) => [v.loc, v.type, `\`${v.current}\``, v.fix]);
  console.log(mdTable(['Line/Node', 'Violation Type', 'Current Implementation', 'Exact Token/Code Fix'], rows));
  console.log('\n✖ FAIL: Gate 1 check failed. Replace raw values with corresponding Tier 2 Semantic Tokens.\n');
  process.exit(1);
}
