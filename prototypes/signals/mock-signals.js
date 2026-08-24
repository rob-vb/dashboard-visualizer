/* PROTOTYPE — throwaway code for ticket 05 (forest World).
 *
 * Mock Signal generator + canonical fold, per ticket 04:
 * - pure function of its params (seeded PRNG, injected `now`)
 * - emits an ordered Timeline of Moment Signals + a present-only Risk Overlay
 * - foldWorldState(timeline, t) is THE shared fold; the real Stripe adapter
 *   must reuse this exact function, not reimplement it.
 */

'use strict';

// ---------- seeded PRNG ----------

function hashString(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- name generator (flavor only) ----------

const NAME_A = ['Fern', 'Bramble', 'Cedar', 'Willow', 'Moss', 'Alder', 'Hazel', 'Rowan', 'Thorn', 'Wren', 'Otter', 'Heather', 'Sage', 'Juniper', 'Birch', 'Clover', 'Ivy', 'Maple', 'Reed', 'Aspen'];
const NAME_B = ['wood', 'field', 'brook', 'gate', 'forge', 'works', 'mill', 'haven', 'ridge', 'hollow', 'grove', 'burrow', 'stack', 'loft', 'yard', 'well'];
const NAME_C = ['Labs', 'Co', 'Studio', 'HQ', 'GmbH', 'Ltd', 'App', 'Software', 'Digital', 'Systems'];

function mkName(rand) {
  return NAME_A[(rand() * NAME_A.length) | 0] + NAME_B[(rand() * NAME_B.length) | 0] + ' ' + NAME_C[(rand() * NAME_C.length) | 0];
}

// ---------- generator ----------

const DAY = 86400;
const MONTH = 30 * DAY; // mock months are flat 30 days; good enough for a prototype

const DEFAULT_PARAMS = {
  seed: 'evergrow',
  now: Date.UTC(2026, 7, 18) / 1000, // fixed "now" so every run is identical
  historyMonths: 36,
  targetSubscribers: 150,
  growthCurve: 'sCurve', // linear | exponential | sCurve | plateau
  monthlyChurnRate: 0.03,
  planMix: [
    { mrr: 900, weight: 0.6 },
    { mrr: 2900, weight: 0.3 },
    { mrr: 9900, weight: 0.1 },
  ],
  upgradeRate: 0.02,
  downgradeRate: 0.01,
  trialShare: 0.2,
  trialDays: 14,
  paymentFailureRate: 0.05,
  returnRate: 0.05,
  riskShare: 0.08,
  currency: 'eur',
};

const PRESETS = {
  default: {},
  singlePlan: { planMix: [{ mrr: 1900, weight: 1 }], upgradeRate: 0, downgradeRate: 0 },
  tiny: { targetSubscribers: 5, historyMonths: 12 },
  churnWave: { targetSubscribers: 180, monthlyChurnRate: 0.02, churnWave: true },
  crowded: { targetSubscribers: 500 },
};

// cumulative share of subscribers that exist by month m (0..1)
function curveAt(kind, frac) {
  switch (kind) {
    case 'linear': return frac;
    case 'exponential': return (Math.pow(8, frac) - 1) / 7;
    case 'plateau': return Math.min(1, frac * 1.8);
    case 'sCurve':
    default: return 1 / (1 + Math.exp(-10 * (frac - 0.5)));
  }
}

function pickPlan(rand, planMix) {
  const total = planMix.reduce((s, p) => s + p.weight, 0);
  let r = rand() * total;
  for (const p of planMix) { r -= p.weight; if (r <= 0) return p.mrr; }
  return planMix[planMix.length - 1].mrr;
}

/**
 * Returns { timeline, riskOverlay, subscribers, params }
 * timeline: Moment Signals sorted by (at, subscriberId, kind)
 * riskOverlay: [{ subscriberId, reasons, severity }] — valid ONLY at params.now
 * subscribers: { id -> { name } } flavor lookup for the prototype UI
 */
function generateMockSignals(overrides = {}) {
  const params = Object.assign({}, DEFAULT_PARAMS, overrides);
  const rand = mulberry32(hashString(params.seed));
  const H = params.historyMonths;
  const t0 = params.now - H * MONTH;

  const subs = []; // { id, name, plan, mrr, appearedAt, churnedAt, alive, trialUntil, anniversaryDay }
  const raw = []; // signals without tier annotation
  const names = {};
  let counter = 0;

  // how many subscribers appear in each month (gross signups; churn eats into net)
  const signupsPerMonth = [];
  let cumulative = 0;
  // Overshoot the target a bit so that after churn the end count is near target.
  const gross = Math.round(params.targetSubscribers * (1 + params.monthlyChurnRate * H * 0.55));
  for (let m = 0; m < H; m++) {
    const want = Math.round(curveAt(params.growthCurve, (m + 1) / H) * gross);
    signupsPerMonth.push(Math.max(0, want - cumulative));
    cumulative = Math.max(cumulative, want);
  }

  function emit(kind, at, sub, extra) {
    raw.push(Object.assign({ kind, at: Math.round(at), subscriberId: sub.id }, extra || {}));
  }

  for (let m = 0; m < H; m++) {
    const monthStart = t0 + m * MONTH;

    // --- new subscribers this month ---
    for (let i = 0; i < signupsPerMonth[m]; i++) {
      const id = 'sub_' + String(++counter).padStart(4, '0');
      const appearedAt = monthStart + rand() * MONTH;
      const plan = pickPlan(rand, params.planMix);
      const onTrial = rand() < params.trialShare;
      const sub = {
        id, plan,
        mrr: onTrial ? 0 : plan,
        appearedAt, alive: true, churnedAt: null,
        trialUntil: onTrial ? appearedAt + params.trialDays * DAY : null,
        anniversaryDay: appearedAt,
      };
      names[id] = mkName(rand);
      subs.push(sub);
      emit('subscriber_appeared', appearedAt, sub, { mrr: sub.mrr });
    }

    // --- existing subscribers: trials convert, payments, churn, plan changes ---
    for (const sub of subs) {
      if (!sub.alive || sub.appearedAt > monthStart + MONTH) continue;
      const isNewThisMonth = sub.appearedAt >= monthStart;

      // trial conversion (or silent trial churn)
      if (sub.trialUntil !== null && sub.trialUntil <= monthStart + MONTH) {
        if (rand() < 0.75) {
          emit('subscriber_grew', sub.trialUntil, sub, { mrr: { from: 0, to: sub.plan } });
          sub.mrr = sub.plan;
          sub.anniversaryDay = sub.trialUntil;
        } else {
          emit('subscriber_churned', sub.trialUntil, sub, {});
          sub.alive = false; sub.churnedAt = sub.trialUntil; sub.mrr = 0;
        }
        sub.trialUntil = null;
        continue;
      }
      if (sub.trialUntil !== null) continue; // still trialing, nothing else happens

      // monthly payment on the anniversary
      if (!isNewThisMonth || sub.anniversaryDay <= monthStart + MONTH) {
        const payAt = monthStart + ((sub.anniversaryDay - t0) % MONTH);
        if (sub.mrr > 0 && payAt >= sub.appearedAt) {
          if (rand() < params.paymentFailureRate) {
            emit('payment_failed', payAt, sub, { amount: sub.mrr, currency: params.currency });
            // a failed payment sometimes ends in churn a few days later
            if (rand() < 0.3) {
              const churnAt = payAt + (3 + rand() * 10) * DAY;
              emit('subscriber_churned', churnAt, sub, {});
              sub.alive = false; sub.churnedAt = churnAt; sub.mrr = 0;
              continue;
            }
          } else {
            emit('payment_received', payAt, sub, { amount: sub.mrr, currency: params.currency });
          }
        }
      }

      // voluntary churn
      let churnRate = params.monthlyChurnRate;
      if (params.churnWave && m >= H - 5 && m <= H - 3) churnRate *= 4; // a bad quarter
      if (!isNewThisMonth && rand() < churnRate) {
        const churnAt = monthStart + rand() * MONTH;
        emit('subscriber_churned', churnAt, sub, {});
        sub.alive = false; sub.churnedAt = churnAt; sub.mrr = 0;
        continue;
      }

      // upgrades / downgrades
      if (!isNewThisMonth && rand() < params.upgradeRate) {
        const at = monthStart + rand() * MONTH;
        const to = Math.round(sub.mrr * (rand() < 0.5 ? 2 : 1.5));
        emit('subscriber_grew', at, sub, { mrr: { from: sub.mrr, to } });
        sub.mrr = to;
      } else if (!isNewThisMonth && sub.mrr > 900 && rand() < params.downgradeRate) {
        const at = monthStart + rand() * MONTH;
        const to = Math.max(900, Math.round(sub.mrr / 2));
        emit('subscriber_shrank', at, sub, { mrr: { from: sub.mrr, to } });
        sub.mrr = to;
      }
    }

    // --- returns: a churned subscriber comes back ---
    for (const sub of subs) {
      if (sub.alive || sub.churnedAt === null) continue;
      if (monthStart - sub.churnedAt > 2 * MONTH && rand() < params.returnRate / 6) {
        const at = monthStart + rand() * MONTH;
        const plan = pickPlan(rand, params.planMix);
        emit('subscriber_returned', at, sub, { mrr: plan });
        sub.alive = true; sub.mrr = plan; sub.plan = plan;
        sub.anniversaryDay = at; sub.churnedAt = null;
      }
    }
  }

  // drop anything generated past `now`
  const timeline = raw.filter((s) => s.at <= params.now);

  // ---------- tier annotation (two-pass, quantile boundaries per ticket 04) ----------
  const observed = [];
  for (const s of timeline) {
    if (s.kind === 'subscriber_appeared' || s.kind === 'subscriber_returned') observed.push(s.mrr);
    if (s.kind === 'subscriber_grew' || s.kind === 'subscriber_shrank') observed.push(s.mrr.to);
  }
  const boundaries = tierBoundaries(observed);
  for (const s of timeline) {
    if (s.kind === 'subscriber_grew' || s.kind === 'subscriber_shrank') {
      s.tier = { from: tierOf(s.mrr.from, boundaries), to: tierOf(s.mrr.to, boundaries) };
    }
  }

  timeline.sort((a, b) => a.at - b.at || (a.subscriberId < b.subscriberId ? -1 : a.subscriberId > b.subscriberId ? 1 : 0) || (a.kind < b.kind ? -1 : 1));

  // ---------- Risk Overlay (present only) ----------
  const activeNow = subs.filter((s) => s.alive && s.appearedAt <= params.now);
  const riskOverlay = [];
  const reasonsPool = [
    { reasons: ['cancel_scheduled'], severity: 'warning' },
    { reasons: ['trial_ending'], severity: 'warning' },
    { reasons: ['paused'], severity: 'warning' },
    { reasons: ['past_due'], severity: 'critical' },
    { reasons: ['unpaid'], severity: 'critical' },
    { reasons: ['past_due', 'cancel_scheduled'], severity: 'critical' },
  ];
  for (const sub of activeNow) {
    if (rand() < params.riskShare) {
      riskOverlay.push(Object.assign({ subscriberId: sub.id }, reasonsPool[(rand() * reasonsPool.length) | 0]));
    }
  }

  return { timeline, riskOverlay, subscribers: names, params, tierBounds: boundaries };
}

// ---------- tiers ----------

// Quantiles over DISTINCT observed MRR values — a plan most subscribers share
// must not collapse all four tiers onto one boundary.
function tierBoundaries(mrrValues) {
  const vals = [...new Set(mrrValues.filter((v) => v > 0))].sort((a, b) => a - b);
  if (vals.length === 0) return [1, 2, 3];
  const q = (p) => vals[Math.min(vals.length - 1, Math.floor(p * vals.length))];
  return [q(0.25), q(0.5), q(0.75)];
}

function tierOf(mrr, bounds) {
  if (mrr <= 0) return 1; // trialing
  if (bounds[0] === bounds[2]) return 2; // single-plan business: everyone mature
  if (mrr < bounds[0]) return 1;
  if (mrr < bounds[1]) return 2;
  if (mrr < bounds[2]) return 3;
  return 4;
}

// ---------- the canonical fold ----------

/**
 * foldWorldState(data, t) — World state at time t.
 * Risk Overlay merges ONLY when t >= data.params.now (ADR-0002).
 */
function foldWorldState(data, t) {
  const by = new Map(); // subscriberId -> entity state
  for (const s of data.timeline) {
    if (s.at > t) break;
    let e = by.get(s.subscriberId);
    switch (s.kind) {
      case 'subscriber_appeared':
        by.set(s.subscriberId, { subscriberId: s.subscriberId, status: 'active', mrr: s.mrr, lastMrr: s.mrr, appearedAt: s.at, churnedAt: null });
        break;
      case 'subscriber_returned':
        if (e) { e.status = 'active'; e.mrr = s.mrr; e.lastMrr = s.mrr; e.churnedAt = null; }
        break;
      case 'subscriber_grew':
      case 'subscriber_shrank':
        if (e) { e.mrr = s.mrr.to; e.lastMrr = s.mrr.to; }
        break;
      case 'subscriber_churned':
        // `lastMrr` deliberately survives churn: a churned Entity keeps the Size
        // Tier it died at, so the stump matches the tree that stood there.
        if (e) { e.status = 'churned'; e.mrr = 0; e.churnedAt = s.at; }
        break;
      // payments do not change durable state; themes read them from the window
    }
  }
  const entities = [...by.values()];
  for (const e of entities) e.sizeTier = tierOf(e.status === 'churned' ? e.lastMrr : e.mrr, data.tierBounds);

  // Risk Overlay: present only
  if (t >= data.params.now) {
    for (const r of data.riskOverlay) {
      const e = by.get(r.subscriberId);
      if (e && e.status === 'active') { e.status = 'at_risk'; e.reasons = r.reasons; e.severity = r.severity; }
    }
  }

  const active = entities.filter((e) => e.status !== 'churned');
  return {
    entities,
    totalMrr: active.reduce((s, e) => s + e.mrr, 0),
    activeCount: active.length,
    churnedCount: entities.length - active.length,
    atRiskCount: entities.filter((e) => e.status === 'at_risk').length,
  };
}

// ---------- deterministic placement (proves ticket 06's layout rule) ----------
//
// Cells are ordered center-out with seeded jitter, independent of the business.
// Subscribers are placed in order of first appearance; each starts probing at
// hash(subscriberId) and takes the first free cell. Because appearance order is
// itself part of the Timeline, the placement at any time T is a prefix of the
// placement at now — a subscriber keeps its spot forever.

function buildPlacement(data, gridN) {
  const jrand = mulberry32(hashString('placement-v1'));
  const cells = [];
  const c = (gridN - 1) / 2;
  for (let x = 0; x < gridN; x++) for (let y = 0; y < gridN; y++) {
    cells.push({ x, y, key: Math.hypot(x - c, y - c) + jrand() * 1.7 });
  }
  cells.sort((a, b) => a.key - b.key);

  const appeared = data.timeline.filter((s) => s.kind === 'subscriber_appeared');
  const taken = new Set();
  const spots = new Map();
  for (const s of appeared) {
    let i = hashString(s.subscriberId) % cells.length;
    while (taken.has(i)) i = (i + 1) % cells.length;
    taken.add(i);
    spots.set(s.subscriberId, { x: cells[i].x, y: cells[i].y });
  }
  return spots;
}

// expose as globals (file:// prototype, no bundler)
window.MockSignals = { generateMockSignals, foldWorldState, buildPlacement, tierOf, PRESETS, DEFAULT_PARAMS, hashString, mulberry32, MONTH, DAY };
