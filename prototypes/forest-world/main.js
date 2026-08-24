/* PROTOTYPE — throwaway code for tickets 05 + 06 (forest World + timeline).
 * Wiring: three page variants around the same renderer core. Switching,
 * presets and seeds all re-render client-side (no page reload), so the same
 * file works from file:// and as a bundled single-file artifact.
 * URL params (?variant=A|B|C, ?preset=, ?seed=, ?t=epoch) set the initial state.
 */

'use strict';

const VARIANTS = [
  { key: 'A', name: 'Overworld' },
  { key: 'B', name: 'Ranger station' },
  { key: 'C', name: 'Diorama' },
];

const url = new URL(location.href);
let curIdx = Math.max(0, VARIANTS.findIndex((v) => v.key === (url.searchParams.get('variant') || 'A').toUpperCase()));
let presetKey = url.searchParams.get('preset') || 'default';
let seed = url.searchParams.get('seed') || 'evergrow';
const tParam = url.searchParams.get('t');

const root = document.getElementById('root');
const tooltip = document.getElementById('tooltip');
let currentWorld = null;
let updateHud = null; // set by the active variant
let data = null;
let stateNow = null;
let renderToken = 0; // guards against overlapping async renders

const euro = (cents) => '€' + Math.round(cents / 100).toLocaleString('en-IE');

const STATUS_LABEL = { active: 'Healthy', at_risk: 'At risk', churned: 'Churned' };
const REASON_LABEL = {
  cancel_scheduled: 'cancellation scheduled', trial_ending: 'trial ending soon',
  paused: 'paused', past_due: 'payment past due', unpaid: 'unpaid',
};

// ---------- data ----------

function regenData() {
  const preset = window.MockSignals.PRESETS[presetKey] || {};
  data = window.MockSignals.generateMockSignals(Object.assign({ seed }, preset));
  stateNow = window.MockSignals.foldWorldState(data, data.params.now);
}

// ---------- tooltip ----------

let mouse = { x: 0, y: 0 };
window.addEventListener('pointermove', (ev) => {
  mouse = { x: ev.clientX, y: ev.clientY };
  if (tooltip.style.display === 'block') positionTooltip();
});
function positionTooltip() {
  tooltip.style.left = Math.min(window.innerWidth - 230, mouse.x + 16) + 'px';
  tooltip.style.top = Math.min(window.innerHeight - 140, mouse.y + 14) + 'px';
}
function showTooltip(e) {
  if (!e) { tooltip.style.display = 'none'; return; }
  const name = data.subscribers[e.subscriberId] || e.subscriberId;
  const sinceStr = new Date(e.appearedAt * 1000).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  const cls = e.status === 'at_risk' ? (e.severity === 'critical' ? 'critical' : 'warning') : e.status;
  let extra = '';
  if (e.status === 'at_risk') extra = `<div style="color:var(--alert)">${e.reasons.map((r) => REASON_LABEL[r]).join(', ')}</div>`;
  if (e.status === 'churned') extra = `<div style="color:#7d6f5f">left ${new Date(e.churnedAt * 1000).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</div>`;
  tooltip.innerHTML = `
    <div class="tt-name">${name}</div>
    <div><span class="dot ${cls}"></span>${STATUS_LABEL[e.status]} · Tier ${e.sizeTier}</div>
    <div>MRR ${e.status === 'churned' ? '—' : euro(e.mrr)} · since ${sinceStr}</div>
    ${extra}`;
  tooltip.style.display = 'block';
  positionTooltip();
}

const worldOpts = {
  onHover: showTooltip,
  onTimeChange: (s, t, isNow) => {
    if (updateHud) updateHud(s, t, isNow);
    tlSync(t, isNow);
  },
};

// ---------- variant A: Overworld ----------

