/* PROTOTYPE — throwaway code for ticket 08 (the 3D Forest World gate).
 *
 * Wiring only. The page chrome is a deliberate copy of the 2D prototype's:
 * the gate compares two Worlds, so everything around the World is held still.
 * The one thing that is new — the dark instrument bar — is styled to read as
 * instrumentation, not as product.
 *
 * URL params: ?variant=A|B|S  ?preset=  ?seed=  ?t=epoch  ?pitch=26.565
 */

import { createForestWorld3D, KNOBS } from './world3d.js';

const VARIANTS = [
  { key: 'A', name: 'Overworld' },
  { key: 'B', name: 'Ranger station' },
  { key: 'S', name: 'Share link' },
];

const url = new URL(location.href);
let curIdx = Math.max(0, VARIANTS.findIndex((v) => v.key === (url.searchParams.get('variant') || 'A').toUpperCase()));
let presetKey = url.searchParams.get('preset') || 'default';
let seed = url.searchParams.get('seed') || 'evergrow';
const tParam = url.searchParams.get('t');
for (const [param, knob] of [['pitch', 'pitchDeg'], ['density', 'gridDensity'], ['relief', 'relief'], ['zoom', 'zoom'], ['lens', 'lensDeg']]) {
  if (url.searchParams.get(param) !== null) KNOBS[knob] = +url.searchParams.get(param);
}

const EXTRA_PRESETS = {
  scale1583: { targetSubscribers: 1000 },   // research 02's measured target
  scale3000: { targetSubscribers: 2000 },  // headroom check
};

const root = document.getElementById('root');
const tooltip = document.getElementById('tooltip');
let world = null, updateHud = null, data = null, stateNow = null, renderToken = 0;

const euro = (cents) => '€' + Math.round(cents / 100).toLocaleString('en-IE');
const STATUS_LABEL = { active: 'Healthy', at_risk: 'At risk', churned: 'Churned' };
const REASON_LABEL = {
  cancel_scheduled: 'cancellation scheduled', trial_ending: 'trial ending soon',
  paused: 'paused', past_due: 'payment past due', unpaid: 'unpaid',
};

function regenData() {
  const preset = window.MockSignals.PRESETS[presetKey] || EXTRA_PRESETS[presetKey] || {};
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
  onTimeChange: (s, t, isNow) => { if (updateHud) updateHud(s, t, isNow); tlSync(t, isNow); },
};

// ---------- the two yaw buttons (ticket 04 Q10) ----------

function yawButtons(mountEl) {
  const wrap = document.createElement('div');
  wrap.className = 'yaw';
  const hint = window.matchMedia('(pointer: coarse)').matches
    ? 'two fingers turn' : 'right-drag turns';
  // Ticket 13 Q5 — these are the recover control: they step the yaw a quarter turn
  // and ease the pitch back to the opening frame. They also advertise that the
  // World turns at all, which a drag gesture alone never does.
  wrap.innerHTML = `<button data-d="-1" title="Turn a quarter and straighten up (Q)">↺</button>
                    <span class="label" title="${hint}">turn</span>
                    <button data-d="1" title="Turn a quarter and straighten up (E)">↻</button>`;
  wrap.addEventListener('click', (ev) => {
    const b = ev.target.closest('button');
    if (b && world) world.yawStep(+b.dataset.d);
  });
  mountEl.parentElement.appendChild(wrap);
}

