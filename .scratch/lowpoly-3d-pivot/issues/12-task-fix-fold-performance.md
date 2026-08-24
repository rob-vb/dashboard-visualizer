# Task: fix the O(n²) rescan in `foldWorldState`

Type: task
Status: resolved
Blocked by: —

## Question

Nothing to decide. This is work that must happen before the gate can give an honest verdict.

[Research 02](../research/02-threejs-nextjs-scale.md) measured `foldWorldState` in `prototypes/forest-world/mock-signals.js` at **127.8 ms per fold at 1,583 Entities — about 8 fps**. The cause is `lastMrrBeforeChurn`, which rescans the whole **Timeline** for every churned **Entity**. Carrying `lastMrr` forward through the single pass the fold already makes takes it to **0.98 ms**, a 130× improvement, and keeps it under 10 ms out to roughly 8,000 Entities.

Two reasons this is a ticket and not a footnote:

1. **It would poison the gate.** [Ticket 08](08-prototype-3d-forest-gate.md) asks a human whether the 3D World feels good and whether scrubbing still feels good. At 8 fps the answer is no, and the pivot would be blamed for a bug that has nothing to do with 3D.
2. **It is engine-independent.** The fold is data-layer code above ADR-0001's Signal layer. This bites PixiJS identically — research 02 notes it is already marginal at the prototype's own `crowded` preset. Fixing it improves the fallback as much as the pivot.

Do:

- Fix `lastMrrBeforeChurn` in `prototypes/forest-world/mock-signals.js` by threading `lastMrr` through the existing pass.
- Keep the fold's output identical. The prototype's existing test asserts that placement at a past time T is a prefix of today's — it must still pass.
- Re-measure and record the before and after numbers in the answer.
- Note it for ticket 11: spec §2 names `foldWorldState` as the contract the production code re-implements 1:1, so the production port inherits this fix rather than the bug.

The agent can drive this alone. No human step.

## Answer

**Fixed. 1,583 Entities: 201.5 ms → 0.75 ms per fold, a 269× improvement.** The fold's output is byte-identical, proven by snapshot.

### The fix

`lastMrrBeforeChurn(data, e)` rescanned the whole Timeline once per churned Entity — O(entities × timeline). It is gone. `foldWorldState` now carries `lastMrr` forward through the single pass it already makes:

- `subscriber_appeared` / `subscriber_returned` set `mrr` **and** `lastMrr`
- `subscriber_grew` / `subscriber_shrank` set both to `s.mrr.to`
- `subscriber_churned` zeroes `mrr` and deliberately leaves `lastMrr` standing

Then `sizeTier = tierOf(status === 'churned' ? e.lastMrr : e.mrr, bounds)`.

Entities gain one field, `lastMrr`. No renderer change was needed — `world.js` never read the old helper.

### Why the output is provably identical

The old helper scanned the *unbounded* timeline but skipped `s.at > e.churnedAt`. Since a churned Entity always has `churnedAt <= t`, that set is exactly the signals the bounded pass already visits. The one worrying case — a `subscriber_grew` at the same second as the churn, where sort order puts `churned` first — also agrees: `subscriber_grew` writes `lastMrr` regardless of status, so both versions end on the grew value.

### Measured (`node prototypes/forest-world/test.mjs`)

| Entities | before | after | factor |
| --- | --- | --- | --- |
| 237 (`default`) | 5.80 ms | 0.31 ms | 19× |
| 792 (`crowded`-ish) | 78.2 ms | 0.72 ms | 109× |
| **1,583 (research 02's figure)** | **201.5 ms (5 fps)** | **0.75–0.96 ms** | **~250×** |
| 3,167 | 1,119 ms (1 fps) | 2.5–6.9 ms | ~250× |

The curve is now linear in Timeline length, not quadratic. Headroom against a 16.7 ms frame budget is roughly an order of magnitude at 3,000 Entities, so the fold is no longer the bottleneck at any scale ticket 08 will test.

Research 02 measured 127.8 ms where this run measured 201.5 ms at the same Entity count; different machine, same defect and same conclusion.

### Test harness

New: `prototypes/forest-world/test.mjs` plus `test-snapshot.json`. Run `node prototypes/forest-world/test.mjs`. It checks four things:

1. **determinism** — same seed yields a byte-identical Timeline
2. **prefix placement** — placement at 25/50/75% of history is a prefix of today's (ticket 06's assertion, now a committed test instead of an ad-hoc script)
3. **fold snapshot** — `totalMrr`, `activeCount`, `churnedCount`, `atRiskCount` and the full per-Entity `status:mrr:sizeTier` list, for all five presets at four timepoints. **The snapshot on disk was recorded against the pre-fix code and passes unchanged after the fix.** That is the proof of identical output.
4. **benchmark** — the table above

All checks pass.

### For ticket 11

Spec §2 names `foldWorldState` as the contract production re-implements 1:1. Point it at the fixed version. The rule to carry over: **a churned Entity's Size Tier comes from its `lastMrr`, carried forward in the fold, never from a rescan of the Timeline.** A production port that recomputes it per churned Subscriber re-introduces an O(n²) that is invisible at demo scale and fatal at customer scale.

### Note for ticket 08

The gate is unblocked on this axis. The fold is no longer a confound — a bad scrubbing verdict now means 3D, which is what the gate is for.
