/* PROTOTYPE — throwaway code for tickets 05 + 06 (forest World + timeline).
 *
 * The PixiJS renderer: renders the isometric forest from mock Signals at any
 * point in time. Pure Theme territory — it only ever sees Signals and folded
 * state, never anything Stripe-shaped (ADR-0001).
 *
 * Ticket 06: world.setTime(t) refolds the Timeline at t and updates the scene
 * in place. Placement never changes with t: spots are computed once from the
 * full Timeline, and a subscriber's spot depends only on its own id and its
 * position in the appearance order — so the layout at a past t is a prefix of
 * the layout at now.
 */

'use strict';

// TILE_W/TILE_H, MONTH/DAY, hashString/mulberry32/buildPlacement are already
// in scope: classic scripts share the global scope with sprites.js/mock-signals.js.
const RECENT_WINDOW = 10 * DAY; // signals this close before t get effects
const MOURN_WINDOW = 90 * DAY; // recent churn = standing dead tree; older = stump

function isoToScreen(gx, gy) {
  return { x: (gx - gy) * (TILE_W / 2), y: (gx + gy) * (TILE_H / 2) };
}

function stateKey(e, t) {
  if (e.status === 'churned') return t - e.churnedAt > MOURN_WINDOW ? 'stump' : 'dead';
  if (e.status === 'at_risk') return e.severity === 'critical' ? 'critical' : 'warning';
  return 'healthy';
}