async function renderA() {
  root.innerHTML = `
    <div class="vA-canvas" id="mount"></div>
    <div class="vA-hud">
      <div class="box">
        <div class="label">Your forest</div>
        <div class="stat-big" id="a-mrr"></div>
        <div class="label" style="margin-top:4px">monthly recurring revenue</div>
      </div>
      <div class="box">
        <div class="stat-small"><span class="dot active"></span><span id="a-active"></span> growing</div>
        <div class="stat-small"><span class="dot warning"></span><span id="a-risk"></span> need water</div>
        <div class="stat-small"><span class="dot churned"></span><span id="a-churned"></span> fell</div>
      </div>
    </div>
    <div class="vA-legend box">
      <div class="label" style="margin-bottom:6px">Field guide</div>
      <div>🌱→🌲 tree size = MRR tier</div>
      <div><span class="dot warning"></span>orange = churn risk</div>
      <div><span class="dot churned"></span>bare tree = churned</div>
      <div>🌧 rain = payment landed</div>
      <div>✨ sparkle = new subscriber</div>
    </div>`;
  updateHud = (s) => {
    document.getElementById('a-mrr').textContent = euro(s.totalMrr);
    document.getElementById('a-active').textContent = s.activeCount - s.atRiskCount;
    document.getElementById('a-risk').textContent = s.atRiskCount;
    document.getElementById('a-churned').textContent = s.churnedCount;
  };
  return window.ForestWorld.createForestWorld(
    document.getElementById('mount'), data, Object.assign({}, worldOpts));
}

// ---------- variant B: Ranger station ----------

async function renderB() {
  root.innerHTML = `
    <div class="vB">
      <div class="vB-head">
        <div class="box"><div class="label">MRR</div><div class="stat-big" id="b-mrr"></div></div>
        <div class="box"><div class="label">Subscribers</div><div class="stat-big" id="b-count"></div></div>
        <div class="box"><div class="label">At risk</div><div class="stat-big" style="color:var(--alert)" id="b-risk"></div></div>
        <div class="box"><div class="label">Churned (all time)</div><div class="stat-big" style="color:#7d6f5f" id="b-churned"></div></div>
      </div>
      <div class="vB-main">
        <div class="vB-world" id="mount"></div>
        <div class="vB-roster box">
          <h2>Roster</h2>
          <div id="b-rows"></div>
          <div id="roster-veil">the roster shows today — scrub to now to use it</div>
        </div>
      </div>
    </div>`;
  updateHud = (s, t, isNow) => {
    document.getElementById('b-mrr').textContent = euro(s.totalMrr);
    document.getElementById('b-count').textContent = s.activeCount;
    document.getElementById('b-risk').textContent = isNow ? s.atRiskCount : '—';
    document.getElementById('b-churned').textContent = s.churnedCount;
    document.getElementById('roster-veil').style.display = isNow ? 'none' : 'flex';
  };
  const world = await window.ForestWorld.createForestWorld(
    document.getElementById('mount'), data, Object.assign({}, worldOpts));

  const rows = document.getElementById('b-rows');
  const sorted = [...stateNow.entities].sort((a, b) =>
    (a.status === 'churned') - (b.status === 'churned') || b.mrr - a.mrr);
  for (const e of sorted) {
    const cls = e.status === 'at_risk' ? (e.severity === 'critical' ? 'critical' : 'warning') : e.status;
    const row = document.createElement('div');
    row.className = 'vB-row';
    row.innerHTML = `
      <span class="dot ${cls}"></span>
      <span class="tierpip">${'▲'.repeat(e.sizeTier)}</span>
      <span class="name">${data.subscribers[e.subscriberId] || e.subscriberId}</span>
      <span class="mrr">${e.status === 'churned' ? '—' : euro(e.mrr)}</span>`;
    row.addEventListener('pointerenter', () => world.highlight(e.subscriberId));
    row.addEventListener('pointerleave', () => world.highlight(null));
    row.addEventListener('click', () => world.centerOn(e.subscriberId));
    rows.appendChild(row);
  }
  return world;
}

// ---------- variant C: Diorama ----------

async function renderC() {
  root.innerHTML = `
    <div class="vC">
      <div class="vC-title">
        <div class="label" id="c-date">willow &amp; wick software</div>
        <div class="mrr" id="c-mrr"></div>
      </div>
      <div class="vC-frame" id="mount"></div>
      <div class="vC-caption"><b id="c-count"></b> subscribers growing · shared live from their Stripe world</div>
    </div>`;
  updateHud = (s, t) => {
    document.getElementById('c-mrr').innerHTML =
      euro(s.totalMrr) + ' <span style="font-size:12px;color:#9db4a4">/ mo</span>';
    document.getElementById('c-count').textContent = s.activeCount;
    document.getElementById('c-date').textContent = 'willow & wick software · ' +
      new Date(t * 1000).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }).toLowerCase();
  };
  return window.ForestWorld.createForestWorld(
    document.getElementById('mount'), data,
    Object.assign({ background: '#1c2a24' }, worldOpts));
}

