// Flosurf token compiler: W3C DTCG JSON -> Style Dictionary v4 -> CSS / Tailwind / iOS / Android / JSON.
//
// One Style Dictionary run per mode (light, dark, high-contrast). Each run resolves
// Tier 1 primitives + Tier 2 semantic (base + that mode) + Tier 3 component tokens.
// The resolved JSON feeds the native/Tailwind generators, the CI audit gates and the
// interactive visualizer, so every artifact comes from the same token graph.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import StyleDictionary from 'style-dictionary';
import { fileHeader, formattedVariables } from 'style-dictionary/utils';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(ROOT);

// Auto-discover all available modes in tokens/semantic/modes/*.json
const modeFiles = (await fs.readdir('tokens/semantic/modes')).filter((f) => f.endsWith('.json'));
const hasLight = modeFiles.includes('light.json');

const MODES = modeFiles.map((f) => {
  const name = f.replace('.json', '');
  const isBase = name === 'light' || (!hasLight && name === 'day');
  const isDark = name.includes('dark') || name.includes('night');
  const isHC = name.includes('high-contrast') || name.includes('-hc');
  return {
    name,
    base: isBase,
    selector: isBase ? `:root, [data-theme="${name}"]` : `[data-theme="${name}"]`,
    colorScheme: isDark ? 'dark' : 'light',
    media: isDark ? '(prefers-color-scheme: dark)' : isHC ? '(prefers-contrast: more)' : undefined,
  };
});
// Ensure the base mode runs first so tokens.css contains the global declarations, followed by canonical order
const modeOrder = ['day', 'night', 'day-hc', 'night-hc'];
MODES.sort((a, b) => {
  if (b.base !== a.base) return (b.base ? 1 : 0) - (a.base ? 1 : 0);
  const ia = modeOrder.indexOf(a.name);
  const ib = modeOrder.indexOf(b.name);
  return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
});

// Explicit transform list (instead of the `css` group) so px stays px and ms stays ms.
const CSS_TRANSFORMS = ['attribute/cti', 'name/kebab', 'color/css', 'fontFamily/css', 'cubicBezier/css'];

const posix = (p) => p.split(path.sep).join('/');
const tierOf = (token) => {
  const f = posix(token.filePath);
  if (f.includes('/primitives/')) return 'primitive';
  if (f.includes('/semantic/')) return 'semantic';
  return 'component';
};
const isModeToken = (token) => posix(token.filePath).includes('/semantic/modes/');
// Re-declared inside each theme selector so scoped theming (data-theme on a subtree) works:
// custom properties that use var() are computed where they're declared, not where they're used.
const isThemeable = (token) => isModeToken(token) || (tierOf(token) === 'component' && token.$type === 'color');

// ---------------------------------------------------------------------------
// Formats
// ---------------------------------------------------------------------------

StyleDictionary.registerFormat({
  name: 'css/flosurf-themed',
  format: async ({ dictionary, file, options }) => {
    const header = await fileHeader({ file });
    const decls = (indentation) =>
      formattedVariables({
        format: 'css',
        dictionary,
        outputReferences: options.outputReferences,
        usesDtcg: true,
        formatting: { indentation },
      });
    const scheme = (indent) => (options.colorScheme ? `${indent}color-scheme: ${options.colorScheme};\n` : '');
    let out = `${header}${options.selector} {\n${scheme('  ')}${decls('  ')}\n}\n`;
    if (options.media) {
      out += `\n@media ${options.media} {\n  :root:not([data-theme]) {\n${scheme('    ')}${decls('    ')}\n  }\n}\n`;
    }
    return out;
  },
});

StyleDictionary.registerFormat({
  name: 'json/flosurf-resolved',
  format: ({ dictionary, options }) => {
    const tokens = {};
    for (const t of dictionary.allTokens) {
      tokens[t.path.join('.')] = {
        value: t.$value,
        original: t.original.$value,
        type: t.$type,
        tier: tierOf(t),
        cssVar: `--${t.name}`,
        ...(t.$description ? { description: t.$description } : {}),
      };
    }
    return JSON.stringify({ mode: options.mode, tokens }, null, 2) + '\n';
  },
});