async function createForestWorld(mount, data, opts = {}) {
  const atlas = window.Sprites.buildSpriteAtlas();
  const nowT = data.params.now;
  const t0 = nowT - data.params.historyMonths * MONTH;

  const stateAtNow = window.MockSignals.foldWorldState(data, nowT);
  const gridN = Math.max(12, Math.ceil(Math.sqrt(stateAtNow.entities.length * 1.9)));
  const spots = buildPlacement(data, gridN);

  const app = new PIXI.Application();
  await app.init({
    resizeTo: mount,
    background: opts.background ?? '#28361f',
    antialias: false,
    roundPixels: true,
  });
  mount.appendChild(app.canvas);

  const world = new PIXI.Container();
  app.stage.addChild(world);

  const groundLayer = new PIXI.Container();
  const treeLayer = new PIXI.Container();
  treeLayer.sortableChildren = true;
  const fxLayer = new PIXI.Container();
  world.addChild(groundLayer, treeLayer, fxLayer);

  // ---------- ground ----------
  const grand = mulberry32(hashString('ground:' + data.params.seed));
  for (let gx = 0; gx < gridN; gx++) {
    for (let gy = 0; gy < gridN; gy++) {
      const t = atlas.ground[(grand() * atlas.ground.length) | 0];
      const s = new PIXI.Sprite(t);
      const p = isoToScreen(gx, gy);
      s.x = p.x - TILE_W / 2;
      s.y = p.y;
      groundLayer.addChild(s);
    }
  }

  // ---------- tree nodes: one per subscriber that EVER appears ----------
  const treeNodes = new Map(); // subscriberId -> node info
  for (const [id, spot] of spots) {
    const p = isoToScreen(spot.x, spot.y);
    const node = new PIXI.Container();
    node.x = p.x;
    node.y = p.y + TILE_H / 2;
    node.zIndex = spot.x + spot.y;
    node.visible = false;

    const shadow = new PIXI.Sprite(atlas.shadow);
    shadow.anchor.set(0.5, 0.5);
    shadow.y = -1;
    node.addChild(shadow);

    const spr = new PIXI.Sprite();
    spr.anchor.set(0.5, 1);
    node.addChild(spr);

    spr.eventMode = 'static';
    spr.cursor = 'pointer';
    const info = {
      node, spr, shadow, spot,
      species: hashString('species:' + id) % 2 === 0 ? 'pine' : 'oak',
      swayPhase: (hashString('sway:' + id) % 628) / 100,
      curKey: null, e: null, pop: 0,
    };
    spr.on('pointerover', () => opts.onHover && info.e && opts.onHover(info.e, node));
    spr.on('pointerout', () => opts.onHover && opts.onHover(null));

    treeLayer.addChild(node);
    treeNodes.set(id, info);
  }

  // ---------- time state ----------
  let curT = nowT;
  let curState = null;
  let lastFxDay = null;
  let showers = [];
  let sparks = [];

  function rebuildEffects(t) {
    fxLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    showers = []; sparks = [];
    const recentPayments = new Map();
    const recentFailures = new Set();
    const recentAppeared = new Set();
    for (const s of data.timeline) {
      if (s.at > t) break;
      if (t - s.at > RECENT_WINDOW) continue;
      if (s.kind === 'payment_received') recentPayments.set(s.subscriberId, s.amount);
      if (s.kind === 'payment_failed') recentFailures.add(s.subscriberId);
      if (s.kind === 'subscriber_appeared' || s.kind === 'subscriber_returned') recentAppeared.add(s.subscriberId);
    }
    for (const [id] of recentPayments) {
      const tn = treeNodes.get(id);
      if (!tn || !tn.node.visible || (tn.e && tn.e.status === 'churned')) continue;
      const cloud = new PIXI.Sprite(atlas.cloudLight);
      cloud.anchor.set(0.5, 0.5);
      cloud.x = tn.node.x;
      cloud.y = tn.node.y - tn.spr.height - 14;
      fxLayer.addChild(cloud);
      const drops = [];
      for (let i = 0; i < 7; i++) {
        const d = new PIXI.Sprite(atlas.raindrop);
        d.x = cloud.x - 7 + ((i * 37) % 14);
        d.baseY = cloud.y + 4;
        d.range = tn.spr.height + 6;
        d.phase = ((i * 977) % 100) / 100;
        d.y = d.baseY;
        fxLayer.addChild(d);
        drops.push(d);
      }
      showers.push({ cloud, drops, phase: (hashString('shower:' + id) % 100) / 100 });
    }
    for (const id of recentFailures) {
      const tn = treeNodes.get(id);
      if (!tn || !tn.node.visible || recentPayments.has(id)) continue;
      const cloud = new PIXI.Sprite(atlas.cloudDark);
      cloud.anchor.set(0.5, 0.5);
      cloud.x = tn.node.x;
      cloud.y = tn.node.y - tn.spr.height - 12;
      fxLayer.addChild(cloud);
      showers.push({ cloud, drops: [], phase: 0, flicker: true });
    }
    for (const id of recentAppeared) {
      const tn = treeNodes.get(id);
      if (!tn || !tn.node.visible) continue;
      for (let i = 0; i < 3; i++) {
        const sp = new PIXI.Sprite(atlas.spark);
        sp.anchor.set(0.5, 0.5);
        sp.baseX = tn.node.x - 8 + i * 8;
        sp.baseY = tn.node.y - Math.max(8, tn.spr.height) * (0.3 + 0.3 * i);
        sp.phase = i * 0.33;
        fxLayer.addChild(sp);
        sparks.push(sp);
      }
    }
  }

  function setTime(t, opts2 = {}) {
    curT = Math.max(t0, Math.min(nowT, t));
    curState = window.MockSignals.foldWorldState(data, curT);
    const byId = new Map(curState.entities.map((e) => [e.subscriberId, e]));
    for (const [id, tn] of treeNodes) {
      const e = byId.get(id) || null;
      tn.e = e;
      if (!e) { tn.node.visible = false; tn.curKey = null; continue; }
      tn.node.visible = true;
      const sk = stateKey(e, curT);
      const key = sk === 'stump' ? 'stump' : tn.species + ':' + e.sizeTier + '_' + sk;
      if (key !== tn.curKey) {
        tn.spr.texture = sk === 'stump' ? atlas.stump : atlas.trees[tn.species][e.sizeTier + '_' + sk];
        tn.shadow.alpha = e.status === 'churned' ? 0.35 : 0.8;
        // growth/decline pop, but not on the very first paint of a scrub jump
        if (tn.curKey !== null && !opts2.silent) tn.pop = 1;
        tn.curKey = key;
      }
    }
    const fxDay = Math.floor(curT / DAY);
    if (fxDay !== lastFxDay) { lastFxDay = fxDay; rebuildEffects(curT); }
    if (opts.onTimeChange) opts.onTimeChange(curState, curT, curT >= nowT);
    return curState;
  }

  // ---------- ambient animation ----------
  let elapsed = 0;
  app.ticker.add((ticker) => {
    elapsed += ticker.deltaMS / 1000;
    for (const tn of treeNodes.values()) {
      if (!tn.node.visible) continue;
      if (tn.e && tn.e.status !== 'churned') {
        tn.spr.skew.x = Math.sin(elapsed * 1.1 + tn.swayPhase) * 0.018;
      } else {
        tn.spr.skew.x = 0;
      }
      if (tn.pop > 0) {
        tn.pop = Math.max(0, tn.pop - ticker.deltaMS / 350);
        const s = 1 + Math.sin((1 - tn.pop) * Math.PI) * 0.25;
        tn.spr.scale.set(s, s);
      } else if (tn.spr.scale.x !== 1) {
        tn.spr.scale.set(1, 1);
      }
    }
    for (const sh of showers) {
      if (sh.flicker) {
        sh.cloud.alpha = 0.75 + Math.sin(elapsed * 5 + sh.phase) * 0.2;
        continue;
      }
      for (const d of sh.drops) {
        const tt = (elapsed * 0.9 + d.phase) % 1;
        d.y = d.baseY + tt * d.range;
        d.alpha = tt < 0.9 ? 0.9 : 0;
      }
    }
    for (const sp of sparks) {
      const tt = (elapsed * 0.7 + sp.phase) % 1;
      sp.x = sp.baseX;
      sp.y = sp.baseY - tt * 6;
      sp.alpha = tt < 0.15 ? tt / 0.15 : Math.max(0, 1 - (tt - 0.15) / 0.6);
      sp.scale.set(tt < 0.5 ? 1 : 0.5);
    }
  });

  // ---------- fit, pan, zoom ----------
  const worldW = gridN * TILE_W;
  const worldH = gridN * TILE_H + 40;
  function fit() {
    const scale = Math.max(1, Math.floor(Math.min(mount.clientWidth / worldW, mount.clientHeight / worldH) * 2));
    world.scale.set(opts.fixedScale ?? Math.max(1.5, scale));
    world.x = mount.clientWidth / 2;
    world.y = mount.clientHeight / 2 - (worldH * world.scale.y) / 2 + 30 * world.scale.y;
  }
  fit();
  window.addEventListener('resize', fit);

  if (opts.interactive !== false) {
    let dragging = null;
    app.canvas.addEventListener('pointerdown', (ev) => { dragging = { x: ev.clientX - world.x, y: ev.clientY - world.y }; });
    window.addEventListener('pointermove', (ev) => {
      if (dragging) { world.x = ev.clientX - dragging.x; world.y = ev.clientY - dragging.y; }
    });
    window.addEventListener('pointerup', () => { dragging = null; });
    app.canvas.addEventListener('wheel', (ev) => {
      ev.preventDefault();
      const dir = ev.deltaY < 0 ? 1.15 : 1 / 1.15;
      const ns = Math.min(6, Math.max(0.8, world.scale.x * dir));
      const rect = app.canvas.getBoundingClientRect();
      const mx = ev.clientX - rect.left, my = ev.clientY - rect.top;
      world.x = mx - (mx - world.x) * (ns / world.scale.x);
      world.y = my - (my - world.y) * (ns / world.scale.y);
      world.scale.set(ns);
    }, { passive: false });
  }

  // first paint at "now"
  setTime(nowT, { silent: true });

  return {
    app, treeNodes, setTime,
    get state() { return curState; },
    get t() { return curT; },
    t0, now: nowT,
    centerOn(subscriberId) {
      const tn = treeNodes.get(subscriberId);
      if (!tn) return;
      world.x = mount.clientWidth / 2 - tn.node.x * world.scale.x;
      world.y = mount.clientHeight / 2 - tn.node.y * world.scale.y;
    },
    highlight(subscriberId) {
      for (const [id, tn] of treeNodes) {
        tn.spr.tint = subscriberId == null || id === subscriberId ? 0xffffff : 0x9aa89a;
        tn.spr.alpha = subscriberId == null || id === subscriberId ? 1 : 0.75;
      }
    },
    destroy() {
      window.removeEventListener('resize', fit);
      app.destroy(true, { children: true });
    },
  };
}

window.ForestWorld = { createForestWorld };
