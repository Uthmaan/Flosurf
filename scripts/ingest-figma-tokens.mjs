#!/usr/bin/env node
// Ingest Figma Native Variable Exports into Flosurf W3C DTCG Token Hierarchy.
// Resolves com.figma.aliasData, flattens hex objects, strips emoji & spaces,
// extracts Tier 1 Primitives (Palette, Universal) and generates Tier 2 Semantic Modes (Day, Night)
// with standard semantic aliases so all components compile cleanly.

import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib/tokens.mjs';

const DEFAULT_V2_DIR = path.join(process.env.HOME, 'Documents/x,bigly/flo v2 tokens');
const DEFAULT_V1_DIR = path.join(process.env.HOME, 'Documents/x,bigly/flo v1 tokens');

const v2Dir = process.argv[2] || DEFAULT_V2_DIR;
const v1Dir = process.argv[3] || DEFAULT_V1_DIR;

console.log(`\n📦 Ingesting Figma tokens from:\n   v2: ${v2Dir}\n   v1: ${v1Dir}\n`);

if (!fs.existsSync(v2Dir)) {
  console.error(`✖ v2 token directory not found at ${v2Dir}`);
  process.exit(1);
}

// Helper: sanitize keys (strip emoji, replace spaces & brackets with kebab-case)
function sanitizeKey(key) {
  return key
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/[\[\]]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9\-_.]/g, '')
    .toLowerCase();
}

// Helper: sanitize token reference e.g. "{Palette.Nimbus.N0}" -> "{palette.nimbus.n0}"
function sanitizeRef(val) {
  if (typeof val !== 'string') return val;
  return val.replace(/\{([^}]+)\}/g, (_, inner) => {
    const parts = inner.split('.').map(sanitizeKey);
    return `{${parts.join('.')}}`;
  });
}

// Clean and convert node recursively
function cleanNode(node) {
  if (node === null || typeof node !== 'object') {
    return sanitizeRef(node);
  }

  // Handle leaf token with $value
  if ('$value' in node) {
    let val = node.$value;
    let type = node.$type || 'color';

    // Extract hex from Figma color object
    if (typeof val === 'object' && val !== null && val.hex) {
      val = val.hex;
      type = 'color';
    } else {
      val = sanitizeRef(val);
    }

    const cleaned = {
      $type: type,
      $value: val,
    };
    if (node.$description) cleaned.$description = node.$description;
    return cleaned;
  }

  const out = {};
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith('$') && k !== '$type' && k !== '$value' && k !== '$description') {
      continue; // drop extensions like $extensions
    }
    const cleanK = sanitizeKey(k);
    if (!cleanK) continue;
    out[cleanK] = cleanNode(v);
  }
  return out;
}

function findFile(dir, pattern) {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir);
  for (const f of files) {
    if (pattern.test(f)) return path.join(dir, f);
  }
  return null;
}

const colourDir = path.join(v2Dir, '🌈 Colour');
const dayFile = findFile(colourDir, /Day/i) || findFile(v2Dir, /Day/i);
const nightFile = findFile(colourDir, /Night/i) || findFile(v2Dir, /Night/i);

const primitivesOutDir = path.join(ROOT, 'tokens/primitives');
fs.mkdirSync(primitivesOutDir, { recursive: true });
const semanticModesDir = path.join(ROOT, 'tokens/semantic/modes');
fs.mkdirSync(semanticModesDir, { recursive: true });

// 1. Ingest Primitives (Palette)
// Priority: Day.tokens.json contains the complete V2 palette (Nimbus, Gratitude, Yolk, Remedy, Oasis, Beacon, Lumen, Mend)
let paletteClean = null;
if (dayFile) {
  const dayRaw = JSON.parse(fs.readFileSync(dayFile, 'utf8'));
  if (dayRaw.Palette) {
    paletteClean = { palette: cleanNode(dayRaw.Palette) };
  }
}
if (!paletteClean) {
  const v1Mode1Path = path.join(v1Dir, 'Mode 1.tokens.json');
  if (fs.existsSync(v1Mode1Path)) {
    const v1Raw = JSON.parse(fs.readFileSync(v1Mode1Path, 'utf8'));
    paletteClean = cleanNode(v1Raw);
  }
}

if (paletteClean) {
  fs.writeFileSync(
    path.join(primitivesOutDir, 'flo-palette.json'),
    JSON.stringify(paletteClean, null, 2) + '\n'
  );
  console.log('✔ Ingested tokens/primitives/flo-palette.json (Full V2 Palette)');
}

// 2. Ingest Universal Primitives (Typography & Dimensions)
const v2UniversalPath = path.join(v2Dir, 'Universal.tokens.json');
if (fs.existsSync(v2UniversalPath)) {
  const univRaw = JSON.parse(fs.readFileSync(v2UniversalPath, 'utf8'));
  const univClean = cleanNode(univRaw);
  fs.writeFileSync(
    path.join(primitivesOutDir, 'flo-universal.json'),
    JSON.stringify(univClean, null, 2) + '\n'
  );
  console.log('✔ Ingested tokens/primitives/flo-universal.json');
}

