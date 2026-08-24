/* PROTOTYPE — throwaway code for ticket 08 (the 3D Forest World gate).
 *
 * The three.js Theme. Same contract as the PixiJS one it is measured against:
 * it sees Signals and folded World state, never anything Stripe-shaped
 * (ADR-0001), and it drives off the unchanged 2D mock generator.
 *
 * What the map decided, and where it lives here:
 *   ticket 01 — Kenney Nature Kit (CC0)          -> assets/geometry.json
 *   ticket 02 — one InstancedMesh per geometry   -> buildEntityMeshes / writeEntities
 *   ticket 13 — ~20° lens, free yaw + clamped
 *               pitch, stands as recover        -> the camera section
 *               (supersedes ticket 04's ortho / fixed pitch / 4 stands)
 *   ticket 05 — Size Tier is swapped, not rebuilt-> LADDER
 *   ticket 06 — Signals in two per-instance
 *               channels plus three FX pools     -> writeEntities / FX pools
 *
 * Everything the map handed this ticket as "a knob" is in KNOBS and wired to
 * the panel in main.js, so the verdict can be taken against both settings.
 */

import * as THREE from './vendor/three.module.min.js';

const DAY = 86400;
const MONTH = 30 * DAY;
const RECENT_WINDOW = 10 * DAY;   // as 2D: signals this close before t get FX
const MOURN_WINDOW = 90 * DAY;    // ticket 06 Q7: the tint ramps across this
const TWEEN_MS = 600;             // ticket 05 Q3
const FLY_MS = 400;               // ticket 04 Q3
const YAW_MS = 400;
const PITCH_MIN = 10, PITCH_MAX = 78; // ticket 13 Q2 — the wide clamp, chosen on looks

// ---------- knobs the map handed this ticket ----------

export const KNOBS = {
  pitchDeg: 35.264,      // ticket 13 Q6 — the opening pitch, and what recover eases back to
  gridDensity: 1.3,      // ticket 13 Q3 — cells per Entity, a woodland-feel number
  relief: 0.9,           // ground height variation; 0 is a flat plane
  scaleSpan: 1,          // ticket 05 Q6 — 0 = silhouette only, 1 = the table
  cloudZoom: 1.15,       // ticket 06 Q3 — clouds appear above this camera zoom
  cloudCap: 300,
  dropCap: 1400,
  sparkCap: 600,
  rampEase: true,        // ticket 06 — is the 90-day tint ramp eased or linear
  shadows: true,
  sway: true,            // ticket 06 Q12 — desktop only, off under reduced motion
  fx: true,
  exposure: 1.0,
  night: false,
  lensDeg: 20,           // ticket 13 Q1 — the long lens ships; 0 is ticket 04's dead ortho
  freePitch: true,       // ticket 13 Q2 — pitch is free, clamped; false is history
  zoom: 1.9,             // ticket 13 Q6 — stands inside the forest, not above the plot
};

// ---------- the Size Tier ladder (ticket 05, measured heights) ----------

const LADDER = [
  { models: ['tree_pineGroundA', 'tree_pineSmallD', 'tree_pineSmallA', 'tree_pineSmallB'], scale: 0.85 },
  { models: ['tree_pineRoundB', 'tree_pineRoundC', 'tree_pineRoundE', 'tree_pineRoundF'], scale: 0.97 },
  { models: ['tree_pineTallA', 'tree_pineDefaultA', 'tree_pineDefaultB'], scale: 1.10 },
  { models: ['tree_pineTallB', 'tree_pineTallD'], scale: 1.25 },
];
const STUMP_SMALL = 'stump_old';   // tiers 1–2
const STUMP_TALL = 'stump_oldTall'; // tiers 3–4

const SCENERY = ['grass', 'grass_large', 'rock_smallFlatA', 'flower_redA', 'flower_yellowA', 'mushroom_redGroup', 'plant_bushLarge'];

// ---------- colours (ticket 06 Q6/Q7, targets under scene lighting) ----------

const C_ACTIVE = new THREE.Color('#3e8b50');
const C_WARNING = new THREE.Color('#d1913c');
const C_CRITICAL = new THREE.Color('#c2612f');
const C_DEAD = new THREE.Color('#7d6f5f');
const C_TRUNK_DEAD = new THREE.Color('#6d6154');
const C_CLOUD_OK = new THREE.Color('#f4eeda');
const C_CLOUD_FAIL = new THREE.Color('#57606a');
const C_DROP = new THREE.Color('#7fb2d8');
const C_SPARK_NEW = new THREE.Color('#ffe98a');
const C_SPARK_BACK = new THREE.Color('#cfeeff');

// ---------- asset loading ----------

let assetPromise = null;
function loadAssets() {
  // the single-file build inlines the geometry, so there is nothing to fetch
  if (window.__GEOMETRY) return Promise.resolve(window.__GEOMETRY);
  if (!assetPromise) assetPromise = fetch('./assets/geometry.json').then((r) => r.json());
  return assetPromise;
}

/** One BufferGeometry per material part, resting on y=0 and centred in x/z. */
function toGeometries(model) {
  const out = {};
  let minY = Infinity, cx = 0, cz = 0, n = 0;
  for (const part of Object.values(model.parts)) {
    for (let i = 0; i < part.pos.length; i += 3) {
      if (part.pos[i + 1] < minY) minY = part.pos[i + 1];
      cx += part.pos[i]; cz += part.pos[i + 2]; n++;
    }
  }
  cx /= n; cz /= n;
  for (const [name, part] of Object.entries(model.parts)) {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(part.pos.length);
    for (let i = 0; i < part.pos.length; i += 3) {
      pos[i] = part.pos[i] - cx; pos[i + 1] = part.pos[i + 1] - minY; pos[i + 2] = part.pos[i + 2] - cz;
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(part.nrm), 3));
    g.setIndex(part.idx);
    g.computeBoundingSphere();
    out[name] = g;
  }
  return out;
}

