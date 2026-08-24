# Grilling: how a Size Tier becomes geometry

Type: grilling
Status: resolved
Blocked by: 01, 03

## Question

An **Entity** renders at one of four **Size Tiers** (`CONTEXT.md`, ADR-0003: MRR quantile buckets). In 3D, what actually changes between tiers?

Three shapes, and they are not equivalent:

1. **Uniform scale.** One mesh, four scale factors. Cheapest, and it looks cheap: a tier-4 tree is a tier-1 tree seen through a magnifier.
2. **Distinct meshes.** Four hand-picked assets per Theme — young pine, tall pine, broadleaf oak, veteran. Honest silhouettes, but the tiers must read as *the same subscriber grown*, not four different plants.
3. **Parametric rebuild.** Polyfork's `tallness` knob rebuilds a pine's whorl count at a given height: "6.4m is a sparse 3-whorl young pine, 9.0m the shipped 4-whorl tree, 9.6m a dense 5-whorl veteran". One asset, four real geometries. Available only if ticket 01 picks a parametric source.

Settle:

- Which shape wins, and whether the answer is the same for all three Themes.
- **When the geometry is produced.** Baked at build time into committed variants, or evaluated at runtime? This is the same fork as ticket 07 (free versus Pro) seen from the geometry side — the two tickets must not contradict each other.
- **Growth as a Moment Signal.** The Timeline emits `grew` and `shrank`. Does a tier change animate — a tree visibly growing a whorl — or does it cut? If it animates, options 2 and 3 need a transition that option 1 gets for free.
- **How many variants exist in total.** 4 tiers × entity kinds × 3 Themes. Ticket 03 needs this number for the bake budget.

Consult `mattpocock-skills:grilling` and `mattpocock-skills:domain-modeling`.

## Update — what tickets 01 and 03 changed (2026-08-19)

Both blockers are resolved. Four findings reshape this question:

1. **Options 2 and 3 are not alternatives — the Polyfork path needs both.** No single `tallness` knob spans a four-tier ladder: Young Pine runs 2.0–3.15 m, Tall Pine 6.4–9.6 m, and nothing spans the gap between. A four-tier ladder chains assets *and* knobs: Young Pine @2.0 → Young Pine @3.15 → Tall Pine @6.4 → Tall Pine @9.6. Two meshes, four genuinely distinct geometries, one species.
2. **Option 2 is available for free, already authored.** Kenney's Nature Kit ships `tree_pineSmallA–D`, `tree_pineDefaultA–B`, `tree_pineTallA` — the same artist's same pine at a ladder of sizes, CC0. That makes "distinct meshes" the cheapest option, not the crudest.
3. **Baked Polyfork variants carry no vertex NORMALs**; published GLBs do. three.js computes flat normals, which is the right look for flat-shaded low-poly — but a baked tier variant and a published default are **not** equivalent inputs. Do not mix them in one scene without checking the shading matches.
4. **Bakes cost nothing at runtime.** A new bake costs 1 against the budget; re-fetching any variant anyone has baked costs 0 forever. So "pre-baked" does not mean "slow" or "rationed at scale" — the whole three-Theme build is about 72 bakes.

The real fork this ticket now decides: **is a Size Tier *rebuilt* or *swapped*?** Swapping is free and shipped (Kenney, Quaternius). Rebuilding costs $99/year and a vendor dependency. Take it to the prototype — build one Forest ladder both ways and look at them — rather than settling it on paper.

## Answer

**A Size Tier is swapped, never rebuilt. One mechanism for all three Themes. Kenney Nature Kit (CC0) supplies the Forest ladder.** Settled with the user 2026-08-20 across six questions.

### The decision, and why

**Q1 — one mechanism, not one per Theme.** Growth is the product's core claim, so it must speak one language. A tree that fluidly grows a whorl beside a building that hard-cuts reads as two products. Research 01 makes this decisive rather than merely tidy: parametric rebuild exists only at Polyfork, Polyfork has **zero** RTS units and zero usable RTS buildings, and every City building is Pro. Rebuild cannot be universal, so universal means swap.

**Q2 — swap.** Four authored meshes of one species beat a knob here, because the data model has no continuum to express: ADR-0003 makes Size Tier four MRR *quantile buckets*. A viewer sees four states either way. Rebuild would cost $99/year, ticket 03's licence email, and a dependency on one small vendor, to render in-between geometry nothing ever asks for.

**Q3 — a tier change animates in live and replay, and hard-cuts on scrub.** A ~600 ms scale tween through the swap. Not a cross-fade: research 02 fixes the renderer as one `InstancedMesh` per geometry, and per-Entity opacity fights that, while a scale tween is one number per instance and costs nothing. Scrubbing deliberately does not animate — the World is already jumping through time, and tweening there only makes the scrub feel heavy.

**Q4 — Entities vary within a tier.** Two Subscribers on the same tier must not render identically, or the World is a bar chart. Variant is chosen deterministically and held for life.

**Q5 — the dead state scales, coarsely.** Two sizes, not four. Losing a large Subscriber must be visible; four dead variants times four stump variants is budget nobody looks at.

**Q6 — mesh swap does the silhouette work, a modest uniform scale adds emphasis.** The kit's whole pine span is only 2.27×, which under-sells a €99 Subscriber against a €9 one. A scale multiplier spanning 1.47× lifts the effective span to ~3.07×. Kept deliberately under 1.5× — beyond that the scale wins over the silhouette and the result is option 1 ("a tier-4 tree is a tier-1 tree through a magnifier"), which is the thing this ticket exists to avoid.

