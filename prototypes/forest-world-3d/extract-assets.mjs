/* PROTOTYPE — ticket 08. Build-time asset extractor, run once by hand.
 *
 * Reads Kenney Nature Kit GLBs and writes assets/geometry.json: raw
 * POSITION / NORMAL / index arrays per material, in world space, so the
 * renderer needs no GLTFLoader and the prototype stays a static page.
 *
 * Handles the three Kenney quirks ticket 05 recorded:
 *   - metallicFactor is 1 kit-wide  -> materials are re-authored here, not loaded
 *   - `_defaultMat` stray triangles -> dropped
 *   - family names do not track height -> height is measured, not assumed
 *
 *   node prototypes/forest-world-3d/extract-assets.mjs <kit-dir>
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const KIT = process.argv[2];
if (!KIT) { console.error('usage: extract-assets.mjs <dir-with-kenney-glbs>'); process.exit(1); }

// ---------- the models this prototype uses ----------

const MODELS = [
  // tier 1..4 living ladder (ticket 05, selected by measured height)
  'tree_pineGroundA', 'tree_pineSmallD', 'tree_pineSmallA', 'tree_pineSmallB',
  'tree_pineRoundB', 'tree_pineRoundC', 'tree_pineRoundE', 'tree_pineRoundF',
  'tree_pineTallA', 'tree_pineDefaultA', 'tree_pineDefaultB',
  'tree_pineTallB', 'tree_pineTallD',
  // dead
  'stump_old', 'stump_oldTall',
  // scenery
  'rock_smallFlatA', 'rock_largeA', 'grass', 'grass_large',
  'flower_redA', 'flower_yellowA', 'mushroom_redGroup', 'plant_bushLarge',
];

// ---------- minimal GLB reader ----------

const COMP = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
const NUM = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };

function readGlb(path) {
  const buf = readFileSync(path);
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error('not a glb: ' + path);
  let off = 12, json = null, bin = null;
  while (off < buf.length) {
    const len = buf.readUInt32LE(off), type = buf.readUInt32LE(off + 4);
    const body = buf.subarray(off + 8, off + 8 + len);
    if (type === 0x4e4f534a) json = JSON.parse(new TextDecoder().decode(body));
    else if (type === 0x004e4942) bin = body;
    off += 8 + len + ((4 - (len % 4)) % 4) * 0; // glb chunks are already 4-aligned
  }
  return { json, bin };
}

function accessor(g, i) {
  const a = g.json.accessors[i];
  const bv = g.json.bufferViews[a.bufferView];
  const TA = COMP[a.componentType];
  const n = NUM[a.type];
  const base = (bv.byteOffset || 0) + (a.byteOffset || 0);
  const stride = bv.byteStride || 0;
  const out = new Float32Array(a.count * n);
  if (!stride || stride === n * TA.BYTES_PER_ELEMENT) {
    const src = new TA(g.bin.buffer, g.bin.byteOffset + base, a.count * n);
    out.set(src);
  } else {
    for (let e = 0; e < a.count; e++) {
      const src = new TA(g.bin.buffer, g.bin.byteOffset + base + e * stride, n);
      out.set(src, e * n);
    }
  }
  return out;
}

// ---------- 4x4 matrix helpers (column-major, glTF convention) ----------

const ident = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

function mul(a, b) { // a * b
  const o = new Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
  }
  return o;
}

function trs(node) {
  if (node.matrix) return node.matrix.slice();
  const [tx, ty, tz] = node.translation || [0, 0, 0];
  const [qx, qy, qz, qw] = node.rotation || [0, 0, 0, 1];
  const [sx, sy, sz] = node.scale || [1, 1, 1];
  const x2 = qx + qx, y2 = qy + qy, z2 = qz + qz;
  const xx = qx * x2, xy = qx * y2, xz = qx * z2;
  const yy = qy * y2, yz = qy * z2, zz = qz * z2;
  const wx = qw * x2, wy = qw * y2, wz = qw * z2;
  return [
    (1 - (yy + zz)) * sx, (xy + wz) * sx, (xz - wy) * sx, 0,
    (xy - wz) * sy, (1 - (xx + zz)) * sy, (yz + wx) * sy, 0,
    (xz + wy) * sz, (yz - wx) * sz, (1 - (xx + yy)) * sz, 0,
    tx, ty, tz, 1,
  ];
}

const applyPos = (m, x, y, z) => [
  m[0] * x + m[4] * y + m[8] * z + m[12],
  m[1] * x + m[5] * y + m[9] * z + m[13],
  m[2] * x + m[6] * y + m[10] * z + m[14],
];
const applyDir = (m, x, y, z) => {
  const o = [m[0] * x + m[4] * y + m[8] * z, m[1] * x + m[5] * y + m[9] * z, m[2] * x + m[6] * y + m[10] * z];
  const l = Math.hypot(o[0], o[1], o[2]) || 1;
  return [o[0] / l, o[1] / l, o[2] / l];
};

// ---------- extract one model ----------

const MATERIALS = {}; // name -> linear baseColorFactor rgb (glTF factors are linear)

function extract(name) {
  const g = readGlb(join(KIT, name + '.glb'));
  for (const m of g.json.materials || []) {
    const f = (m.pbrMetallicRoughness || {}).baseColorFactor || [1, 1, 1, 1];
    if (m.name && !MATERIALS[m.name]) MATERIALS[m.name] = [f[0], f[1], f[2]];
  }
  const parts = new Map(); // materialName -> { pos: [], nrm: [], idx: [] }
  const scene = g.json.scenes[g.json.scene || 0];

  const walk = (nodeIdx, parent) => {
    const node = g.json.nodes[nodeIdx];
    const world = mul(parent, trs(node));
    if (node.mesh !== undefined) {
      for (const prim of g.json.meshes[node.mesh].primitives) {
        const matName = prim.material !== undefined ? (g.json.materials[prim.material].name || 'mat' + prim.material) : 'none';
        if (matName === '_defaultMat') continue; // ticket 05: two stray triangles in pineRoundB
        const P = accessor(g, prim.attributes.POSITION);
        const N = prim.attributes.NORMAL !== undefined ? accessor(g, prim.attributes.NORMAL) : null;
        const I = prim.indices !== undefined ? accessor(g, prim.indices) : null;
        let part = parts.get(matName);
        if (!part) parts.set(matName, part = { pos: [], nrm: [], idx: [] });
        const vbase = part.pos.length / 3;
        for (let v = 0; v < P.length / 3; v++) {
          const p = applyPos(world, P[v * 3], P[v * 3 + 1], P[v * 3 + 2]);
          part.pos.push(+p[0].toFixed(4), +p[1].toFixed(4), +p[2].toFixed(4));
          const nn = N ? applyDir(world, N[v * 3], N[v * 3 + 1], N[v * 3 + 2]) : [0, 1, 0];
          part.nrm.push(+nn[0].toFixed(3), +nn[1].toFixed(3), +nn[2].toFixed(3));
        }
        const count = I ? I.length : P.length / 3;
        for (let k = 0; k < count; k++) part.idx.push(vbase + (I ? I[k] : k));
      }
    }
    for (const c of node.children || []) walk(c, world);
  };
  for (const n of scene.nodes) walk(n, ident());

  // measured height, over every part (ticket 05: transformed POSITION, not accessor min/max)
  let minY = Infinity, maxY = -Infinity, tri = 0;
  for (const p of parts.values()) {
    for (let v = 1; v < p.pos.length; v += 3) { if (p.pos[v] < minY) minY = p.pos[v]; if (p.pos[v] > maxY) maxY = p.pos[v]; }
    tri += p.idx.length / 3;
  }
  return { name, height: +(maxY - minY).toFixed(3), tris: tri, parts: Object.fromEntries(parts) };
}

// ---------- run ----------

const models = {};
for (const m of MODELS) {
  const e = extract(m);
  models[m] = e;
  console.log(`${m.padEnd(24)} h=${String(e.height).padEnd(6)} tris=${String(e.tris).padEnd(5)} parts=${Object.keys(e.parts).join(', ')}`);
}
console.log('\nmaterials:', MATERIALS);

mkdirSync(join(HERE, 'assets'), { recursive: true });
const path = join(HERE, 'assets', 'geometry.json');
writeFileSync(path, JSON.stringify({ models, materials: MATERIALS }));
console.log('\nwrote', path, (readFileSync(path).length / 1024).toFixed(0) + ' KB');