/* The kit's baseColorFactors are not its palette — this GLTF export carries no
 * colormap, and read either as sRGB or as linear they come out teal (leafsDark
 * -> #2ba6aa, grass -> #7fe0c4). Ticket 06 already makes the canopy ours; the
 * rest of the palette is hand-authored here and is a knob, not a finding. */
const PALETTE = {
  woodBarkDark: '#7a5539',
  woodBark: '#7a5a3f',
  grass: '#6f9c3e',
  dirt: '#8b7f6a',
  colorRed: '#c2504a',
  colorYellow: '#e3ad3c',
};
function kitColor(name, fallback) {
  return new THREE.Color(PALETTE[name] || fallback || '#7ea24a');
}

// ---------- small geometry helpers for the FX pools ----------

function merged(parts) {
  const pos = [], nrm = [];
  for (const { geo, m } of parts) {
    const g = geo.index ? geo.toNonIndexed() : geo;
    const p = g.attributes.position.array, nA = g.attributes.normal.array;
    const nm = new THREE.Matrix3().setFromMatrix4(m).invert().transpose();
    const v = new THREE.Vector3();
    for (let i = 0; i < p.length; i += 3) {
      v.set(p[i], p[i + 1], p[i + 2]).applyMatrix4(m);
      pos.push(v.x, v.y, v.z);
      v.set(nA[i], nA[i + 1], nA[i + 2]).applyMatrix3(nm).normalize();
      nrm.push(v.x, v.y, v.z);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nrm), 3));
  return g;
}

function cloudGeometry() {
  const blob = (r, x, y, z, sy) => ({
    geo: new THREE.IcosahedronGeometry(r, 0),
    m: new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion(), new THREE.Vector3(1, sy, 1)),
  });
  // wide and shallow: a lumpy sphere at tree scale reads as a boulder, not weather
  return merged([blob(0.20, -0.17, 0, 0, 0.42), blob(0.26, 0.04, 0.02, 0.01, 0.44), blob(0.17, 0.23, -0.01, -0.02, 0.4)]);
}

// ---------- the World ----------