// ---------- variants ----------

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
      <div><span class="dot churned"></span>grey tree = churned</div>
      <div>🌧 rain = payment landed</div>
      <div>✨ sparkle = new subscriber</div>
      <div style="margin-top:6px;color:#6d6753">drag to pan · right-drag to turn and tilt<br>two fingers turn on touch · ↺ ↻ straighten up</div>
    </div>`;
  updateHud = (s) => {
    document.getElementById('a-mrr').textContent = euro(s.totalMrr);
    document.getElementById('a-active').textContent = s.activeCount - s.atRiskCount;
    document.getElementById('a-risk').textContent = s.atRiskCount;
    document.getElementById('a-churned').textContent = s.churnedCount;
  };
  const mountEl = document.getElementById('mount');
  const w = await createForestWorld3D(mountEl, data, worldOpts);
  yawButtons(mountEl);
  return w;
}

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
        <div class="vB-world"><div class="vB-mount" id="mount"></div></div>
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
  const mountEl = document.getElementById('mount');
  const w = await createForestWorld3D(mountEl, data, worldOpts);
  yawButtons(mountEl);

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
    row.addEventListener('pointerenter', () => w.highlight(e.subscriberId));
    row.addEventListener('pointerleave', () => w.highlight(null));
    row.addEventListener('click', () => w.centerOn(e.subscriberId));
    rows.appendChild(row);
  }
  return w;
}

// Ticket 04 Q11 / ticket 13 Q8: the share link is a camera position and a lighting
// state, not a layout. It opens hand-tuned, and the viewer takes over from there —
// the snap to the nearest stand is gone with the four-stand rule.
async function renderS() {
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
    document.getElementById('c-mrr').innerHTML = euro(s.totalMrr) + ' <span style="font-size:12px;color:#9db4a4">/ mo</span>';
    document.getElementById('c-count').textContent = s.activeCount;
    document.getElementById('c-date').textContent = 'willow & wick software · ' +
      new Date(t * 1000).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }).toLowerCase();
  };
  const wasNight = KNOBS.night;
  KNOBS.night = true;
  const w = await createForestWorld3D(document.getElementById('mount'), data, worldOpts);
  KNOBS.night = wasNight;
  // the curated opening frame: lower, tighter, off-stand
  w.setCamera({ yaw: Math.PI / 4 + 0.30, zoom: 1.2, target: [1.0, 0.5] });
  return w;
}

// ---------- timeline ----------

const tlRange = document.getElementById('tl-range');
const tlDate = document.getElementById('tl-date');
const tlPlay = document.getElementById('tl-play');
const tlToday = document.getElementById('tl-today');
const tlNote = document.getElementById('tl-note');
let playing = false, lastFrame = null;
const PLAY_SPEED = 6 * window.MockSignals.MONTH;

function tlSync(t, isNow) {
  tlRange.value = t;
  tlDate.textContent = new Date(t * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  tlNote.style.display = isNow ? 'none' : 'block';
}
function setPlaying(on) {
  if (!world) return;
  playing = on;
  tlPlay.textContent = on ? '❚❚' : '▶';
  if (on) {
    if (+tlRange.value >= world.now - 1) world.setTime(world.t0, { silent: true });
    lastFrame = performance.now();
    requestAnimationFrame(step);
  }
}
function step(ts) {
  if (!playing || !world) return;
  const dt = (ts - lastFrame) / 1000;
  lastFrame = ts;
  const next = world.t + dt * PLAY_SPEED;
  if (next >= world.now) { world.setTime(world.now); setPlaying(false); return; }
  world.setTime(next);
  requestAnimationFrame(step);
}
tlRange.addEventListener('input', () => { if (!world) return; playing = false; tlPlay.textContent = '▶'; world.setTime(+tlRange.value, { silent: true }); });
tlPlay.addEventListener('click', () => setPlaying(!playing));
tlToday.addEventListener('click', () => { if (!world) return; playing = false; tlPlay.textContent = '▶'; world.setTime(world.now); });

// ---------- render orchestration ----------

async function render(initialT) {
  const token = ++renderToken;
  setPlaying(false);
  showTooltip(null);
  if (world) { world.destroy(); world = null; }
  updateHud = null;
  document.getElementById('vlabel').textContent = VARIANTS[curIdx].key + ' — ' + VARIANTS[curIdx].name;
  const w = await ({ A: renderA, B: renderB, S: renderS }[VARIANTS[curIdx].key])();
  if (token !== renderToken) { w.destroy(); return; }
  world = w;
  window.__world = w; // prototype hook: lets a headless driver poke the camera
  tlRange.min = w.t0; tlRange.max = w.now; tlRange.step = window.MockSignals.DAY;
  w.setTime(initialT ? Math.max(w.t0, Math.min(w.now, initialT)) : w.now, { silent: true });
}

// ---------- switcher, presets, seed ----------

document.getElementById('prev').addEventListener('click', () => { curIdx = (curIdx + VARIANTS.length - 1) % VARIANTS.length; render(); });
document.getElementById('next').addEventListener('click', () => { curIdx = (curIdx + 1) % VARIANTS.length; render(); });
window.addEventListener('keydown', (ev) => {
  const el = document.activeElement, tag = el && el.tagName;
  if (tag === 'INPUT' && el.type !== 'range') return;
  if (tag === 'TEXTAREA' || (el && el.isContentEditable)) return;
  if (ev.key === 'ArrowLeft') document.getElementById('prev').click();
  if (ev.key === 'ArrowRight') document.getElementById('next').click();
  if (ev.key === 'q' && world) world.yawStep(-1);
  if (ev.key === 'e' && world) world.yawStep(1);
  if (ev.key === ' ' && tag !== 'BUTTON') { ev.preventDefault(); setPlaying(!playing); }
});

const presetSel = document.getElementById('preset');
for (const key of [...Object.keys(window.MockSignals.PRESETS), ...Object.keys(EXTRA_PRESETS)]) {
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

// ---------- the knob panel: every open question the map handed this ticket ----------

const KNOB_SPEC = [
  { k: 'lensDeg', label: 'Projection', kind: 'choice', options: [['20° lens', 20], ['18°', 18], ['30°', 30], ['ortho', 0]], note: 'ticket 13 — the 20° lens ships; ortho is ticket 04, kept as history', rebuild: true },
  { k: 'gridDensity', label: 'Cells per Entity', kind: 'choice', options: [['1.3', 1.3], ['1.6', 1.6], ['1.9', 1.9], ['3.0', 3.0]], note: 'ticket 13 — 1.3 ships; 1.9 and 3.0 are history, not options', rebuild: true },
  { k: 'relief', label: 'Ground relief', kind: 'choice', options: [['flat', 0], ['0.35', 0.35], ['0.55', 0.55], ['0.9', 0.9]], note: 'rolling ground, so depth reads without turning', rebuild: true },
  { k: 'scaleSpan', label: 'Tier scale span', kind: 'range', min: 0, max: 1, step: 0.05, note: '0 = silhouette only, 1 = the ticket-05 table' },
  { k: 'cloudZoom', label: 'Cloud zoom threshold', kind: 'range', min: 0.4, max: 2.6, step: 0.05, note: 'ticket 06 — clouds hide when zoomed out' },
  { k: 'cloudCap', label: 'Cloud cap', kind: 'range', min: 0, max: 800, step: 25 },
  { k: 'rampEase', label: 'Ease the 90-day ramp', kind: 'bool', note: 'ticket 06 — linear or eased' },
  { k: 'sway', label: 'Ambient sway', kind: 'bool', note: 'desktop only; off under reduced motion' },
  { k: 'fx', label: 'Rain / sparks', kind: 'bool' },
  { k: 'shadows', label: 'Shadows', kind: 'bool', note: 'first thing to cut on mobile' },
  { k: 'night', label: 'Night lighting', kind: 'bool' },
  { k: 'exposure', label: 'Exposure', kind: 'range', min: 0.5, max: 1.6, step: 0.05 },
];

const knobBody = document.getElementById('knob-body');
for (const spec of KNOB_SPEC) {
  const row = document.createElement('div');
  row.className = 'knob-row';
  const id = 'knob-' + spec.k;
  let control = '';
  if (spec.kind === 'choice') control = `<span class="seg" id="${id}">${spec.options.map(([l, v]) => `<button data-v="${v}" class="${KNOBS[spec.k] === v ? 'on' : ''}">${l}</button>`).join('')}</span>`;
  if (spec.kind === 'range') control = `<input id="${id}" type="range" min="${spec.min}" max="${spec.max}" step="${spec.step}" value="${KNOBS[spec.k]}"><output id="${id}-o">${KNOBS[spec.k]}</output>`;
  if (spec.kind === 'bool') control = `<input id="${id}" type="checkbox" ${KNOBS[spec.k] ? 'checked' : ''}>`;
  row.innerHTML = `<label for="${id}">${spec.label}${spec.note ? `<em>${spec.note}</em>` : ''}</label>${control}`;
  knobBody.appendChild(row);

  const el = document.getElementById(id);
  if (spec.kind === 'choice') {
    el.addEventListener('click', (ev) => {
      const b = ev.target.closest('button'); if (!b) return;
      KNOBS[spec.k] = +b.dataset.v;
      [...el.children].forEach((c) => c.classList.toggle('on', c === b));
      spec.rebuild ? render(world && world.t) : world && world.applyKnobs();
    });
  } else if (spec.kind === 'range') {
    el.addEventListener('input', () => {
      KNOBS[spec.k] = +el.value;
      document.getElementById(id + '-o').textContent = el.value;
      if (world) world.applyKnobs();
    });
  } else {
    el.addEventListener('change', () => { KNOBS[spec.k] = el.checked; if (world) world.applyKnobs(); });
  }
}
document.getElementById('knob-toggle').addEventListener('click', () => {
  document.getElementById('knobs').classList.toggle('open');
});

// ---------- the perf read-out this ticket owes the map ----------

const perf = document.getElementById('perf');
setInterval(() => {
  if (!world) return;
  const s = world.stats;
  perf.textContent = `${s.fps.toFixed(0)} fps · frame ${s.frameMs.toFixed(1)} ms (write ${s.writeMs.toFixed(1)} / gl ${s.renderMs.toFixed(1)}) · ${s.calls} calls · ${(s.tris / 1000).toFixed(0)}k tris · ${s.entities} entities · fold ${s.foldMs.toFixed(2)} ms`;
}, 250);

// ---------- boot ----------

regenData();
render(tParam ? +tParam : null);
