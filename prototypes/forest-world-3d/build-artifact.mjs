/* PROTOTYPE — ticket 08. Bundle the prototype into one self-contained HTML file.
 *
 * The gate has to be judged from a phone and from behind a firewall, so the
 * whole World — three.js, the Kenney geometry, the unchanged 2D mock generator,
 * the renderer and the page — is inlined into a single page with no network
 * dependency except the Google font the 2D prototype already used.
 *
 *   node prototypes/forest-world-3d/build-artifact.mjs
 *   -> prototypes/forest-world-3d/dist/forest-world-3d.html
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (...p) => readFileSync(join(HERE, ...p), 'utf8');

// ---------- fold three.js's two ES modules into one namespace object ----------

// three.module.min.js both imports from the core build and re-exports it
// (`export{...}from"./three.core.min.js"`), so the `from` clause is captured.
const SPEC = /export\{([^}]*)\}(from"[^"]*")?;?/g;
const IMPORT = /import\{([^}]*)\}from"\.\/three\.core\.min\.js";?/;

// "A as B, C" -> [[local, exported], ...]
const parseSpec = (s) => s.split(',').map((e) => {
  const [a, b] = e.split(' as ').map((x) => x.trim());
  return [a, b || a];
}).filter(([a]) => a);

function foldThree() {
  const core = read('vendor', 'three.core.min.js');
  const mod = read('vendor', 'three.module.min.js');

  const coreExports = [];
  const coreBody = core.replace(SPEC, (_, spec) => { coreExports.push(...parseSpec(spec)); return ''; });

  const imp = mod.match(IMPORT);
  if (!imp) throw new Error('three.module.min.js no longer imports three.core.min.js — check the vendor build');
  const imports = parseSpec(imp[1]); // [exportedNameInCore, localAliasInModule]
  const modExports = [], reExports = [];
  const modBody = mod.replace(IMPORT, '').replace(SPEC, (_, spec, from) => {
    (from ? reExports : modExports).push(...parseSpec(spec));
    return '';
  });

  const obj = (pairs, get = (local) => local) =>
    '{' + pairs.map(([local, exp]) => `${JSON.stringify(exp)}:${get(local)}`).join(',') + '}';
  const destructure = imports.map(([exp, alias]) => `${JSON.stringify(exp)}:${alias}`).join(',');

  return `const __THREE_CORE=(()=>{${coreBody}\nreturn ${obj(coreExports)};})();\n` +
    `const THREE=(()=>{const{${destructure}}=__THREE_CORE;${modBody}\n` +
    `return Object.assign({},__THREE_CORE,` +
    `${obj(reExports, (l) => `__THREE_CORE[${JSON.stringify(l)}]`)},${obj(modExports)});})();\n`;
}

// ---------- the prototype's own modules ----------

const world3d = read('world3d.js')
  .replace(/import \* as THREE from '\.\/vendor\/three\.module\.min\.js';/, '')
  .replace(/^export /gm, '');

const main = read('main.js')
  .replace(/import \{[^}]*\} from '\.\/world3d\.js';/, '');

const mockSignals = read('..', 'forest-world', 'mock-signals.js');
const geometry = read('assets', 'geometry.json');

// ---------- the page ----------

const html = read('index.html')
  .replace(/<!doctype html>[\s\S]*?<head>/i, '')
  .replace(/<\/head>[\s\S]*?<body>/i, '')
  .replace(/<\/body>\s*<\/html>\s*$/i, '')
  .replace(/<script src="\.\.\/forest-world\/mock-signals\.js"><\/script>/, '')
  .replace(/<script type="module" src="\.\/main\.js"><\/script>/, '')
  // the hosted copy is named, not captioned; the ticket number lives in the description
  .replace(/<title>[^<]*<\/title>/, '<title>3D Forest World</title>');

const out = `${html}
<script>window.__GEOMETRY = ${geometry};</script>
<script>${mockSignals}</script>
<script type="module">
${foldThree()}
${world3d}
${main}
</script>
`;

mkdirSync(join(HERE, 'dist'), { recursive: true });
const path = join(HERE, 'dist', 'forest-world-3d.html');
writeFileSync(path, out);
console.log('wrote', path, (out.length / 1024 / 1024).toFixed(2) + ' MB');