// ---------------------------------------------------------------------------
// Style Dictionary runs
// ---------------------------------------------------------------------------

await fs.rm('dist', { recursive: true, force: true });

for (const mode of MODES) {
  const cssFile = {
    destination: mode.base ? 'tokens.css' : `theme-${mode.name}.css`,
    format: 'css/flosurf-themed',
    options: {
      outputReferences: true,
      selector: mode.selector,
      colorScheme: mode.colorScheme,
      media: mode.media,
    },
  };
  if (!mode.base) cssFile.filter = isThemeable;

  const sd = new StyleDictionary({
    source: [
      'tokens/primitives/**/*.json',
      'tokens/semantic/base.json',
      `tokens/semantic/modes/${mode.name}.json`,
      'tokens/component/**/*.json',
    ],
    // Theme files reference primitives declared in tokens.css; that is intentional.
    log: { warnings: 'disabled', verbosity: 'default' },
    platforms: {
      css: { transforms: CSS_TRANSFORMS, buildPath: 'dist/css/', files: [cssFile] },
      json: {
        transforms: CSS_TRANSFORMS,
        buildPath: 'dist/json/',
        files: [{ destination: `${mode.name}.json`, format: 'json/flosurf-resolved', options: { mode: mode.name } }],
      },
    },
  });
  await sd.buildAllPlatforms();
}

// ---------------------------------------------------------------------------
// Post-processing from resolved JSON
// ---------------------------------------------------------------------------

const resolved = {};
for (const mode of MODES) {
  resolved[mode.name] = JSON.parse(await fs.readFile(`dist/json/${mode.name}.json`, 'utf8')).tokens;
}
const baseModeName = MODES.find((m) => m.base)?.name || 'day';
const baseTokens = resolved[baseModeName];
const write = async (file, content) => {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content);
};
const BANNER = 'Do not edit directly, this file was auto-generated by build/build-tokens.mjs';

// 1. Combined CSS entry point (light base + dark + high-contrast overrides).
const cssParts = await Promise.all(
  MODES.map((m) => fs.readFile(`dist/css/${m.base ? 'tokens.css' : `theme-${m.name}.css`}`, 'utf8')),
);
await write('dist/css/index.css', cssParts.join('\n'));

// 2. Tailwind (v4 @theme + v3 preset). Only Tier 2 semantic tokens are exposed:
//    the raw palette is reset so `bg-slate-500` style utilities can't bypass the system.
function tailwindName(tokenPath, token) {
  const p = tokenPath.split('.');
  if (token.tier !== 'semantic') return null;
  if (p[0] === 'color') {
    const ns = { bg: '', fg: 'content-', border: 'edge-' }[p[1]];
    return ns === undefined ? null : { ns: 'color', key: ns + p.slice(2).join('-') };
  }
  if (p[0] === 'layout') {
    if (p[1] === 'padding') return { ns: 'spacing', key: `control-${p.slice(3).join('-')}` };
    if (p[1] === 'control-height') return { ns: 'spacing', key: `control-h-${p[2]}` };
    return { ns: 'spacing', key: p.slice(1).join('-') };
  }
  if (p[0] === 'radius') return { ns: 'radius', key: p[1] };
  if (p[0] === 'font' && p.includes('size')) return { ns: 'text', key: p.filter((s) => s !== 'font' && s !== 'size').join('-') };
  return null;
}
const twEntries = Object.entries(baseTokens)
  .map(([p, t]) => ({ map: tailwindName(p, t), cssVar: t.cssVar }))
  .filter((e) => e.map);