export async function createForestWorld3D(mount, data, opts = {}) {
  const assets = await loadAssets();
  const M = window.MockSignals;
  const nowT = data.params.now;
  const t0 = nowT - data.params.historyMonths * MONTH;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const motion = () => KNOBS.sway && !reduceMotion && !coarse; // ticket 06 Q12

  const stateAtNow = M.foldWorldState(data, nowT);
  const gridN = Math.max(12, Math.ceil(Math.sqrt(stateAtNow.entities.length * KNOBS.gridDensity)));
  const spots = M.buildPlacement(data, gridN);
  const half = (gridN - 1) / 2;

  // ---------- renderer ----------

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(mount.clientWidth, mount.clientHeight);
  renderer.shadowMap.enabled = KNOBS.shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.toneMappingExposure = KNOBS.exposure;
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  let dirty = true; // render-on-demand flag; declared up here because setup writes it

  // ---------- lighting ----------

  const hemi = new THREE.HemisphereLight(0xbcd9ff, 0x4a5a34, 1.05);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2d4, 1.65);
  sun.position.set(-9, 14, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera;
  sc.near = 0.5; sc.far = 60; sc.left = -gridN * 0.62; sc.right = gridN * 0.62; sc.top = gridN * 0.62; sc.bottom = -gridN * 0.62;
  sun.shadow.bias = -0.0012;
  sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);

  // The camera is orthographic and parked far away, so fog distances are
  // measured from that parking distance, not from the World's own size.
  const CAM_DIST = 80;
  const fogNear = CAM_DIST + gridN * 0.35;  // only the far edge of the World hazes
  const fogFar = CAM_DIST + gridN * 1.9;

  function applyLighting() {
    if (KNOBS.night) {
      scene.background = new THREE.Color('#131d2a');
      scene.fog = new THREE.Fog('#131d2a', fogNear, fogFar);
      hemi.color.set('#2f4a80'); hemi.groundColor.set('#12160e'); hemi.intensity = 0.26;
      sun.color.set('#9db8f5'); sun.intensity = 0.32;
    } else {
      scene.background = new THREE.Color('#9fc4d8');
      scene.fog = new THREE.Fog('#9fc4d8', fogNear, fogFar);
      hemi.color.set('#d8e8ff'); hemi.groundColor.set('#5c6b39'); hemi.intensity = 0.5;
      sun.color.set('#fff4dc'); sun.intensity = 1.55;
    }
    dirty = true;
  }

  // ---------- the ground surface ----------
  //
  // Rolling, not flat. A flat plane under an orthographic camera gives the eye
  // nothing to read depth from until the viewer turns the World by hand; gentle
  // relief makes trees sit at different heights and cast across each other, so
  // the volume reads while the camera stands still. Seeded, so it is stable.

  const RELIEF_STEP = 5;  // world units between lattice points
  const heightAt = (() => {
    const r = M.mulberry32(M.hashString('relief:' + data.params.seed));
    const lattice = new Map();
    const at = (i, j) => {
      const k = i + ',' + j;
      let v = lattice.get(k);
      if (v === undefined) lattice.set(k, v = r() * 2 - 1);
      return v;
    };
    const smooth = (t) => t * t * (3 - 2 * t);
    return (x, z) => {
      if (!KNOBS.relief) return 0;
      const fx = x / RELIEF_STEP, fz = z / RELIEF_STEP;
      const i = Math.floor(fx), j = Math.floor(fz);
      const u = smooth(fx - i), v = smooth(fz - j);
      const a = at(i, j), b = at(i + 1, j), c2 = at(i, j + 1), d = at(i + 1, j + 1);
      const top = a + (b - a) * u, bot = c2 + (d - c2) * u;
      return (top + (bot - top) * v) * KNOBS.relief;
    };
  })();

  // ---------- ground: one flat-shaded quad grid on a soil slab ----------
  //
  // The 2D World was also a bounded diamond of tiles, so a bounded plot is
  // faithful; giving it a visible depth of soil is the thing only 3D can say.
  // One draw call, no texture — the low-poly idiom, in our own geometry.

  let groundMesh = null;
  function buildGround() {
    if (groundMesh) { scene.remove(groundMesh); groundMesh.geometry.dispose(); }
    const rand = M.mulberry32(M.hashString('ground3d:' + data.params.seed));
    const pad = 3;
    const N = gridN + pad * 2;
    const DEPTH = 1.4;
    const X0 = -pad - half - 0.5, X1 = X0 + N;
    const pos = [], col = [], nrm = [];
    const base = new THREE.Color('#6aa044');
    const lip = new THREE.Color('#4c7233');
    const soil = new THREE.Color('#5b4530');
    const c = new THREE.Color();
    const push = (x, y, z, nx, ny, nz, cc) => {
      pos.push(x, y, z); nrm.push(nx, ny, nz); col.push(cc.r, cc.g, cc.b);
    };
    const tri = (p, cc) => { // flat normal from the winding
      const [ax, ay, az] = p[0], [bx, by, bz] = p[1], [cx, cy, cz] = p[2];
      const ux = bx - ax, uy = by - ay, uz = bz - az;
      const vx = cx - ax, vy = cy - ay, vz = cz - az;
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const l = Math.hypot(nx, ny, nz) || 1;
      nx /= l; ny /= l; nz /= l;
      for (const [px, py, pz] of p) push(px, py, pz, nx, ny, nz, cc);
    };

    const P = (x, z) => [x, heightAt(x, z), z];
    for (let ix = 0; ix < N; ix++) for (let iz = 0; iz < N; iz++) {
      const x = X0 + ix, z = X0 + iz;
      c.copy(base).multiplyScalar(0.94 + rand() * 0.12).offsetHSL((rand() - 0.5) * 0.015, 0, 0);
      // wound counter-clockwise seen from above, so the ground faces the camera
      tri([P(x, z), P(x + 1, z + 1), P(x + 1, z)], c);
      tri([P(x, z), P(x, z + 1), P(x + 1, z + 1)], c);
    }

    // four soil walls, grass lip at the top fading to soil at the bottom
    const wall = (ax, az, bx, bz, nx, nz) => {
      const steps = N;
      for (let s = 0; s < steps; s++) {
        const t0 = s / steps, t1 = (s + 1) / steps;
        const x0 = ax + (bx - ax) * t0, z0 = az + (bz - az) * t0;
        const x1 = ax + (bx - ax) * t1, z1 = az + (bz - az) * t1;
        const y0 = heightAt(x0, z0), y1 = heightAt(x1, z1);
        for (const [vx, vy, vz] of [[x0, y0, z0], [x1, y1, z1], [x1, -DEPTH, z1],
                                    [x0, y0, z0], [x1, -DEPTH, z1], [x0, -DEPTH, z0]]) {
          push(vx, vy, vz, nx, 0, nz, vy > -DEPTH + 0.01 ? lip : soil);
        }
      }
    };
    wall(X0, X0, X1, X0, 0, -1);
    wall(X1, X0, X1, X1, 1, 0);
    wall(X1, X1, X0, X1, 0, 1);
    wall(X0, X1, X0, X0, -1, 0);

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nrm), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(col), 3));
    groundMesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 }));
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);
  }
  buildGround();

  // ---------- entity meshes: one InstancedMesh per geometry (ticket 02/06 Q2) ----------

  const nodes = [];
  for (const [id, spot] of spots) {
    // a small deterministic offset inside the cell, so the grid stops reading as a grid
    const jx = (M.hashString('jx:' + id) % 1000) / 1000 - 0.5;
    const jz = (M.hashString('jz:' + id) % 1000) / 1000 - 0.5;
    const x = spot.x - half + jx * 0.55, z = spot.y - half + jz * 0.55;
    nodes.push({
      id,
      x, z, y: heightAt(x, z),
      u: M.hashString('variant:' + id) / 4294967296,           // ticket 05: held for life
      swayPhase: (M.hashString('sway:' + id) % 628) / 100,
      swayDir: (M.hashString('swaydir:' + id) % 628) / 100,
      failPhase: (M.hashString('fail:' + id) % 628) / 100,      // ticket 06 Q4: fixes the 2D unison bug
      e: null, key: null, prevH: 1, tweenAt: -1, tweenFrom: 1,
    });
  }
  const CAP = Math.max(1, nodes.length);

  const mat = () => new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92, metalness: 0, flatShading: false });
  const models = {};   // name -> { canopy, trunk, height, slots }
  const pickable = [];

  function addModel(name, canopyPart, trunkPart) {
    const geos = toGeometries(assets.models[name]);
    const mk = (geo) => {
      const im = new THREE.InstancedMesh(geo, mat(), CAP);
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      im.setColorAt(0, new THREE.Color(1, 1, 1));
      im.instanceColor.setUsage(THREE.DynamicDrawUsage);
      im.castShadow = true;
      im.receiveShadow = true;
      im.frustumCulled = false;
      im.count = 0;
      scene.add(im);
      return im;
    };
    const entry = {
      name,
      isStump: name === STUMP_SMALL || name === STUMP_TALL,
      height: assets.models[name].height,
      canopy: geos[canopyPart] ? mk(geos[canopyPart]) : null,
      trunk: trunkPart && geos[trunkPart] ? mk(geos[trunkPart]) : null,
    };
    if (entry.canopy) { entry.canopy.userData.model = name; pickable.push(entry.canopy); }
    models[name] = entry;
  }

  for (const rung of LADDER) for (const name of rung.models) addModel(name, 'leafsDark', 'woodBarkDark');
  addModel(STUMP_SMALL, 'woodBark', null);
  addModel(STUMP_TALL, 'woodBark', null);

  const C_TRUNK = kitColor('woodBarkDark');
  const C_STUMP = kitColor('woodBark');

  // ---------- scenery: deterministic dressing on cells no Entity owns ----------

  {
    const taken = new Set(nodes.map((n) => `${n.x},${n.z}`));
    const rand = M.mulberry32(M.hashString('scenery:' + data.params.seed));
    const placements = SCENERY.map(() => []);
    // undergrowth: bare lawn between the trees is what stops a World reading as a forest
    const want = Math.round(gridN * gridN * 0.42);
    for (let i = 0; i < want; i++) {
      const gx = Math.round(rand() * (gridN - 1)) - half;
      const gz = Math.round(rand() * (gridN - 1)) - half;
      if (taken.has(`${gx},${gz}`)) continue;
      const k = (rand() * SCENERY.length) | 0;
      const x = gx + (rand() - 0.5) * 0.9, z = gz + (rand() - 0.5) * 0.9;
      placements[k].push({ x, z, y: heightAt(x, z), r: rand() * Math.PI * 2, s: 0.7 + rand() * 0.7 });
    }
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sv = new THREE.Vector3();
    SCENERY.forEach((name, k) => {
      const list = placements[k];
      if (!list.length) return;
      const geos = toGeometries(assets.models[name]);
      for (const [matName, geo] of Object.entries(geos)) {
        const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: kitColor(matName), roughness: 1, metalness: 0 }), list.length);
        im.receiveShadow = true;
        im.castShadow = false;
        list.forEach((p, i) => {
          q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.r);
          im.setMatrixAt(i, m4.compose(v.set(p.x, p.y, p.z), q, sv.set(p.s, p.s, p.s)));
        });
        scene.add(im);
      }
    });
  }

  // ---------- FX pools (ticket 06): allocated once, never reallocated ----------

  const fxMat = () => new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0 });
  // drops and sparks are light, not matter: unlit, so they read at any zoom
  const glowMat = () => new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
  const mkPool = (geo, cap, matFn = fxMat) => {
    const im = new THREE.InstancedMesh(geo, matFn(), cap);
    im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    im.setColorAt(0, new THREE.Color(1, 1, 1));
    im.instanceColor.setUsage(THREE.DynamicDrawUsage);
    im.frustumCulled = false;
    im.count = 0;
    scene.add(im);
    return im;
  };
  // allocated at the ceiling; the cap knobs only ever lower how much is used
  const CLOUD_MAX = 800, DROP_MAX = 3000, SPARK_MAX = 1500;
  const cloudPool = mkPool(cloudGeometry(), CLOUD_MAX);
  const dropPool = mkPool(new THREE.OctahedronGeometry(0.048, 0).scale(1, 2.8, 1), DROP_MAX, glowMat);
  const sparkPool = mkPool(new THREE.OctahedronGeometry(0.17, 0), SPARK_MAX, glowMat);

  // ---------- time ----------

  let curT = nowT;
  let curState = null;
  let fx = { showers: [], failures: [], sparks: [] };
  let lastFxDay = null;
  let foldMs = 0;

  function pick(e, u) {
    const rung = LADDER[Math.min(3, Math.max(0, e.sizeTier - 1))];
    return { name: rung.models[Math.min(rung.models.length - 1, Math.floor(u * rung.models.length))], scale: rung.scale };
  }

  function tierScale(base) {
    return 1 + (base - 1) * KNOBS.scaleSpan; // knob: 0 collapses the ladder to silhouette only
  }

  function rebuildFx(t) {
    const payments = new Map(), failures = new Set(), appeared = new Set(), returned = new Set();
    for (const s of data.timeline) {
      if (s.at > t) break;
      if (t - s.at > RECENT_WINDOW) continue;
      if (s.kind === 'payment_received') payments.set(s.subscriberId, s.amount);
      else if (s.kind === 'payment_failed') failures.add(s.subscriberId);
      else if (s.kind === 'subscriber_appeared') appeared.add(s.subscriberId);
      else if (s.kind === 'subscriber_returned') returned.add(s.subscriberId);
    }
    fx = { showers: [], failures: [], sparks: [] };
    for (const n of nodes) {
      if (!n.e || n.e.status === 'churned') continue;
      if (payments.has(n.id)) fx.showers.push(n);
      else if (failures.has(n.id)) fx.failures.push(n); // ticket 06 Q4: a payment cancels the failure
      if (returned.has(n.id)) fx.sparks.push({ n, count: 5, colour: C_SPARK_BACK });
      else if (appeared.has(n.id)) fx.sparks.push({ n, count: 3, colour: C_SPARK_NEW });
    }
    fx.showers.length = Math.min(fx.showers.length, KNOBS.cloudCap);
    fx.failures.length = Math.min(fx.failures.length, Math.max(0, KNOBS.cloudCap - fx.showers.length));
    fx.sparks.length = Math.min(fx.sparks.length, Math.floor(KNOBS.sparkCap / 5));
  }

  function setTime(t, o = {}) {
    curT = Math.max(t0, Math.min(nowT, t));
    const t1 = performance.now();
    curState = M.foldWorldState(data, curT);
    foldMs = performance.now() - t1;
    const byId = new Map(curState.entities.map((e) => [e.subscriberId, e]));
    const nowMs = performance.now();
    for (const n of nodes) {
      const e = byId.get(n.id) || null;
      n.e = e;
      if (!e) { n.key = null; continue; }
      const stump = e.status === 'churned' && curT - e.churnedAt > MOURN_WINDOW;
      const p = stump ? { name: e.sizeTier >= 3 ? STUMP_TALL : STUMP_SMALL, scale: 1 } : pick(e, n.u);
      const eff = models[p.name].height * tierScale(p.scale);
      if (p.name !== n.key) {
        // ticket 05 Q3 / ticket 06 Q8: tween live and in replay, hard-cut on scrub
        if (n.key !== null && !o.silent) { n.tweenAt = nowMs; n.tweenFrom = n.prevH / eff; }
        else n.tweenAt = -1;
        n.key = p.name;
      }
      n.scale = tierScale(p.scale);
      n.prevH = eff;
    }
    const fxDay = Math.floor(curT / DAY);
    if (fxDay !== lastFxDay || o.force) { lastFxDay = fxDay; rebuildFx(curT); }
    dirty = true;
    if (opts.onTimeChange) opts.onTimeChange(curState, curT, curT >= nowT);
    return curState;
  }

  // ---------- per-frame instance writes ----------

  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _s = new THREE.Vector3();
  const _c = new THREE.Color(), _axis = new THREE.Vector3();
  const slotOwner = new Map(); // InstancedMesh -> [node,...]
  let highlightId = null;

  function entityColour(n, t) {
    const e = n.e;
    if (e.status === 'churned') {
      let k = Math.min(1, Math.max(0, (t - e.churnedAt) / MOURN_WINDOW));
      if (KNOBS.rampEase) k = k * k * (3 - 2 * k);
      return _c.copy(C_ACTIVE).lerp(C_DEAD, k);
    }
    if (e.status === 'at_risk') return _c.copy(e.severity === 'critical' ? C_CRITICAL : C_WARNING);
    return _c.copy(C_ACTIVE);
  }

  function writeEntities(elapsed) {
    const counts = new Map();
    for (const key of Object.keys(models)) counts.set(key, 0);
    for (const m of pickable) { const a = slotOwner.get(m) || []; a.length = 0; slotOwner.set(m, a); }

    const swaying = motion();
    const nowMs = performance.now();
    for (const n of nodes) {
      if (!n.e || !n.key) continue;
      const entry = models[n.key];
      const slot = counts.get(n.key);
      counts.set(n.key, slot + 1);

      let s = n.scale;
      if (n.tweenAt > 0) {
        const p = (nowMs - n.tweenAt) / TWEEN_MS;
        if (p >= 1) n.tweenAt = -1;
        else { const k = p * p * (3 - 2 * p); s *= n.tweenFrom + (1 - n.tweenFrom) * k; }
      }
      const alive = n.e.status !== 'churned';
      if (swaying && alive) {
        const a = Math.sin(elapsed * 1.1 + n.swayPhase) * 0.018;
        _axis.set(Math.cos(n.swayDir), 0, Math.sin(n.swayDir));
        _q.setFromAxisAngle(_axis, a);
      } else _q.identity();
      _m.compose(_v.set(n.x, n.y, n.z), _q, _s.set(s, s, s));

      if (entry.canopy) {
        entry.canopy.setMatrixAt(slot, _m);
        const col = entry.isStump ? _c.copy(C_STUMP) : entityColour(n, curT);
        if (highlightId && n.id !== highlightId) col.multiplyScalar(0.42);
        entry.canopy.setColorAt(slot, col);
        slotOwner.get(entry.canopy)[slot] = n;
      }
      if (entry.trunk) {
        entry.trunk.setMatrixAt(slot, _m);
        _c.copy(C_TRUNK);
        if (n.e.status === 'churned') {
          let k = Math.min(1, Math.max(0, (curT - n.e.churnedAt) / MOURN_WINDOW));
          if (KNOBS.rampEase) k = k * k * (3 - 2 * k);
          _c.lerp(C_TRUNK_DEAD, k);
        }
        if (highlightId && n.id !== highlightId) _c.multiplyScalar(0.42);
        entry.trunk.setColorAt(slot, _c);
      }
    }
    for (const [key, entry] of Object.entries(models)) {
      const c = counts.get(key);
      for (const m of [entry.canopy, entry.trunk]) {
        if (!m) continue;
        m.count = c;
        m.instanceMatrix.needsUpdate = true;
        m.instanceColor.needsUpdate = true;
      }
    }
  }

  function writeFx(elapsed) {
    if (!KNOBS.fx) { cloudPool.count = dropPool.count = sparkPool.count = 0; return; }
    const showClouds = zoomLevel >= KNOBS.cloudZoom; // ticket 06 Q3
    const still = reduceMotion;
    let ci = 0, di = 0, si = 0;

    for (const n of fx.showers) {
      const top = n.y + n.prevH + 1.05; // clear of the canopy, as the 2D cloud was
      if (showClouds && ci < Math.min(KNOBS.cloudCap, CLOUD_MAX)) {
        _q.identity();
        cloudPool.setMatrixAt(ci, _m.compose(_v.set(n.x, top + 0.35, n.z), _q, _s.set(1, 1, 1)));
        cloudPool.setColorAt(ci, _c.copy(C_CLOUD_OK));
        ci++;
      }
      for (let k = 0; k < 7 && di < Math.min(KNOBS.dropCap, DROP_MAX); k++) {
        const ph = ((k * 977) % 100) / 100;
        const tt = still ? 0.45 : (elapsed * 0.9 + ph + n.swayPhase) % 1;
        const y = top + 0.3 - tt * (top + 0.2);
        _q.identity();
        dropPool.setMatrixAt(di, _m.compose(_v.set(n.x + (k % 3 - 1) * 0.16, y, n.z + ((k / 3 | 0) - 1) * 0.16), _q, _s.set(1, tt < 0.92 ? 1 : 0.001, 1)));
        dropPool.setColorAt(di, _c.copy(C_DROP));
        di++;
      }
    }
    for (const n of fx.failures) {
      if (!showClouds || ci >= Math.min(KNOBS.cloudCap, CLOUD_MAX)) break;
      const top = n.y + n.prevH + 1.05; // clear of the canopy, as the 2D cloud was
      // ticket 06 Q4: no per-instance alpha, so the 2D flicker becomes brightness
      const b = still ? 1 : 0.78 + Math.sin(elapsed * 5 + n.failPhase) * 0.22;
      _q.identity();
      cloudPool.setMatrixAt(ci, _m.compose(_v.set(n.x, top + 0.35, n.z), _q, _s.set(1.05, 1.05, 1.05)));
      cloudPool.setColorAt(ci, _c.copy(C_CLOUD_FAIL).multiplyScalar(b));
      ci++;
    }
    for (const { n, count, colour } of fx.sparks) {
      for (let k = 0; k < count && si < Math.min(KNOBS.sparkCap, SPARK_MAX); k++) {
        const ph = k / count;
        const tt = still ? 0.2 : (elapsed * 0.7 + ph) % 1;
        const rise = tt * 0.5;
        const grow = tt < 0.15 ? tt / 0.15 : Math.max(0, 1 - (tt - 0.15) / 0.62); // ticket 06 Q9
        const ang = ph * Math.PI * 2 + n.swayPhase;
        _q.identity();
        sparkPool.setMatrixAt(si, _m.compose(
          _v.set(n.x + Math.cos(ang) * 0.28, n.y + n.prevH * (0.55 + 0.3 * ph) + rise, n.z + Math.sin(ang) * 0.28),
          _q, _s.set(grow, grow, grow)));
        sparkPool.setColorAt(si, _c.copy(colour));
        si++;
      }
    }
    cloudPool.count = ci; dropPool.count = di; sparkPool.count = si;
    for (const p of [cloudPool, dropPool, sparkPool]) { p.instanceMatrix.needsUpdate = true; p.instanceColor.needsUpdate = true; }
  }

  // ---------- camera: long lens, free yaw and pitch, stands recover (ticket 13) ----------

  const VIEW = 10; // world units of half-height at zoom 1
  // Ticket 13 Q1: the long lens ships. It stands far enough back to frame the same
  // World the ortho camera did, and it is the projection that shows volume — which
  // is what the pivot exists for. `lensDeg: 0` still swaps ticket 04's orthographic
  // camera back in, kept as history so the two can be put side by side; it is not
  // an option the app offers.
  const perspective = KNOBS.lensDeg > 0;
  const camera = perspective
    ? new THREE.PerspectiveCamera(KNOBS.lensDeg, 1, 0.5, 600)
    : new THREE.OrthographicCamera(-VIEW, VIEW, VIEW, -VIEW, 0.1, 400);
  const target = new THREE.Vector3(0, 0.8, 0);
  let pitchDeg = KNOBS.pitchDeg; // live: free look writes here, the knob resets it
  let yaw = Math.PI / 4;        // the stand that reproduces the approved 2D view
  let yawFrom = yaw, yawTo = yaw, yawAt = -1;
  let pitchFrom = pitchDeg, pitchTo = pitchDeg; // ticket 13 Q5 — recover eases the pitch too
  let flyFrom = null, flyTo = null, flyAt = -1;
  const fitZoom = () => VIEW / (gridN * 0.78);
  const maxZoom = VIEW / 3.75;  // one Entity fills ~1/3 of the frame
  let zoomLevel = opts.zoom ?? KNOBS.zoom;

  // the eye distance that frames the same half-height as the ortho camera would
  const eyeDistance = () => perspective
    ? (VIEW / zoomLevel) / Math.tan((KNOBS.lensDeg * Math.PI / 180) / 2)
    : CAM_DIST;

  function placeCamera() {
    const pitch = pitchDeg * Math.PI / 180;
    const R = eyeDistance();
    camera.position.set(
      target.x + Math.cos(pitch) * Math.sin(yaw) * R,
      target.y + Math.sin(pitch) * R,
      target.z + Math.cos(pitch) * Math.cos(yaw) * R);
    camera.lookAt(target);
    if (!perspective) camera.zoom = zoomLevel;
    camera.updateProjectionMatrix();
    if (scene.fog) { scene.fog.near = R + gridN * 0.35; scene.fog.far = R + gridN * 1.9; }
    sun.position.set(target.x - 9, 16, target.z + 7);
    sun.target.position.copy(target);
    sun.target.updateMatrixWorld();
    dirty = true;
  }

  function resize() {
    const w = mount.clientWidth, h = mount.clientHeight;
    if (!w || !h) return;
    const a = w / h;
    if (perspective) camera.aspect = a;
    else { camera.left = -VIEW * a; camera.right = VIEW * a; camera.top = VIEW; camera.bottom = -VIEW; }
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    dirty = true;
  }
  const ro = new ResizeObserver(resize);
  ro.observe(mount);
  resize();
  placeCamera();

  function clampZoom(z) { return Math.min(maxZoom, Math.max(fitZoom() * 0.85, z)); }

  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const ray = new THREE.Raycaster();
  function groundAt(ndc, out = new THREE.Vector3()) {
    ray.setFromCamera(ndc, camera);
    return ray.ray.intersectPlane(groundPlane, out) || out.copy(target);
  }

  // pan / zoom / turn input
  const ndc = new THREE.Vector2();
  const pointers = new Map();
  let dragFrom = null, pinchFrom = null, moved = false;

  function toNdc(ev) {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    return ndc;
  }

  // Pan in screen space, not by re-intersecting the ground each move. Under a
  // perspective camera the intersection depends on where the camera *is*, and
  // moving the camera moves the intersection — the loop that made panning shake.
  // Screen space is exact under both projections.
  const worldPerPixel = () => (2 * VIEW / zoomLevel) / Math.max(1, mount.clientHeight);
  const _right = new THREE.Vector3(), _fwd = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
  function panBy(dxPx, dyPx) {
    camera.matrixWorld.extractBasis(_right, _v, _fwd);
    _right.y = 0; _right.normalize();
    _fwd.copy(_up).cross(_right).normalize(); // ground-plane "up the screen"
    const k = worldPerPixel();
    target.x += (-dxPx * _right.x - dyPx * _fwd.x) * k;
    target.z += (-dxPx * _right.z - dyPx * _fwd.z) * k;
  }

  // Free look. Ticket 04 Q1 chose four snap stands; the user asked for a free
  // turn on top (2026-08-24), so drag-to-look is the primary gesture and the
  // stands survive as the turn buttons, Q/E and the share link's snap.
  const isLook = (ev) => ev.button === 2 || ev.button === 1 || ev.shiftKey || ev.altKey;
  const turnBy = (dxPx, dyPx) => {
    yaw -= dxPx * 0.006;
    yawAt = -1;
    if (KNOBS.freePitch) pitchDeg = Math.min(PITCH_MAX, Math.max(PITCH_MIN, pitchDeg + dyPx * 0.12));
  };

  const onDown = (ev) => {
    try { renderer.domElement.setPointerCapture(ev.pointerId); } catch { /* synthetic pointer */ }
    pointers.set(ev.pointerId, ev);
    moved = false;
    if (pointers.size === 1) dragFrom = { x: ev.clientX, y: ev.clientY, look: isLook(ev) };
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchFrom = {
        d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
        cx: (a.clientX + b.clientX) / 2, cy: (a.clientY + b.clientY) / 2,
        zoom: zoomLevel,
      };
      dragFrom = null;
    }
    if (opts.onInteract) opts.onInteract();
  };
  const onMove = (ev) => {
    if (pointers.has(ev.pointerId)) pointers.set(ev.pointerId, ev);
    // two fingers: pinch zooms, and sliding the pair turns the World
    if (pointers.size === 2 && pinchFrom) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const cx = (a.clientX + b.clientX) / 2, cy = (a.clientY + b.clientY) / 2;
      zoomLevel = clampZoom(pinchFrom.zoom * (d / pinchFrom.d));
      turnBy(cx - pinchFrom.cx, cy - pinchFrom.cy);
      pinchFrom.cx = cx; pinchFrom.cy = cy;
      placeCamera();
      moved = true;
      return;
    }
    if (dragFrom) {
      const dx = ev.clientX - dragFrom.x, dy = ev.clientY - dragFrom.y;
      dragFrom.x = ev.clientX; dragFrom.y = ev.clientY;
      if (dragFrom.look) turnBy(dx, dy); else panBy(dx, dy);
      moved = true;
      flyAt = -1;
      placeCamera();
      if (opts.onInteract) opts.onInteract();
      return;
    }
    hoverAt(ev);
  };
  const onUp = (ev) => {
    pointers.delete(ev.pointerId);
    if (pointers.size < 2) pinchFrom = null;
    if (pointers.size === 0) dragFrom = null;
  };
  const onWheel = (ev) => {
    ev.preventDefault();
    if (ev.shiftKey) { turnBy(ev.deltaY * 0.6, 0); placeCamera(); return; } // shift+wheel turns
    // zoom at the cursor under ortho, where the ground point is independent of the
    // eye position; under a lens that mapping moves with the camera, so zoom to centre
    const before = perspective ? null : groundAt(toNdc(ev)).clone();
    zoomLevel = clampZoom(zoomLevel * (ev.deltaY < 0 ? 1.12 : 1 / 1.12));
    placeCamera();
    if (before) {
      const after = groundAt(toNdc(ev));
      target.x += before.x - after.x; target.z += before.z - after.z;
      placeCamera();
    }
    if (opts.onInteract) opts.onInteract();
  };
  renderer.domElement.addEventListener('contextmenu', (ev) => ev.preventDefault());

  renderer.domElement.addEventListener('pointerdown', onDown);
  renderer.domElement.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  renderer.domElement.addEventListener('pointerleave', () => { if (opts.onHover) opts.onHover(null); });
  renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

  // Ticket 13 Q5 — the recover control. The four stands are no longer a rule the
  // camera obeys; they are the way back. One press steps the yaw to the next stand
  // *and* eases the pitch to the opening default, so a viewer who tilted into a
  // hedge or a top-down map is one button from a frame we authored.
  function yawStep(dir) {
    // from a free angle, step to the next stand rather than a blind 90°
    const idx = Math.round((yaw - Math.PI / 4) / (Math.PI / 2));
    yawFrom = yaw;
    yawTo = Math.PI / 4 + (idx + dir) * Math.PI / 2;
    pitchFrom = pitchDeg;
    pitchTo = KNOBS.pitchDeg;
    yawAt = performance.now();
    if (opts.onInteract) opts.onInteract();
  }

  // Ticket 13 Q8 retired `snapToNearestStand()`. The share link keeps its curated
  // opening frame but no longer jumps to a stand on first touch — a camera that
  // moves away the instant you touch it reads as a bug, and the four-stand rule it
  // enforced is gone. The recover control is the way back instead.

  // ---------- hover ----------

  let hoverNode = null;
  function hoverAt(ev) {
    if (!opts.onHover) return;
    ray.setFromCamera(toNdc(ev), camera);
    const hits = ray.intersectObjects(pickable, false);
    const hit = hits.find((h) => h.instanceId != null && (slotOwner.get(h.object) || [])[h.instanceId]);
    const n = hit ? slotOwner.get(hit.object)[hit.instanceId] : null;
    if (n !== hoverNode) { hoverNode = n; opts.onHover(n ? n.e : null); }
    renderer.domElement.style.cursor = n ? 'pointer' : 'grab';
  }

  // ---------- centre on an Entity (ticket 04 Q3/Q8) ----------

  function isBlocked(n) {
    const from = new THREE.Vector3().copy(camera.position);
    const to = new THREE.Vector3(n.x, n.y + n.prevH * 0.5, n.z);
    const dir = to.clone().sub(from).normalize();
    ray.set(from, dir);
    const hits = ray.intersectObjects(pickable, false);
    const first = hits.find((h) => h.instanceId != null && (slotOwner.get(h.object) || [])[h.instanceId]);
    return first ? first.distance < to.distanceTo(from) - 0.6 : false;
  }

  function centerOn(id) {
    const n = nodes.find((x) => x.id === id);
    if (!n || !n.e) return;
    if (isBlocked(n)) { // only then does the camera rotate — ticket 04 Q8
      for (let k = 1; k <= 3; k++) {
        const save = yaw;
        yaw = yaw + k * Math.PI / 2;
        placeCamera();
        const clear = !isBlocked(n);
        yaw = save; placeCamera();
        if (clear) {
          yawFrom = yaw; yawTo = save + k * Math.PI / 2;
          pitchFrom = pitchTo = pitchDeg; // an occlusion turn is not a recover
          yawAt = performance.now();
          break;
        }
      }
    }
    flyFrom = target.clone();
    flyTo = new THREE.Vector3(n.x, target.y, n.z);
    flyAt = performance.now();
  }

  // ---------- loop ----------

  const stats = { fps: 0, frameMs: 0, writeMs: 0, renderMs: 0, calls: 0, tris: 0, foldMs: 0, entities: 0 };
  let running = true, elapsed0 = performance.now(), lastFrame = elapsed0, fpsEma = 0;

  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);
    const now = performance.now();
    const dt = now - lastFrame;
    lastFrame = now;
    const elapsed = (now - elapsed0) / 1000;

    if (yawAt > 0) {
      const p = Math.min(1, (now - yawAt) / YAW_MS);
      const e = p * p * (3 - 2 * p);
      yaw = yawFrom + (yawTo - yawFrom) * e;
      pitchDeg = pitchFrom + (pitchTo - pitchFrom) * e;
      if (p >= 1) { yawAt = -1; yaw = ((yawTo % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2); pitchDeg = pitchTo; }
      placeCamera();
    }
    if (flyAt > 0) {
      const p = Math.min(1, (now - flyAt) / FLY_MS);
      target.lerpVectors(flyFrom, flyTo, p * p * (3 - 2 * p));
      if (p >= 1) flyAt = -1;
      placeCamera();
    }

    const animating = (motion() && !reduceMotion) || (KNOBS.fx && !reduceMotion && (fx.showers.length || fx.failures.length || fx.sparks.length)) ||
      nodes.some((n) => n.tweenAt > 0) || yawAt > 0 || flyAt > 0;

    if (dirty || animating) {
      const t1 = performance.now();
      writeEntities(elapsed);
      writeFx(elapsed);
      const t2 = performance.now();
      renderer.render(scene, camera);
      const t3 = performance.now();
      // split, because only the write half is CPU work this prototype controls
      stats.writeMs = t2 - t1;
      stats.renderMs = t3 - t2;
      stats.frameMs = t3 - t1;
      dirty = false;
    }
    fpsEma = fpsEma ? fpsEma * 0.9 + (1000 / Math.max(1, dt)) * 0.1 : 1000 / Math.max(1, dt);
    stats.fps = fpsEma;
    stats.calls = renderer.info.render.calls;
    stats.tris = renderer.info.render.triangles;
    stats.foldMs = foldMs;
    stats.entities = curState ? curState.entities.length : 0;
  }
  requestAnimationFrame(frame);

  // first paint at "now"
  setTime(nowT, { silent: true, force: true });
  applyLighting();

  return {
    setTime, centerOn, yawStep, stats, camera, scene, nodes, gridN,
    get state() { return curState; },
    get t() { return curT; },
    t0, now: nowT,
    highlight(id) { highlightId = id; dirty = true; },
    applyKnobs() {
      pitchDeg = pitchFrom = pitchTo = KNOBS.pitchDeg; // the knob wins over free look
      renderer.shadowMap.enabled = KNOBS.shadows;
      renderer.toneMappingExposure = KNOBS.exposure;
      for (const m of pickable) { m.material.needsUpdate = true; }
      scene.traverse((o) => { if (o.isMesh && o.material) o.material.needsUpdate = true; });
      applyLighting();
      placeCamera();
      setTime(curT, { silent: true, force: true });
    },
    setCamera({ zoom, yaw: y, target: tg }) {
      if (zoom != null) { zoomLevel = clampZoom(zoom); }
      if (y != null) { yaw = y; yawAt = -1; }
      if (tg) target.set(tg[0], target.y, tg[1]);
      placeCamera();
    },
    fit() { zoomLevel = fitZoom(); target.set(0, 0.8, 0); placeCamera(); },
    destroy() {
      running = false;
      ro.disconnect();
      window.removeEventListener('pointerup', onUp);
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