// Semantic standard aliases mapping for Day & Night modes
function getSemanticAliases(isNight) {
  return {
    $type: 'color',
    bg: {
      surface: {
        default: { $value: isNight ? '{background.surface.ground-canvas}' : '{background.surface.ground-canvas}' },
        raised: { $value: isNight ? '{background.surface.floor-2}' : '{background.surface.floor-2}' },
        sunken: { $value: isNight ? '{background.surface.floor-1}' : '{background.surface.floor-1}' }
      },
      action: {
        primary: {
          default: { $value: '{core.brand.gratitude.default}' },
          hover: { $value: '{core.brand.gratitude.hover}' },
          active: { $value: '{core.brand.gratitude.pressed}' },
          disabled: { $value: isNight ? '{palette.nimbus.n600}' : '#ACBCB0' }
        },
        secondary: {
          default: { $value: isNight ? '{background.surface.floor-2}' : '{background.surface.floor-2}' },
          hover: { $value: isNight ? '{palette.nimbus.n700}' : '{palette.nimbus.n25}' },
          active: { $value: isNight ? '{palette.nimbus.n600}' : '{palette.nimbus.n50}' },
          disabled: { $value: isNight ? '{palette.nimbus.n800}' : '{palette.nimbus.n50}' }
        },
        danger: {
          default: { $value: '{core.utility.destructive.default}' },
          hover: { $value: '{core.utility.destructive.hover}' },
          active: { $value: '{core.utility.destructive.pressed}' },
          disabled: { $value: isNight ? '{palette.nimbus.n600}' : '#ACBCB0' }
        }
      },
      feedback: {
        danger: { subtle: { $value: '{background.utility.destructive}' } },
        success: { subtle: { $value: '{background.utility.constructive}' } },
        warning: { subtle: { $value: '{background.utility.caution}' } }
      }
    },
    fg: {
      default: { $value: '{text.neutral.default}' },
      muted: { $value: '{text.neutral.subtle}' },
      disabled: { $value: '{text.neutral.disabled}' },
      'on-action': { $value: '{text.inverse.default}' },
      link: { $value: '{core.brand.gratitude.default}' },
      danger: { $value: '{core.utility.destructive.default}' },
      success: { $value: '{core.brand.gratitude.default}' },
      warning: { $value: '{core.utility.caution.default}' }
    },
    border: {
      subtle: { $value: '{border.surface.subtle}' },
      default: { $value: '{border.surface.default}' },
      strong: { $value: '{border.surface.strong}' },
      focus: { $value: '{border.utility.constructive.strong}' },
      danger: { $value: '{border.utility.destructive.strong}' }
    }
  };
}

// 3. Ingest Semantic Modes (Day & Night)
if (dayFile) {
  const dayRaw = JSON.parse(fs.readFileSync(dayFile, 'utf8'));
  const dayClean = cleanNode(dayRaw);
  delete dayClean.palette; // Palette belongs in Tier 1 primitives
  dayClean.color = getSemanticAliases(false);

  fs.writeFileSync(
    path.join(semanticModesDir, 'day.json'),
    JSON.stringify(dayClean, null, 2) + '\n'
  );
  console.log('✔ Ingested tokens/semantic/modes/day.json (with standard DTCG aliases)');
}

if (nightFile) {
  const nightRaw = JSON.parse(fs.readFileSync(nightFile, 'utf8'));
  const nightClean = cleanNode(nightRaw);
  delete nightClean.palette; // Palette belongs in Tier 1 primitives
  nightClean.color = getSemanticAliases(true);

  fs.writeFileSync(
    path.join(semanticModesDir, 'night.json'),
    JSON.stringify(nightClean, null, 2) + '\n'
  );
  console.log('✔ Ingested tokens/semantic/modes/night.json (with standard DTCG aliases)');
}

// 4. Ingest Dimensions & Layout
const dimensionsDir = path.join(v2Dir, '📏  Dimensions (2)');
if (fs.existsSync(dimensionsDir)) {
  const dimOut = {};
  for (const f of fs.readdirSync(dimensionsDir).filter((x) => x.endsWith('.json'))) {
    const modeName = sanitizeKey(f.replace('.tokens.json', '').replace('.json', ''));
    const raw = JSON.parse(fs.readFileSync(path.join(dimensionsDir, f), 'utf8'));
    dimOut[modeName] = cleanNode(raw);
  }
  fs.writeFileSync(
    path.join(ROOT, 'tokens/semantic/flo-dimensions.json'),
    JSON.stringify(dimOut, null, 2) + '\n'
  );
  console.log('✔ Ingested tokens/semantic/flo-dimensions.json');
}

console.log('\n✨ Figma Token Ingestion Complete!\n');