// ---------- timeline (ticket 06) ----------

const tlRange = document.getElementById('tl-range');
const tlDate = document.getElementById('tl-date');
const tlPlay = document.getElementById('tl-play');
const tlToday = document.getElementById('tl-today');
const tlNote = document.getElementById('tl-note');
let playing = false;
let lastFrame = null;
const PLAY_SPEED = 6 * window.MockSignals.MONTH; // world-seconds per real second

function tlSync(t, isNow) {
  tlRange.value = t;
  tlDate.textContent = new Date(t * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  tlNote.style.display = isNow ? 'none' : 'block';
}

function setPlaying(on) {
  if (!currentWorld) return;
  playing = on;
  tlPlay.textContent = on ? '❚❚' : '▶';
  if (on) {
    // replay from the start when pressing play while at today
    if (+tlRange.value >= currentWorld.now - 1) currentWorld.setTime(currentWorld.t0, { silent: true });
    lastFrame = performance.now();
    requestAnimationFrame(step);
  }
}

function step(ts) {
  if (!playing || !currentWorld) return;
  const dt = (ts - lastFrame) / 1000;
  lastFrame = ts;
  const next = currentWorld.t + dt * PLAY_SPEED;
  if (next >= currentWorld.now) {
    currentWorld.setTime(currentWorld.now);
    setPlaying(false);
    return;
  }
  currentWorld.setTime(next);
  requestAnimationFrame(step);
}

tlRange.addEventListener('input', () => { if (!currentWorld) return; playing = false; tlPlay.textContent = '▶'; currentWorld.setTime(+tlRange.value); });
tlPlay.addEventListener('click', () => setPlaying(!playing));
tlToday.addEventListener('click', () => { if (!currentWorld) return; playing = false; tlPlay.textContent = '▶'; currentWorld.setTime(currentWorld.now); });

// ---------- render orchestration ----------

async function render(initialT) {
  const token = ++renderToken;
  setPlaying(false);
  showTooltip(null);
  if (currentWorld) { currentWorld.destroy(); currentWorld = null; }
  updateHud = null;
  document.getElementById('vlabel').textContent =
    VARIANTS[curIdx].key + ' — ' + VARIANTS[curIdx].name;

  const world = await ({ A: renderA, B: renderB, C: renderC }[VARIANTS[curIdx].key])();
  if (token !== renderToken) { world.destroy(); return; } // a newer render won
  currentWorld = world;
  tlRange.min = world.t0;
  tlRange.max = world.now;
  tlRange.step = window.MockSignals.DAY;
  const t = initialT ? Math.max(world.t0, Math.min(world.now, initialT)) : world.now;
  world.setTime(t, { silent: true });
}

// ---------- switcher ----------

document.getElementById('prev').addEventListener('click', () => {
  curIdx = (curIdx + VARIANTS.length - 1) % VARIANTS.length; render();
});
document.getElementById('next').addEventListener('click', () => {
  curIdx = (curIdx + 1) % VARIANTS.length; render();
});
window.addEventListener('keydown', (ev) => {
  const el = document.activeElement;
  const tag = el && el.tagName;
  if (tag === 'INPUT' && el.type !== 'range') return;
  if (tag === 'TEXTAREA' || (el && el.isContentEditable)) return;
  if (ev.key === 'ArrowLeft' && tag !== 'INPUT') document.getElementById('prev').click();
  if (ev.key === 'ArrowRight' && tag !== 'INPUT') document.getElementById('next').click();
  if (ev.key === ' ' && tag !== 'BUTTON') { ev.preventDefault(); setPlaying(!playing); }
});

const presetSel = document.getElementById('preset');
for (const key of Object.keys(window.MockSignals.PRESETS)) {
  const o = document.createElement('option');
  o.value = key; o.textContent = 'preset: ' + key;
  if (key === presetKey) o.selected = true;
  presetSel.appendChild(o);
}
presetSel.addEventListener('change', () => { presetKey = presetSel.value; regenData(); render(); });
const seedInput = document.getElementById('seed');
seedInput.value = seed;
seedInput.addEventListener('keydown', (ev) => {
  if (ev.key === 'Enter') { seed = seedInput.value || 'evergrow'; regenData(); render(); seedInput.blur(); }
});

// ---------- boot ----------

regenData();
render(tParam ? +tParam : null);
