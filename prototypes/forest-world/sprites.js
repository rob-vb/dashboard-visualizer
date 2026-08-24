/* PROTOTYPE — throwaway code for ticket 05 (forest World).
 *
 * Procedural pixel-art sprites, drawn at 1x on canvas and scaled with
 * nearest-neighbor. These are PLACEHOLDERS for the Evergrow pack ($5, itch.io):
 * same 32x16 iso tile grid, same 4 growth stages, so swapping in real art is a
 * texture swap, not a rewrite.
 */

'use strict';

const TILE_W = 32;
const TILE_H = 16;

// ---------- palettes ----------

const PAL = {
  grass: { light: '#79a854', base: '#6a9a48', dark: '#5c8a3e', edge: '#49702f', blade: '#8fbc5a' },
  dirt: { base: '#a5825f', dark: '#8a6b4a' },
  trunk: { light: '#8a5a34', base: '#6e4526', dark: '#4f3018' },
  canopy: {
    healthy: { hi: '#5fae62', base: '#3e8b50', dark: '#2f6d3f', deep: '#245633' },
    warning: { hi: '#e8b45a', base: '#d1913c', dark: '#b0742c', deep: '#8d5a20' },
    critical: { hi: '#e08a4e', base: '#c2612f', dark: '#9d4a23', deep: '#763517' },
  },
  dead: { hi: '#9a8a78', base: '#7d6f5f', dark: '#5f5348' },
  water: '#4f86b8',
  cloud: { light: '#eef2f4', base: '#d7dee2', dark: '#57606a' },
  rain: '#7fb2d8',
  spark: '#ffe98a',
};

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return { c, ctx, px: (x, y, col) => { ctx.fillStyle = col; ctx.fillRect(x | 0, y | 0, 1, 1); } };
}

function tex(canvas) {
  const t = PIXI.Texture.from(canvas);
  t.source.scaleMode = 'nearest';
  return t;
}

// ---------- ground tile (iso diamond) ----------

function drawGroundTile(variantRand) {
  const { c, px } = makeCanvas(TILE_W, TILE_H);
  for (let y = 0; y < TILE_H; y++) {
    // exact 2:1 diamond rows tessellate with no gaps
    const w = y < TILE_H / 2 ? 4 * (y + 1) : 4 * (TILE_H - y);
    const x0 = TILE_W / 2 - w / 2;
    for (let x = 0; x < w; x++) {
      let col = PAL.grass.base;
      const r = variantRand();
      if (r > 0.95) col = PAL.grass.light;
      else if (r > 0.9) col = PAL.grass.dark;
      px(x0 + x, y, col);
    }
  }
  // little grass blades, rare flowers
  for (let i = 0; i < 3; i++) {
    if (variantRand() > 0.5) {
      const bx = 10 + ((variantRand() * 12) | 0);
      const by = 5 + ((variantRand() * 6) | 0);
      px(bx, by, PAL.grass.blade);
      px(bx, by - 1, PAL.grass.blade);
    }
  }
  if (variantRand() > 0.85) {
    const fx = 10 + ((variantRand() * 12) | 0);
    const fy = 5 + ((variantRand() * 6) | 0);
    px(fx, fy, variantRand() > 0.5 ? '#e8d0e0' : '#f2e6b8');
  }
  return tex(c);
}

// Stump: what remains of a churned tree after the mourning window.
function drawStump() {
  const { c, px } = makeCanvas(24, 6);
  const cx = 12;
  px(cx - 1, 1, PAL.dead.hi); px(cx, 1, PAL.dead.hi);
  px(cx - 2, 2, PAL.dead.base); px(cx - 1, 2, '#c9b89a'); px(cx, 2, '#c9b89a'); px(cx + 1, 2, PAL.dead.base);
  px(cx - 2, 3, PAL.dead.dark); px(cx - 1, 3, PAL.dead.base); px(cx, 3, PAL.dead.base); px(cx + 1, 3, PAL.dead.dark);
  px(cx - 3, 4, PAL.dead.dark); px(cx + 2, 4, PAL.dead.dark);
  return tex(c);
}

// ---------- trees ----------
// Every tree canvas is 24 wide; height depends on stage. The anchor is bottom-center.

function canopyPal(state) {
  if (state === 'dead') return null;
  return PAL.canopy[state] || PAL.canopy.healthy;
}

// Pine: stacked triangles. Stages 1..4.
function drawPine(stage, state) {
  const heights = [10, 16, 24, 32];
  const H = heights[stage - 1];
  const W = 24;
  const { c, px } = makeCanvas(W, H);
  const cx = W / 2;
  const pal = canopyPal(state);

  if (state === 'dead') return drawDeadTree(stage);

  // trunk
  const trunkH = Math.max(2, (H * 0.18) | 0);
  for (let y = H - trunkH; y < H; y++) {
    px(cx - 1, y, PAL.trunk.base); px(cx, y, PAL.trunk.dark);
  }
  // canopy: layered triangles
  const layers = stage; // 1..4 triangle layers
  const canopyH = H - trunkH;
  const layerH = canopyH / layers;
  for (let l = 0; l < layers; l++) {
    const topY = (l * layerH * 0.75) | 0;
    const botY = Math.min(canopyH, ((l + 1) * layerH) | 0) + (l > 0 ? 2 : 0);
    const maxW = 3 + (l + 1) * (stage >= 3 ? 2.6 : 2.2);
    for (let y = topY; y < botY; y++) {
      const t = (y - topY) / Math.max(1, botY - topY);
      const w = Math.max(1, (t * maxW) | 0);
      for (let x = -w; x <= w; x++) {
        let col = pal.base;
        if (x < -w * 0.4) col = pal.hi;
        else if (x > w * 0.5) col = pal.dark;
        if (y === botY - 1) col = pal.deep;
        px(cx + x, y, col);
      }
    }
  }
  return tex(c);
}