await write(
  'dist/tailwind/theme.css',
  `/* ${BANNER} */\n/* Tailwind v4: @import "tailwindcss"; @import "../css/index.css"; @import "./theme.css"; */\n@theme inline {\n  --color-*: initial;\n` +
    twEntries.map((e) => `  --${e.map.ns}-${e.map.key}: var(${e.cssVar});`).join('\n') +
    '\n}\n',
);
const v3Keys = { color: 'colors', spacing: 'spacing', radius: 'borderRadius', text: 'fontSize' };
const preset = { theme: { extend: {} } };
for (const e of twEntries) {
  const group = (preset.theme.extend[v3Keys[e.map.ns]] ??= {});
  group[e.map.key] = `var(${e.cssVar})`;
}
await write('dist/tailwind/preset.cjs', `// ${BANNER}\n// Tailwind v3: presets: [require('./dist/tailwind/preset.cjs')]\nmodule.exports = ${JSON.stringify(preset, null, 2)};\n`);

// 3. Native outputs. Primitives are deliberately excluded: apps consume semantic + component tokens only.
const parseHex = (hex) => {
  let h = String(hex).replace('#', '');
  if (h.length <= 4) h = [...h].map((c) => c + c).join('');
  const n = (i) => parseInt(h.slice(i, i + 2), 16);
  return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1 };
};
const camel = (p) => p.replace(/[.-](\w)/g, (_, c) => c.toUpperCase());
const snake = (p) => p.replace(/[.-]/g, '_');
const kebab = (p) => p.replace(/\./g, '-');
const consumable = Object.entries(baseTokens).filter(([, t]) => t.tier !== 'primitive');
const colorTokens = consumable.filter(([, t]) => t.type === 'color');
const dimensionTokens = consumable.filter(([, t]) => t.type === 'dimension' && /px$/.test(t.value));

// 3. React Native Output (unitless numbers, Tailwind 3.4.17 compatible)
const rnTokens = {
  colors: {},
  spacing: {},
  radius: {},
  fontSize: {},
};
for (const [p, t] of consumable) {
  const parts = p.split('.');
  if (t.type === 'color') {
    rnTokens.colors[camel(p)] = t.value;
  } else if (t.type === 'dimension' && typeof t.value === 'string') {
    const num = parseFloat(t.value);
    if (!isNaN(num)) {
      if (p.includes('radius')) rnTokens.radius[camel(p)] = num;
      else if (p.includes('font') || p.includes('size')) rnTokens.fontSize[camel(p)] = num;
      else rnTokens.spacing[camel(p)] = num;
    }
  }
}
await write('dist/react-native/tokens.js', `// ${BANNER}\nmodule.exports = ${JSON.stringify(rnTokens, null, 2)};\n`);

// 4. Native outputs (iOS & Android)
const lightModeName = resolved.day ? 'day' : resolved.light ? 'light' : Object.keys(resolved)[0];
const darkModeName = resolved.night ? 'night' : resolved.dark ? 'dark' : lightModeName;
const hcModeName = resolved['day-hc'] ? 'day-hc' : resolved['high-contrast'] ? 'high-contrast' : lightModeName;

// 4a. iOS: Asset Catalog colorsets with light / dark / high-contrast appearances + Swift accessors.
const component = (v) => (v / 255).toFixed(3);
const iosColor = (hex) => {
  const { r, g, b, a } = parseHex(hex);
  return { 'color-space': 'srgb', components: { red: component(r), green: component(g), blue: component(b), alpha: a.toFixed(3) } };
};
await fs.rm('dist/ios', { recursive: true, force: true });
await write('dist/ios/FlosurfTokens.xcassets/Contents.json', JSON.stringify({ info: { author: 'flosurf', version: 1 } }, null, 2));
for (const [p] of colorTokens) {
  const colors = [
    { idiom: 'universal', color: iosColor(resolved[lightModeName][p]?.value || '#000000') },
    { idiom: 'universal', appearances: [{ appearance: 'luminosity', value: 'dark' }], color: iosColor(resolved[darkModeName][p]?.value || '#FFFFFF') },
    { idiom: 'universal', appearances: [{ appearance: 'contrast', value: 'high' }], color: iosColor(resolved[hcModeName][p]?.value || '#000000') },
  ];
  await write(`dist/ios/FlosurfTokens.xcassets/${kebab(p)}.colorset/Contents.json`, JSON.stringify({ colors, info: { author: 'flosurf', version: 1 } }, null, 2));
}
await write(
  'dist/ios/FlosurfTokens.swift',
  `// ${BANNER}\nimport SwiftUI\n\npublic enum FlosurfColor {\n` +
    colorTokens.map(([p]) => `    public static let ${camel(p)} = Color("${kebab(p)}", bundle: .module)`).join('\n') +
    `\n}\n\npublic enum FlosurfDimension {\n` +
    dimensionTokens.map(([p, t]) => `    public static let ${camel(p)}: CGFloat = ${parseFloat(t.value)}`).join('\n') +
    '\n}\n',
);

