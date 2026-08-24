/* PROTOTYPE test harness — run with: node prototypes/forest-world/test.mjs
 *
 * Loads mock-signals.js (a file:// global-scope script) under a fake `window`,
 * then runs:
 *   1. determinism      — same seed -> byte-identical Timeline
 *   2. prefix placement — placement at a past T is a prefix of today's (ticket 06)
 *   3. fold snapshot    — records fold output so a refactor can prove it identical
 *   4. benchmark        — ms per foldWorldState at several Entity counts (ticket 12)
 *
 * Flags:
 *   --snapshot   write the fold snapshot to test-snapshot.json instead of checking it
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { performance } from 'node:perf_hooks';

const HERE = dirname(fileURLToPath(import.meta.url));
const SNAPSHOT = join(HERE, 'test-snapshot.json');

// ---------- load the prototype's global-scope script ----------
const src = readFileSync(join(HERE, 'mock-signals.js'), 'utf8');
const win = {};
new Function('window', src)(win);
const M = win.MockSignals;

let failures = 0;
function check(name, ok, detail) {
  if (ok) { console.log(`  PASS  ${name}`); return; }
  failures++;
  console.log(`  FAIL  ${name}${detail ? '\n        ' + detail : ''}`);
}

// ---------- 1. determinism ----------
console.log('\ndeterminism');
{
  const a = M.generateMockSignals();
  const b = M.generateMockSignals();
  check('same seed -> identical Timeline', JSON.stringify(a.timeline) === JSON.stringify(b.timeline));
  const c = M.generateMockSignals({ seed: 'other-seed' });
  check('different seed -> different Timeline', JSON.stringify(a.timeline) !== JSON.stringify(c.timeline));
}

// ---------- 2. prefix placement (ticket 06) ----------
console.log('\nprefix placement');
{
  const data = M.generateMockSignals();
  const t0 = data.params.now - data.params.historyMonths * M.MONTH;
  const span = data.params.now - t0;
  const today = M.buildPlacement(data, 24);

  for (const frac of [0.25, 0.5, 0.75]) {
    const t = t0 + span * frac;
    const past = M.buildPlacement({ ...data, timeline: data.timeline.filter((s) => s.at <= t) }, 24);
    let bad = null;
    for (const [id, spot] of past) {
      const nowSpot = today.get(id);
      if (!nowSpot || nowSpot.x !== spot.x || nowSpot.y !== spot.y) { bad = id; break; }
    }
    check(`placement at ${frac * 100}% of history is a prefix of today's (${past.size} entities)`,
      bad === null, bad && `subscriber ${bad} moved`);
  }
}

// ---------- 3. fold snapshot ----------
console.log('\nfold output');
{
  const shots = {};
  for (const preset of Object.keys(M.PRESETS)) {
    const data = M.generateMockSignals(M.PRESETS[preset]);
    const t0 = data.params.now - data.params.historyMonths * M.MONTH;
    const span = data.params.now - t0;
    shots[preset] = [0.1, 0.4, 0.7, 1].map((frac) => {
      const w = M.foldWorldState(data, t0 + span * frac);
      return {
        frac,
        totalMrr: w.totalMrr,
        activeCount: w.activeCount,
        churnedCount: w.churnedCount,
        atRiskCount: w.atRiskCount,
        // sizeTier per entity is what the O(n^2) rescan feeds — snapshot it exactly
        tiers: w.entities.map((e) => `${e.subscriberId}:${e.status}:${e.mrr}:${e.sizeTier}`).sort().join(','),
      };
    });
  }
  const json = JSON.stringify(shots, null, 2);
  if (process.argv.includes('--snapshot')) {
    writeFileSync(SNAPSHOT, json);
    console.log(`  WROTE ${SNAPSHOT}`);
  } else if (!existsSync(SNAPSHOT)) {
    console.log('  SKIP  no snapshot on disk — run with --snapshot first');
  } else {
    const want = readFileSync(SNAPSHOT, 'utf8');
    if (json === want) {
      check('fold output matches snapshot (all presets, 4 timepoints)', true);
    } else {
      const wantObj = JSON.parse(want), gotObj = shots, diffs = [];
      for (const p of Object.keys(gotObj))
        for (let i = 0; i < gotObj[p].length; i++)
          for (const k of Object.keys(gotObj[p][i]))
            if (JSON.stringify(gotObj[p][i][k]) !== JSON.stringify(wantObj[p]?.[i]?.[k]))
              diffs.push(`${p}[${gotObj[p][i].frac}].${k}`);
      check('fold output matches snapshot', false, `differs at: ${diffs.slice(0, 8).join(', ')}${diffs.length > 8 ? ` (+${diffs.length - 8})` : ''}`);
    }
  }
}

// ---------- 4. benchmark (ticket 12) ----------
console.log('\nfoldWorldState benchmark');
{
  const row = (label, entities, ms) =>
    console.log(`  ${label.padEnd(26)} ${String(entities).padStart(6)} entities   ${ms.toFixed(2).padStart(8)} ms/fold   ${(1000 / ms).toFixed(0).padStart(5)} fps`);

  for (const target of [150, 500, 1000, 2000]) {
    const data = M.generateMockSignals({ targetSubscribers: target });
    const n = new Set(data.timeline.map((s) => s.subscriberId)).size;
    const t = data.params.now;
    M.foldWorldState(data, t); // warm
    const reps = n > 1200 ? 5 : 25;
    const start = performance.now();
    for (let i = 0; i < reps; i++) M.foldWorldState(data, t - i * M.DAY);
    row(`targetSubscribers=${target}`, n, (performance.now() - start) / reps);
  }
}

console.log(failures ? `\n${failures} FAILURE(S)\n` : '\nall checks passed\n');
process.exit(failures ? 1 : 0);