// Oak: trunk + blobby canopy.
function drawOak(stage, state) {
  const heights = [9, 14, 21, 28];
  const H = heights[stage - 1];
  const W = 24;
  if (state === 'dead') return drawDeadTree(stage);
  const { c, px } = makeCanvas(W, H);
  const cx = W / 2;
  const pal = canopyPal(state);

  const trunkH = Math.max(2, (H * 0.3) | 0);
  for (let y = H - trunkH; y < H; y++) {
    px(cx - 1, y, PAL.trunk.light); px(cx, y, PAL.trunk.base);
    if (stage >= 3) px(cx + 1, y, PAL.trunk.dark);
  }
  // canopy ellipse
  const ry = (H - trunkH) / 2;
  const rx = 3 + stage * 2.2;
  const cy = ry;
  for (let y = 0; y < H - trunkH + 1; y++) {
    for (let x = -rx; x <= rx; x++) {
      const nx = x / rx, ny = (y - cy) / ry;
      if (nx * nx + ny * ny <= 1) {
        let col = pal.base;
        if (nx < -0.3 && ny < 0) col = pal.hi;
        else if (nx > 0.35 || ny > 0.55) col = pal.dark;
        if (nx * nx + ny * ny > 0.78) col = (nx < 0 && ny < 0) ? pal.base : pal.deep;
        px(cx + x, y, col);
      }
    }
  }
  return tex(c);
}

// Dead tree: bare trunk + branches, grey-brown. Shorter and wider than the
// living tree so it reads as a snag, not a pole.
function drawDeadTree(stage) {
  const heights = [6, 9, 13, 17];
  const H = heights[stage - 1];
  const W = 24;
  const { c, px } = makeCanvas(W, H);
  const cx = W / 2;
  for (let y = 1; y < H; y++) {
    px(cx - 1, y, PAL.dead.base);
    px(cx, y, y < 3 ? PAL.dead.hi : PAL.dead.dark);
  }
  // branches
  const b = [[-1, 0.3, -2], [1, 0.45, 2], [-1, 0.6, -3], [1, 0.25, 3]];
  for (let i = 0; i < Math.min(stage + 1, b.length); i++) {
    const [dir, at, len] = b[i];
    const y0 = (H * at) | 0;
    for (let k = 1; k <= Math.abs(len); k++) {
      px(cx + dir * k, y0 - ((k / 2) | 0), k === Math.abs(len) ? PAL.dead.hi : PAL.dead.base);
    }
  }
  return tex(c);
}

// ---------- effects ----------

function drawCloud(dark) {
  const { c, px } = makeCanvas(18, 8);
  // the payment cloud is warm-white (a friendly sun-shower), the failure cloud dark
  const pal = dark ? { a: PAL.cloud.dark, b: '#3d454e' } : { a: '#fbf6e8', b: '#e6dcc4' };
  const blobs = [[4, 4, 3], [9, 3, 4], [14, 4, 3]];
  for (const [bx, by, r] of blobs) {
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
      if (x * x + y * y <= r * r) px(bx + x, by + y, y > 0 ? pal.b : pal.a);
    }
  }
  return tex(c);
}

function drawRaindrop() {
  const { c, px } = makeCanvas(1, 3);
  px(0, 0, PAL.rain); px(0, 1, PAL.rain); px(0, 2, '#a8cde8');
  return tex(c);
}

function drawSpark() {
  const { c, px } = makeCanvas(5, 5);
  px(2, 0, PAL.spark); px(2, 4, PAL.spark); px(0, 2, PAL.spark); px(4, 2, PAL.spark); px(2, 2, '#fff7cf');
  return tex(c);
}

function drawShadow() {
  const { c, ctx } = makeCanvas(16, 8);
  ctx.fillStyle = 'rgba(30,50,25,0.30)';
  ctx.beginPath(); ctx.ellipse(8, 4, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
  return tex(c);
}

// ---------- sprite atlas ----------

function buildSpriteAtlas() {
  const rng = window.MockSignals.mulberry32(1234);
  const atlas = {
    ground: [],
    trees: { pine: {}, oak: {} },
    cloudLight: drawCloud(false),
    cloudDark: drawCloud(true),
    raindrop: drawRaindrop(),
    spark: drawSpark(),
    shadow: drawShadow(),
    stump: drawStump(),
  };
  for (let i = 0; i < 6; i++) atlas.ground.push(drawGroundTile(rng));
  const states = ['healthy', 'warning', 'critical', 'dead'];
  for (let stage = 1; stage <= 4; stage++) {
    for (const st of states) {
      atlas.trees.pine[stage + '_' + st] = drawPine(stage, st);
      atlas.trees.oak[stage + '_' + st] = drawOak(stage, st);
    }
  }
  return atlas;
}

window.Sprites = { buildSpriteAtlas, TILE_W, TILE_H };
