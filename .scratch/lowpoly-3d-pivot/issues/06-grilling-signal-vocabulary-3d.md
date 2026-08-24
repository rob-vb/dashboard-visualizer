# Grilling: the Signal vocabulary in 3D

Type: grilling
Status: resolved
Blocked by: 01, 04

## Question

Every **Signal** the closed effort mapped to a pixel-art effect needs a 3D answer. What is each one?

The 2D vocabulary, as approved on 2026-08-18 (spec §4, [ticket 05](../../isometric-dashboard/issues/05-prototype-forest-world.md)):

| Signal | 2D form (approved) | 3D form? |
|---|---|---|
| payment received | rain from a warm-white cloud, plain drops | ? |
| payment failed | rain from a dark cloud | ? |
| appeared | a new tree | ? |
| grew / shrank | Size Tier change | see ticket 05 |
| churned | dead tree, then a stump after the 90-day mourning window | ? |
| returned | ? | ? |
| Risk Overlay | orange glow, present-time only (ADR-0002) | ? |

Settle each row. Watch for the traps 3D introduces:

- **The risk glow.** In 2D it was a colour swap. In 3D it competes with real lighting. Emissive material, outline pass, a light, or a marker object above the Entity?
- **Rain.** A particle system over a whole World of 1,000 Entities is a different cost from a sprite overlay. And rain that falls on the whole scene cannot say *which* subscriber paid. Per-Entity or global?
- **Readability at a distance.** The 2D World was read at one fixed zoom. Depending on ticket 04, a 3D World may be read from far away, where a subtle material change vanishes.
- **The mourning window.** A churned Entity decays to a residue form after 90 days (theme template §2). Does the decay animate over those 90 days, or snap?

Output feeds the rewrite of [`docs/theme-definition-template.md`](../../../docs/theme-definition-template.md), which is written for sprites.

Consult `mattpocock-skills:grilling`, `mattpocock-skills:domain-modeling` and `frontend-design`.

## Answer

Resolved 2026-08-24. User delegated the decisions ("ik volg al jouw aanbevelingen") for every grilling ticket open on that date; later grilling tickets return to a live exchange.

### The governing constraint

Research 02 fixes the renderer as one `InstancedMesh` per geometry. That leaves **exactly two per-Entity channels**: the instance matrix (`setMatrixAt` — position, rotation, scale) and an RGB multiply (`setColorAt`). There is no per-instance opacity, no per-instance material, no per-instance geometry. Everything a Signal wants to say must fit in those two channels, in a **geometry swap** (moving an instance between `InstancedMesh`es), or in a **fixed-size FX pool** — a separate `InstancedMesh` allocated once, never reallocated in a frame.

This is not a limitation to work around. It is the reason the World costs ~38 draw calls at any Entity count, and every row below is designed to live inside it.

### Two corrections to the premise

**1. The churn ladder had a hole.** Ticket 05 assigned `stump_oldTall` / `stump_old` to churned Entities. But the approved 2D vocabulary has *two* churn forms — a standing dead snag for the 90-day mourning window, then a stump. Kenney's Nature Kit ships no dead standing tree. The mourning window had no dramatic form in 3D. Row 5 below closes this without new geometry.

**2. `returned` was never designed.** The 2D column in the question is `?` and that is accurate: `world.js:123` folds `subscriber_returned` into the `subscriber_appeared` bucket and draws the identical three sparkles. Ticket 04's *"the same tree revives, same spot"* is an identity rule, not a visual. This row is a new decision, not a port.

### Decisions

**Q1 — The effect budget: no extra render pass.** The vocabulary is instance matrix + instance colour + FX pools. No outline pass, no bloom, no `EffectComposer`. Research 02 budgets ~16–22 draw calls and three FX `InstancedMesh`es and never budgets a full-screen pass; a pass also fights `frameloop="demand"` (named the single biggest mobile win) and spends the exact fill-rate headroom the mobile mitigation ladder reserves. If ticket 08 shows the risk state reads too weakly at distance, the pass is bought **then**, as a measured post-gate upgrade — not assumed now.

**Q2 — The canopy and the trunk are separate `InstancedMesh`es.** `setColorAt` multiplies the whole instance, so a single mesh per tree would turn the *trunk* orange in the at-risk state. The 2D version recoloured the canopy only (`sprites.js:20-24`). A two-material GLB splits into two mesh primitives anyway, so the split costs nothing to author: each living geometry becomes a `leafsDark` mesh and a `woodBarkDark` mesh, each with its own colour channel.