### The ladder

Measured first-hand from the shipped GLBs (decoded POSITION data transformed by the node matrix — not accessor min/max corners, which over-report rotated nodes). Kit scale: 1 unit = 1 ground tile.

| Tier | Models | Mesh height | Scale | Effective | Step |
|---|---|---|---|---|---|
| 1 | `tree_pineGroundA`, `tree_pineSmallD`, `tree_pineSmallA`, `tree_pineSmallB` | 0.91–1.01 | ×0.85 | 0.82 | — |
| 2 | `tree_pineRoundB`, `tree_pineRoundC`, `tree_pineRoundE`, `tree_pineRoundF` | 1.20–1.25 | ×0.97 | 1.20 | 1.47× |
| 3 | `tree_pineTallA`, `tree_pineDefaultA`, `tree_pineDefaultB` | 1.53–1.55 | ×1.10 | 1.69 | 1.41× |
| 4 | `tree_pineTallB`, `tree_pineTallD` | 1.93–2.08 | ×1.25 | 2.51 | 1.48× |

Churned: `stump_oldTall` (0.667) for tiers 3–4, `stump_old` (0.267) for tiers 1–2. Both are bare broken snags, one material, 120 tri each, a clean 2.5× apart.

Scale values are a starting point for ticket 08 to tune by eye. The constraint is the ratio: **keep the tier-1 to tier-4 scale span under 1.5×.**

**The correction that produced this table.** Research 01 recorded a `small → default → tall` ladder. **That ladder does not exist.** The family names do not track height — `pineSmallC` (1.123) is taller than `pineRoundD` (1.082) and `pineGroundB` (1.042), and `pineTallA` (1.530) is *shorter* than `pineDefaultA` (1.546), a 1.1% difference that no viewer can see. Selecting by name yields overlapping rungs. The table above selects by measured height, which is why it works.

**A happy accident worth keeping.** `pineTallB` is exactly `pineTallA` with the trunk extended by `dY = +0.405` (124 of 136 vertices match precisely, zero unmatched); `pineTallD` is `pineTallC` the same way. So a Subscriber that grows from tier 3 into tier 4 can be handed *literally the same crown on a longer trunk* — the strongest possible reading of "the same subscriber grown". Wire the variant index so tier 3's `pineTallA` prefers tier 4's `pineTallB`.

### Variant selection

Tiers hold unequal variant counts (4 / 4 / 3 / 2). `hash(id) % count` would reshuffle a Subscriber's character every time it changed tier. Instead:

```
u = hash(subscriberId) / 2^32          // once, in [0,1)
variant = tierVariants[floor(u * tierVariants.length)]
```

A Subscriber keeps its relative position — always the narrow pine, always the broad one — across all four tiers. Same determinism rule as placement (`buildPlacement`), same reason.

Two near-duplicate pairs to know about: `pineRoundE`/`pineRoundF` differ by 0.0001 units and share a silhouette, as do `pineDefaultA`/`pineDefaultB`. Effective distinct silhouettes are therefore 4 / 3 / 2 / 2, not 4 / 4 / 3 / 2. Ticket 08 may drop the duplicates without loss.

### Variant count, for ticket 03's budget

**13 living geometries + 2 dead = 15**, and the bake budget is **zero** — see the consequences below.

Each distinct geometry is one `InstancedMesh`, so 15 draw calls, inside research 02's 16–22 estimate and independent of Entity count.

### Two facts from the GLBs that ticket 08 needs

1. **All 22 pines share exactly two materials** — `leafsDark` (0.169, 0.651, 0.667) and `woodBarkDark` (0.800, 0.463, 0.369) — byte-identical in every file, with **zero textures and zero images** kit-wide. Pure flat-colour PBR. Stumps use `woodBark` alone. So the whole forest can share one material instance.
2. **`metallicFactor` is 1 on every material in the kit.** That is a Kenney export quirk, not an artistic choice. Left alone, under a standard PBR renderer the forest renders near-black and metallic. **Override it to 0 on load.** Two stray triangles carrying `_defaultMat` in `tree_pineRoundB` are an export artifact; delete or reassign them to avoid a third draw call.

Research 01's note that Kenney models "carry real normals, so no flat-shading surprise" holds — attributes are `POSITION`, `NORMAL`, `TEXCOORD_0`.

### Consequences for other tickets

- **[Ticket 03](03-research-polyfork-licence-delivery.md) — the bake budget is now zero.** No Polyfork means no bakes, and all five of that research's shipping conditions lapse: no licence email to `hello@polyfork.dev`, no vendoring-versus-CDN question, no `-preview.glb` hazard, no free-account bake key, no vendor-survivability exposure. The research stands as a record of a path not taken.
- **[Ticket 07](07-grilling-free-vs-pro.md) — effectively pre-decided.** It asks which Polyfork plan; Q1 and Q2 answer "none". Left open for the user to close explicitly.
- **[Ticket 08](08-prototype-3d-forest-gate.md)** — build the ladder above. Tune the scale multipliers by eye within the 1.5× ceiling. Override `metallicFactor`. Confirm the tween reads at ~600 ms and that scrubbing stays hard-cut.
- **[Tickets 09 and 10](09-grilling-city-theme-3d.md)** — Q1 binds them: City and RTS swap meshes too. Quaternius Downtown City MegaKit and Ultimate Fantasy RTS ("buildings in different evolution stages") must each yield a four-rung ladder **selected by measured height, not by family name**. That is the lesson this ticket paid for.