// 4b. Android
const argb = (hex) => {
  const { r, g, b, a } = parseHex(hex);
  return '#' + [Math.round(a * 255), r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('').toUpperCase();
};
const androidColors = (mode) =>
  `<?xml version="1.0" encoding="utf-8"?>\n<!-- ${BANNER} -->\n<resources>\n` +
  colorTokens.map(([p]) => `    <color name="${snake(p)}">${argb(resolved[mode]?.[p]?.value || '#000000')}</color>`).join('\n') +
  '\n</resources>\n';
await fs.rm('dist/android', { recursive: true, force: true });
await write('dist/android/values/flosurf_colors.xml', androidColors(lightModeName));
await write('dist/android/values-night/flosurf_colors.xml', androidColors(darkModeName));
await write('dist/android/high-contrast/values/flosurf_colors.xml', androidColors(hcModeName));
await write(
  'dist/android/values/flosurf_dimens.xml',
  `<?xml version="1.0" encoding="utf-8"?>\n<!-- ${BANNER} -->\n<resources>\n` +
    dimensionTokens
      .map(([p, t]) => {
        const unit = p.includes('font') || p.endsWith('.size') ? 'sp' : 'dp';
        return `    <dimen name="${snake(p)}">${parseFloat(t.value)}${unit}</dimen>`;
      })
      .join('\n') +
    '\n</resources>\n',
);

// 4. Visualizer data: merged multi-mode token graph + gate contracts, inlined into the HTML.
const components = {};
for (const file of await fs.readdir('tokens/component')) {
  const json = JSON.parse(await fs.readFile(`tokens/component/${file}`, 'utf8'));
  for (const [name, group] of Object.entries(json)) {
    components[name] = group.$extensions?.['com.flosurf'] ?? {};
  }
}
const merged = {};
for (const [p, t] of Object.entries(baseTokens)) {
  merged[p] = {
    tier: t.tier,
    type: t.type,
    cssVar: t.cssVar,
    description: t.description,
    values: Object.fromEntries(MODES.map((m) => [m.name, resolved[m.name][p]?.value])),
    originals: Object.fromEntries(MODES.map((m) => [m.name, resolved[m.name][p]?.original])),
  };
}
const visualizerData = {
  generatedAt: new Date().toISOString(),
  modes: MODES.map((m) => m.name),
  tokens: merged,
  components,
  requiredStates: ['default', 'hover', 'focus-visible', 'active', 'disabled', 'loading'],
  contrastPairs: JSON.parse(await fs.readFile('audit/contrast-pairs.json', 'utf8')).pairs,
};
await write('dist/json/visualizer-data.json', JSON.stringify(visualizerData, null, 2));

const htmlPath = 'visualizer/index.html';
try {
  const html = await fs.readFile(htmlPath, 'utf8');
  const payload = JSON.stringify(visualizerData).replace(/</g, '\\u003c');
  const next = html.replace(
    /(<script type="application\/json" id="token-data">)[\s\S]*?(<\/script>)/,
    (_, open, close) => `${open}${payload}${close}`,
  );
  await fs.writeFile(htmlPath, next);
} catch (err) {
  if (err.code !== 'ENOENT') throw err;
}

console.log(
  `\n✔ Built ${Object.keys(baseTokens).length} tokens × ${MODES.length} modes → dist/{css,json,tailwind,ios,android} + visualizer data`,
);