Draw-call budget after the split: **13 living × 2 + 2 stumps × 1 = 28 Entity meshes**, + 1 ground + ~6 scenery + 3 FX = **~38**, against R3F's stated ceiling of 1000 and still independent of Entity count. Two build notes carry forward from ticket 05: `metallicFactor` is 1 kit-wide and must be overridden to 0 or the forest renders near-black; the two stray `_defaultMat` triangles in `tree_pineRoundB` must be deleted or reassigned so they do not open a third mesh.

**Q3 — Payment rain: drops at every zoom, clouds only when zoomed in.** With monthly billing and the 10-day window, roughly a third of all Entities carry a payment at any time. At 1,000 Entities that is ~230 clouds, which from a fixed isometric pitch is a ceiling — it hides the World the pivot exists to show. The cloud is kept where the viewer can actually read it and dropped from the wide shot. The FX pool is capped on top of that; the cap value and the zoom threshold are ticket 08 knobs.

The cloud stays **warm-white** (`#fbf6e8` top, `#e6dcc4` bottom) and the drops stay **plain blue** (`#7fb2d8`, tip `#a8cde8`). Both are user decisions from 2026-08-18 and neither is re-opened: the warm cloud is the fix for "rain reads negative", and the gold glints were tried and rejected. Payment *amount* stays unvisualised, as in 2D — `s.amount` is carried and never read.

**Q4 — Payment failed: same dark cloud, no drops, flicker by brightness not alpha.** The failure cloud shares the cloud pool's geometry and is distinguished by `setColorAt` (`#57606a` / `#3d454e`). The 2D flicker is an alpha oscillation (`0.55 → 0.95`, period ~1257 ms); per-instance alpha does not exist, so the same read is produced by a **brightness multiply** on the same period. Fix one 2D bug while porting: `phase` is hard-coded to `0` in `world.js:216-219`, so every failure cloud in the World flickers in unison. Give each a phase from `hash('fail:' + subscriberId)`.

The 2D precedence rule survives verbatim: **a payment in the same window cancels the failure cloud.** Rain wins.

Failed payments are legible at wide zoom even without the cloud, because `past_due` and `unpaid` are *critical* Risk Overlay reasons — the tree is already deep orange-red across its whole silhouette. So the same zoom rule applies to both clouds with no loss of signal.

**Q5 — FX are world-space and thin out with distance; they never compensate for zoom.** At full zoom-out the whole World fits the frame and an Entity is a few pixels. A colour multiply survives that, because it paints the entire silhouette; a cloud or a spark does not. Screen-space FX at 1,000 Entities would turn the wide shot into confetti. The wide shot answers *"how big is my forest, and how much of it is orange"*; the stats header carries the exact numbers; detail is what zooming in buys. This is the general readability rule for the Theme, not a per-Signal exception.

**Q6 — The Risk Overlay is a canopy colour multiply, two levels, nothing else.** Q2 makes this a faithful port of the approved 2D form, and Q5 makes it the one thing that still reads at full zoom-out. Target rendered colours are the approved 2D values:

| State | Target canopy |
|---|---|
| `active` | `#3e8b50` |
| `at_risk` warning | `#d1913c` |
| `at_risk` critical | `#c2612f` |

These are *targets under scene lighting*, not multiply factors. The factor is solved against the lit `leafsDark` base and tuned by eye in ticket 08. Severity remains max-over-reasons, and the overlay remains gated to `t >= now` per ADR-0002 — scrubbing to the past removes all orange, and no FX or geometry may leak risk into a past frame.

**Q7 — Churn, recent: the tree it died at, drained of colour.** No new geometry. The Entity keeps its living geometry and Size Tier and its canopy tint ramps from `#3e8b50` to bare grey-brown `#7d6f5f`; the trunk mesh ramps to the same family; the ambient sway stops. This is truer than the 2D form — 2D drew a purpose-made generic snag, while this says *that* tree died. It also matches the fold, which deliberately carries `lastMrr` through churn so the residue matches the tree that stood there.

**The tint ramps across the whole 90-day mourning window rather than snapping.** This is a free colour lerp and it buys real information: at any time T a viewer can see *how recently* a Subscriber was lost, and during replay (36 months in ~6 s, so 90 days ≈ 500 ms) it reads as a fade rather than a blink. There is no collision with the at-risk orange — green→grey-brown passes through desaturated olive, never orange, and a churned Entity can never carry a risk state anyway (`status` is `'churned'`, and the overlay only writes to `'active'`).

**Q8 — Churn, after the window: geometry snaps to the stump with the 600 ms tween.** `stump_oldTall` (0.667) for tiers 3–4, `stump_old` (0.267) for tiers 1–2, per ticket 05. The *geometry* snaps because the ladder is discrete; the tween covers the swap the same way a tier change does. Shadow contribution drops, matching 2D's `shadow.alpha` 0.8 → 0.35.

**Q9 — Appeared: three gold sparks, ported directly.** `#ffe98a` with a `#fff7cf` core, ~1429 ms cycle, rising, fading in fast and out slow. Ported to a spark FX pool; the 2D hard 1.0→0.5 scale step at the halfway point becomes a continuous shrink, since a matrix write is free and the step was a sprite-atlas artifact.

**Q10 — Returned gets its own form: five cool-white sparks.** `#cfeeff` with a `#ffffff` core, same motion as `appeared`, five instead of three. The colour is the distinguishing mark: gold says *new*, cool-white says *back*. Cool-white was chosen because it collides with neither the canopy green nor the risk orange, so a returning Subscriber is unambiguous at a glance even in a World that is mostly orange.

The geometry already carries half the story on its own — a stump becomes a tier-1 tree on the same spot, with the 600 ms tween — which is a resurrection, visibly not a birth. This is the single row where 3D says something 2D structurally could not.

**Q11 — Grew and shrank: unchanged from ticket 05.** A ~600 ms uniform scale tween through the geometry swap, on tier crossings only, live and in replay, hard-cut on scrub. No overshoot: 2D's 350 ms pop to 1.25× existed because a sprite swap had nothing else to sell the change, and the geometry swap now does that work. Wire the variant index so tier 3's `pineTallA` prefers tier 4's `pineTallB` — measured as literally the same crown on a trunk extended by `dY = +0.405`, which is the strongest available reading of *"the same subscriber, grown"*.

**Q12 — Ambient loop: a phased base tilt, off on mobile and under reduced motion.** The 2D canopy skew (`skew.x`, ~1.03°, ~5712 ms, per-tree phase) becomes a small rotation about the trunk base written into the instance matrix. Cost is the measured worst case — 0.400 ms to rewrite all 1,583 matrices — which is affordable, but a permanently animating World defeats `frameloop="demand"`, so sway is **desktop-only**.

**`prefers-reduced-motion` is honoured, closing a gap the 2D prototype left open.** Template §4 requires it and `world.js` never queries it. Under reduced motion: sway off, drop fall off, spark rise off, cloud flicker off, tier and churn tweens hard-cut. Every *state* — colour, geometry, Size Tier, risk, churn — is unaffected. Motion is decoration here; nothing in the Signal set is encoded in motion alone.

### The resolved table

| Signal | 2D form (approved) | 3D form |
|---|---|---|
| payment received | rain from a warm-white cloud, plain drops | same, from an FX pool; drops at every zoom, cloud only when zoomed in; pool capped |
| payment failed | dark cloud, flicker, no rain | same cloud pool tinted dark, brightness flicker instead of alpha, per-Entity phase; payment still wins |
| appeared | 3 gold sparks | same, 3 sparks `#ffe98a`, from the spark pool |
| grew / shrank | Size Tier change | ticket 05: geometry swap + ~600 ms scale tween, tier crossings only, hard-cut on scrub |
| churned, recent | standing dead tree | **its own geometry, tint ramping green → `#7d6f5f` across the 90 days, sway stopped** |
| churned, after the window | stump | `stump_oldTall` / `stump_old`, snap + 600 ms tween |
| returned | *(never designed)* | **stump → tier-1 tree with the tween, plus 5 cool-white `#cfeeff` sparks** |
| Risk Overlay | orange canopy swap | canopy-mesh colour multiply, warning `#d1913c` / critical `#c2612f`, present-time only |

### FX pools

Three `InstancedMesh`es, allocated once with a fixed max count, never reallocated in a frame — this is the one thing research 02 names as breaking under a naive port, because `PLAY_SPEED` advances ~180 world-days per second and the 2D `rebuildEffects` day-bucket guard therefore passes on every frame during replay.

| Pool | Serves | Colour channel |
|---|---|---|
| Cloud | payment received, payment failed | warm-white vs dark |
| Drop | payment received | fixed |
| Spark | appeared, returned | gold vs cool-white |

### Handed to ticket 08 as knobs

- Cloud zoom threshold, and the cloud/drop/spark pool caps.
- Canopy multiply factors that land on the four target colours under the chosen lighting.
- Whether the 90-day tint ramp is linear or eased.
- Whether cool-white reads as "returned" without a legend, or needs a second cue.

### Handed to ticket 11

`docs/theme-definition-template.md` §3 and §4 are the sprite-bound sections this ticket rewrites. §3's effect table becomes the resolved table above. §4 gains the `prefers-reduced-motion` contract and the desktop-only sway rule. §2 gains the `returned` row, which it has never carried. The **Mourning Window** is added to `CONTEXT.md` — it is used across both efforts and defined in no glossary.
