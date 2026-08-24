# Grilling: the RTS Theme in 3D

Type: grilling
Status: resolved
Blocked by: 08, 16

## Question

What is the RTS **World** in low-poly 3D — and does 3D finally give it units?

This Theme is the strongest argument for the whole pivot. The 2D research concluded flatly: *"no off-the-shelf Warcraft-like units exist"* in isometric pixel art ([research 02](../../isometric-dashboard/research/02-asset-packs.md)). That forced the closed effort into **buildings-only medieval** on CC-BY assets, with units pushed post-MVP and a credits page required ([ticket 09](../../isometric-dashboard/issues/09-grilling-rts-theme.md), never vetoed).

Low-poly 3D has characters. Settle:

1. **Do units come back into the MVP?** If yes, what does a unit *mean*? An **Entity** is one subscriber (ADR-0003). A unit that walks around is not obviously the same idea as a building that grows. Do not add units because they are available — add them only if they say something a building cannot.
2. **Setting.** The closed effort chose medieval ("your kingdom": tent → castle tiers, fire = critical risk, burnt ruin → rubble). If Polyfork wins ticket 01, Medieval Village is 18 of 50 free while Space Base is 27 of 61 — so a sci-fi pivot is cheaper on the free tier. Does the medieval setting still win?
3. **Rigging and animation.** Some low-poly assets ship pivots and inverse kinematics. Whether an Entity animates is fog on the map — this ticket may graduate it.
4. **Attribution.** The 2D plan required a credits page for CC-BY. Does the 3D source remove that burden (Polyfork: no attribution) or keep it (Kenney and Quaternius CC0: none either)?

Consult `mattpocock-skills:grilling` and `mattpocock-skills:domain-modeling`.

## Update — the gap is closed, and not by Polyfork (2026-08-19)

[Research 01](../research/01-lowpoly-sources.md) answers question 1 in the affirmative and names the source.

**Polyfork does not field units.** Catalogue search returns 0 results for soldier, warrior, orc, archer, spearman, troop, army, banner, catapult and barracks; "knight" returns a free *sword* prop. All 41 characters are Pro, and none is a combat unit. Its Medieval Village Kit is 18 free of 50, with every building and every villager behind Pro. So a Polyfork RTS Theme would be *a medieval village that grows walls and towers*, not an army — the same buildings-only compromise the 2D effort made, at a price.

**Quaternius Ultimate Fantasy RTS closes it.** CC0, 128 models, FBX/OBJ/glTF/Blend, August 2022. The pack description, verbatim: *"a collection of buildings in different evolution stages, along with nature assets."* **"Evolution stages" is a Size Tier ladder, shipped and free.** Alongside it in the same catalogue: Medieval Village MegaKit (304), Ultimate Modular Ruins Pack (90 — a decay state for churned Entities, in a matching style), Ultimate Modular Men / Women (soldier, farmer, adventurer outfits), and rigged, animated character packs.

Two consequences for this ticket:

- **Question 4 (attribution) is answered: none.** CC0 needs no credits page. The 2D plan's CC-BY credits requirement disappears.
- **Question 2 (setting) tilts back to medieval.** The free-tier arithmetic that made sci-fi cheaper was a Polyfork constraint; under CC0 it does not apply.

**Do first, before deciding:** download Ultimate Fantasy RTS and count the evolution stages per building. The stage count is not published, and this Theme's whole Size Tier story rests on it. Four stages maps to four **Size Tiers** exactly; three or five needs a mapping rule.

Question 1 still stands on its merits: units being *available* is not a reason to add them. An **Entity** is one subscriber (ADR-0003), and a unit that walks around is not obviously the same idea as a building that grows.

## Update — authoring is now on the table (2026-08-24, from ticket 09)

[Ticket 09](09-grilling-city-theme-3d.md) decided the City is **not** bought from
a kit: its geometry is generated in code, one storey / roof / ground floor, with
a building built as a stack of storey instances. That redrew the map's
"Making our own 3D models" scope line, so this ticket may no longer assume the
answer is a zip.

Read that before running this one. Three points bear directly on the RTS Theme:

1. **It collides with why Quaternius Ultimate Fantasy RTS was chosen.** That
   pack won on its **rigged units** — the gap neither pixel art nor Polyfork
   could close. Authored geometry does not rig cheaply. See
   [ticket 16](16-grilling-entity-animation.md), which blocks this ticket.
2. **The measured cost argument.** Kenney's city buildings run 1,986 triangles
   on average against the Forest's 150 — 13.3× — and no device frame rate has
   been taken yet ([ticket 15](15-task-measure-device-fps.md)). Measure the
   Quaternius pack before trusting it, the way ticket 09 measured Kenney and
   caught it.
3. **Per-Theme sourcing costs nothing.** Forest buys CC0, City authors. The RTS
   Theme is free to pick either — research 01 established coherence is required
   inside a Theme and is irrelevant across Themes. Do not treat one Theme's
   choice as a precedent for this one.

One correction to carry: research 01 ranked **Quaternius Downtown City MegaKit**
first for City without seeing it. Its preview is photoreal PBR, entirely the
wrong art style. The same ranking may not be trustworthy for Ultimate Fantasy
RTS either — look at the pack.

## Update — ticket 16 is resolved; this ticket is unblocked (2026-08-24)

[Ticket 16](16-grilling-entity-animation.md) settled motion for the whole map, and
**point 1 above is void**. Its premise — "that pack won on its rigged units" — is
not what [research 01](../research/01-lowpoly-sources.md) says. Ultimate Fantasy RTS
is **128 static meshes**, "no parameters, same limitation as Kenney". The rigged
figures are in *different* Quaternius packs, in styles the same research warns do
not match. So authored geometry costs this Theme nothing in rigging, because
nothing here was ever going to rig.

What this ticket inherits, and must not re-open:

- **The building is the Entity.** The pack's "buildings in different evolution
  stages" are the Size Tier ladder — the reason it was ranked first.
- **A soldier or villager is Scenery**, a term now in `CONTEXT.md`: it represents
  no Subscriber and reads no Signal.
- **No skeleton, anywhere.** Motion lives inside the instance write.
- **Budget: Scenery costs at most ~10 draw calls**, a fixed cast that never scales
  with the Subscriber count. This ticket chooses *what* the cast is.
- **Ambient motion carries no Signal** and is desktop-only. **Transition motion** is
  a tweened geometry swap — a Size Tier change, and the day-90 residue swap.
- Point 2 above is partly spent: [ticket 15](15-task-measure-device-fps.md) has since
  measured a real device (60 fps on an iPhone 16 at 3,167 Entities). The instruction
  to measure this pack's triangles per Entity before trusting it still stands.

## Measurement — the pack, downloaded and parsed (2026-08-24)

All **128** glTF files pulled from the Quaternius Google Drive folder
(`17T5i1YOWsJRZD10Ko0rm5pKjXjke7UTK`, the glTF export) and parsed here, the same
method [ticket 09](09-grilling-city-theme-3d.md) used on Kenney. Trust the
geometry, never the pack page.

**1. Zero units. Zero characters. Zero people.** The full 128-file inventory is
buildings, walls, resources and terrain props: `TownCenter`, `Barracks`,
`Archery`, `Farm`, `Market`, `Port`, `Storage`, `Temple`, `WatchTower`,
`Windmill`, `Wonder`, `Wall*`, `Mine`, `Resource_*`, `Mountain*`, `Rock*`,
`Crate`, `Barrel`, `Logs`, `Dock`. Ticket 16's correction is now **measured**,
not inferred.

**2. The "evolution stages" ladder is real, and it is the wrong axis.** The
naming scheme is `<Type>_<FirstAge|SecondAge>_Level<1|2|3>` — **2 ages × 3
levels = 6 stages**, not 4. Worse, *within* an age the levels do not change the
silhouette at all. Measured heights per family (F1 F2 F3 / S1 S2 S3):

| family | heights (m) | span |
|---|---|---|
| `Houses_1` | 0.765 · 0.765 · 0.765 / 0.772 · 0.952 · 1.226 | **1.6×** |
| `Houses_2` | 0.768 · 0.768 · 0.768 / 0.946 · 0.946 · 0.954 | **1.24×** |
| `Houses_3` | 0.574 · 0.574 · 0.574 / 0.591 · 0.591 · 1.063 | 1.85× |
| `Market` | 0.552 · 0.553 · 0.553 / 0.592 · 0.657 · 0.657 | 1.19× |
| `Barracks` | 0.719 · 0.892 · 1.470 / 0.893 · 1.352 · 1.846 | 2.57× |
| `TownCenter` | 0.303 · 1.088 · 1.254 / 1.277 · 1.277 · 1.277 | 4.21× |
| `Temple` | 1.813 · 3.079 · 3.079 / 2.797 · 3.930 · 4.329 | 2.39× |
| `Farm` | 0.056 · 0.056 · 0.056 / 1.071 · 1.311 · 1.837 | 32.8× (L1–3 are a flat dirt patch) |

A house Level 1 → Level 3 is **the same height** — the level buys detail, not
size. Footprint is identical too (`Houses_FirstAge_1_*` all 0.869 m wide). The
whole 18-model Houses family spans **2.14×**. Against the Forest's 2.27× mesh
span (3.07× with scale) and the authored City's **8×** by storey count. The
families that *do* span — TownCenter, Temple, Farm — are one-per-town functional
buildings in an AoE-style game, not a repeatable Entity.

**3. Triangle cost is worse than the kit ticket 09 rejected.**

| | avg triangles / model |
|---|---|
| Kenney Nature Kit (Forest, shipped) | 150 |
| Kenney City Kit (Commercial) — **rejected by ticket 09** | 1,986 |
| Quaternius Ultimate Fantasy RTS, Houses only | **1,960** |
| Quaternius Ultimate Fantasy RTS, all 128 | **3,915** |

**4. The one real win, and the City kit did not have it.** Every model is
**2–9 primitives with a separate material each, and zero textures and zero
images kit-wide** (21 material names: `Main`, `Walls`, `Stone`, `Stone_Light`,
`Wood`, `Wood_Light`, `Metal`, `Fabric`, `Gold`, `Wheat`, `Snow`, `Water`…).
So ticket 06's canopy/trunk split **does** have an equivalent here: a
`setColorAt` risk tint can paint the walls and leave the roof. That is exactly
what killed Kenney City Kit's single-primitive atlas buildings.

**5. Delivery.** Buffers are embedded `data:` URIs — each file is
self-contained, no `.bin` sidecar. CC0, so no licence work.

## Answer

Resolved 2026-08-24, live with the user across three grilling rounds. The
measurement above was taken **first**, as the ticket demanded, and it decided
most of what follows.

**The headline: the RTS Theme survives, but not for the reason it was written.
Units are dead, and the land is the differentiator. We author the Entity and buy
the Scenery.** This is the second Theme on the map that does not come out of a
vendor's zip, which turns [ticket 09](09-grilling-city-theme-3d.md)'s exception
into the map's default.

### What the measurement killed

Ticket 10's founding hope, in its own words, was *"does 3D finally give it
units?"*. Every prior document treated Quaternius Ultimate Fantasy RTS as the
source that closes the gap neither pixel art nor Polyfork could.

**It does not, and now that is measured rather than argued.** The full 128-file
inventory holds no character of any kind. [Ticket
16](16-grilling-entity-animation.md) reached this conclusion from research 01's
prose; the files confirm it. The pack is an Age-of-Empires-shaped town builder:
`TownCenter`, `Barracks`, `Archery`, `Farm`, `Market`, `Port`, `Storage`,
`Temple`, `WatchTower`, `Windmill`, `Wonder`, walls, resources, terrain.

Two further findings, and both cut against buying it:

1. **The celebrated "evolution stages" ladder is not a size ladder.** It is
   `Age × Level`, and *within* an age the levels do not change the silhouette at
   all — `Houses_FirstAge_1` is 0.765 m at Level 1, 2 and 3, on an identical
   0.869 m footprint. The level buys detail. The whole 18-model Houses family
   spans **2.14×**, and its best single family spans **1.6×**. [Ticket
   06](06-grilling-signal-vocabulary-3d.md) requires Size Tier to read at full
   zoom-out; the authored City delivers **8×** by counting storeys. The families
   that *do* span — `TownCenter` 4.21×, `Temple` 2.39×, `Farm` 32.8× — are
   one-per-town functional buildings in a strategy game, not a repeatable Entity.
2. **It costs more per Entity than the kit ticket 09 already rejected.** Houses
   average **1,960** triangles against Kenney City Kit's 1,986 — the number that
   got that kit thrown out at 13.3× the Forest's 150. The pack as a whole
   averages **3,915**, or 26×.

So the pack fails on exactly the two grounds ticket 09 established, and it fails
the one promise that made it first choice. Research 01's RTS ranking joins its
City ranking as **made blind and wrong** — the same correction, twice, from the
same table.

### Q1 — why the Theme still exists: the land

With units gone, an RTS World is "buildings that grow on a grid", which is what
the City is. Mood alone — banners, fire, a kingdom — is a paint job, not a
mechanic, and it would not have justified a third Theme.

**The differentiator is the ground.** The RTS is the only Theme where a
Subscriber sits in a landscape it did not build: mountains, woods, a gold vein,
a wall at the border. The Forest is ground with nothing built on it. The City is
a flat slab that is entirely built. The RTS is the one that is *held*.

Rejected: **buying units from another Quaternius pack** (Modular Men/Women, the
animated character packs). Ticket 16 already fixed that a soldier represents no
Subscriber and reads no Signal, so units would be a fixed decorative cast bought
at real cost to say nothing. Also rejected: **cutting the Theme** — a Theme count
change is a spec change past this map's destination, and it would be decided on
one ticket's disappointment.

### Q2 — sourcing: author the Entity, buy the Scenery

The mixed answer, and it holds independently of Q1.

- **Authored**: the four Entity meshes and the rubble residue. A keep is a box
  with a roof and a tower, so ticket 09's argument transfers intact. The pipeline
  is proved: generate `BufferGeometry` in code, end at `geometry.json`, no
  loader, no Blender, no new tool.
- **Bought (Quaternius, CC0)**: the terrain and prop cast — mountains, rocks,
  tree groups, gold veins, a windmill. These are cheap (162–2,008 triangles),
  they are a **fixed cast** that never scales with the Subscriber count, and they
  are the half of the pack that is actually good.

**The coherence risk that normally sinks a mixed source does not apply here, and
that is a measured fact, not a hope.** Every model in the pack is
**2–9 primitives with one flat material each, and the pack ships zero textures
and zero images**. Its 21 materials are single `baseColorFactor` values with
`metallicFactor: 0` already set (no Kenney quirk to override) and a uniform
roughness of 0.5:

`Stone #86877f` · `Stone_Light #b2b3a8` · `Walls #afafa5` · `Wood #876a44` ·
`Wood_Light #a38658` · `Metal #4f4332` · `Metal_Light #787878` ·
`Fabric #b39456` · `Gold #a58142` · `Green #577522` · `Water #4d7e87` ·
`Dirt #574e33` · `Wheat #a5944a` · `Snow #afafa5` · `Red #8f1810`

**We author against the pack's own palette.** Authored keeps and bought rocks
are the same material family by construction. This is also the pack's one real
advantage over Kenney City Kit: multi-primitive, multi-material models mean
ticket 06's canopy/trunk split *has* an equivalent — a `setColorAt` risk tint
paints the walls and leaves the roof, which single-primitive atlas buildings
made impossible.

**Consequence for the map:** two of three Themes now author. Authoring stops
being ticket 09's exception and becomes the default for anything box-shaped;
the Forest stays bought because a tree is not a box. Ticket 11's authoring ADR
must be written that way round.

### Q3 — the setting stays medieval, and fire is dropped

The free-tier arithmetic that made sci-fi look cheaper was a Polyfork
constraint, and Polyfork is gone. Under CC0 and under authoring, setting costs
nothing either way, so it is decided on strength of language: a ruin reads as a
loss and a keep reads as strength, with nothing to explain.

**But fire cannot be the critical-risk signal, and that is a change from the 2D
plan.** Ticket 06 fixed the vocabulary as two per-Entity channels plus three
fixed-size FX pools; a flame is neither, and adding one would be the fourth pool
the whole design avoided. Ticket 09's churn-wave reasoning applies with more
force here — a hundred burning keeps reads as apocalypse, not as data. Critical
risk moves to the same channel the City uses.

### Q4 — the Entity: a shape ladder, not a stack

**Size Tier 1–4 is tent → cottage → keep → castle.** Four authored meshes, one
per tier, swapped on a tier crossing.

This deliberately does **not** copy the City. The City's viewer *counts floors*;
the RTS viewer *reads a shape*. It also puts the RTS on the Forest's mechanism
rather than the City's — [ticket 05](05-grilling-size-tier-geometry.md) selects a
geometry, it does not stack one — so the map now says: **two Themes swap, and the
City stacks because a building genuinely is a stack.** That is a better story
than three Themes doing the same thing.

- **Footprint never grows.** Placement is prefix-stable and center-out, so a
  widening Entity pushes into its neighbour's cell (ticket 09's rule, unchanged).
  This is why the rejected alternative — a hall gaining corner towers — loses:
  it is RTS-native and countable, but it grows sideways.
- **Height span targets the City's 8×, not the pack's 2.14×.** The exact
  numbers are a gate knob, as ticket 08's were.
- **`hash(id)` must never offset the tier**, the same rule the City carries.
- `grew` / `shrank` is a tweened geometry swap on a tier crossing, ~600 ms,
  live and in replay, hard-cut on a scrub — [ticket
  16](16-grilling-entity-animation.md)'s transition motion, unchanged.

### Q5 — the ground, and the wall

**A grass plain, a fixed terrain cast, and a walled edge.**

The terrain is **anchored to the world's edges, not scattered per cell.** This
matters and it was nearly got wrong: scattering props on empty cells would make
the prop count fall as Subscribers arrive, which is Scenery varying with the
data — precisely what `CONTEXT.md` forbids and what ticket 16 called making
Scenery semantic. A fixed cast positioned against the World's bounding box has
no such reading, costs the same at 237 Entities as at 3,167, and it is what makes
a **tiny World** work: one lone keep still sits in a landscape.

**The wall is the world's edge treatment** — one instanced tile run fitted to the
grid, the RTS answer to the City's hard slab edge. It is explicitly *not* a
count of wall props that grows with the Subscriber count; that distinction is
the difference between a frame and a data channel.

Rejected: **paths between keeps.** Placement is prefix-stable, so a path network
would re-route every time a Subscriber appears — a data-dependent Scenery amount,
and a rebuild cost on every fold.

### Q6 — light: bright, slightly cool midday, hard shadows

The strategy-game look: you look down on a territory in full light. Hard shadows
read the silhouette, and Q4 makes the silhouette carry Size Tier, so this is not
a taste choice sitting on its own — the ladder depends on it.

The three Themes are now warm day / cool dusk / bright day. Forest and RTS are
both daylight, so the **ground** does the separating work. Given Q1 that is the
point, and the City stays the odd one out on purpose.

### Q7 — risk on the walls, variety on roof and banner

Ticket 06's rule — colour must paint the silhouette or it dies at full zoom-out —
forces this, exactly as it forced ticket 09's facade decision. Risk takes the
largest surface. Variety moves off it.

| State | RTS rendering |
|---|---|
| Size Tier 1–4 | tent → cottage → keep → castle |
| `active` | stone walls, banner up |
| `at_risk` warning | walls `#d1913c` |
| `at_risk` critical | walls `#c2612f` |
| `churned`, recent | the banner falls at once; walls drain to grey across the 90 days |
| `churned`, after 90 days | overgrown rubble mound — a low authored mound plus the bought `Rock_Group` (868 tri) |

- **Risk colours are taken from the City on purpose.** The same hue means the
  same thing in every Theme. A user who switches Theme should not have to
  relearn the language.
- **The banner is variety by colour and churn by presence.** It carries
  `hash(subscriberId)` colour like the City's roof, and it says churn by
  *falling* — a geometry swap, which ticket 16 permits, rather than a colour it
  is too small to deliver. This resolves the conflict left open in Q3, where I
  had loosely said the banner colour drains: it does not, the walls do.
- **Mourning Window is 90 days**, the same as Forest and City. Ticket 09's
  reason holds: the window is a property of the business, not of the skin.
- **Every storey-equivalent retires together at day 90** — the whole structure
  swaps to the rubble mound. It must not decay a tier at a time, or it collides
  with `subscriber_shrank`.

### Decided without a question, from rules already settled

The user delegated these ("deze tickets volg ik al jouw aanbevelingen gewoon").
Each follows from an existing decision rather than from taste; veto freely.

**Moment Signals — ticket 06's three FX pools, unchanged, no fourth pool.**
`payment_received` is the warm-white cloud and plain drops; `payment_failed` is
the dark cloud with the brightness flicker; `appeared` is three gold sparks over
an empty plot becoming a tent; `returned` is five cool-white sparks over the
rubble mound becoming a tent. The 2D plan's gold tribute pile and circling raven
are dropped — both are new pools in all but name.

**Scenery cast — a fixed ~9 instanced meshes**, all bought, all cheap:
`Mountain_Single` (194), `Mountain_Group_2` (717), `Rock` (162), `Rock_Group`
(868), `Resource_PineTree` (345), `Resource_Tree1` (552), `Resource_Gold_2`
(1,016), `Windmill_FirstAge` (2,092), plus the wall run and wall tower
(`Wall_FirstAge` 404, `WallTowers_FirstAge` 1,380). Deliberately **not** bought:
`Resource_Tree_Group` (4,776) and `Resource_PineTree_Group` (3,666) — group
meshes are the pack's expensive form and instancing makes them pointless. This
sits inside ticket 16's ~10-draw-call Scenery budget.

**Draw-call budget: ~27**, flat in the Entity count. Four tiers × ~3 material
parts = ~12 Entity meshes, plus ~2 for the residue, ~9 Scenery, 1 ground, 3 FX
pools. Against the Forest's 41 and the authored City's ~6.

**Ambient motion: banner sway, and the windmill sail turns.** Both are
Signal-free, both are one instance-matrix write, both desktop-only and off under
`prefers-reduced-motion` — ticket 16's ambient rule, and its recorded reason is
battery, never performance.

**Degenerate Worlds.** Single-plan → a uniform garrison of castles, which reads
as strength rather than as a bug. Tiny → one keep in a landscape, which the
fixed terrain cast makes work. Crowded → keeps fill the grid while terrain holds
the border. **Churn wave** → the guard is that **the wall never falls and the
terrain never changes**; with fire dropped, a bad quarter reads as an abandoned
territory, not a battlefield. This is the RTS equivalent of the City's street
lights that never go out.

**Cosmetic knobs: banner colour (4 palettes), season (green / autumn / snow),
time of day (midday default, dawn).** None adds geometry — every one is a
`setColorAt` multiply or a light change, and the pack even ships a `Snow`
material at `#afafa5` to match against.

**This dissolves the map's "Customization knobs per Theme in 3D" fog rather than
graduating it.** That patch was waiting on this ticket alone, on the grounds
that a knob only means something once all three Themes exist. They now do, and
the finding is that **no knob in any Theme adds geometry** — so there is no
architectural decision left, only a list to write down. Ticket 11 writes the
list; no new ticket is needed. Recorded here so a reader can object to the
reasoning rather than just to the outcome.

### Q8 — one gate for both authored Themes

[Ticket 17](17-prototype-3d-city-gate.md) is **widened** rather than duplicated:
it now gates the authored City *and* the authored RTS, on one harness. The user
chose this over a separate RTS gate to keep the map short — they are ready to
build, and a second gate ticket would have added a third open ticket and a
thirteenth blocker to ticket 11.

The cost is named honestly: the two Themes carry **different** risks, and the
widened ticket must ask both. The City's open risk is its dusk lighting. The
RTS's is whether four distinct shapes read as one ladder, and whether authored
medieval looks convincing rather than like a toy.

### What ticket 11 inherits

- **Spec §4 gains the RTS Theme section** as defined above, replacing the 2D
  buildings-only medieval plan. Dead from that plan: fire as critical risk, the
  gold tribute pile, the circling raven, units post-MVP, and the CC-BY credits
  page (already retired by [ticket 07](07-grilling-free-vs-pro.md)).
- **The authoring ADR from ticket 09 is written the other way round**: authoring
  is the default for a Theme whose Entity is box-shaped; buying is the exception,
  justified per Theme, and the Forest is that exception. No new ADR — this
  widens one that ticket 09 already owes.
- **The asset story stays one line, and gains a clause**: CC0 throughout, no
  licence email, no vendor, no expiry, no recurring cost — and now *two Themes
  author their Entities while buying their Scenery*.
- **Spec §7 milestones**: two Themes are built, not downloaded. The map's
  milestone fog item can now be closed by ticket 11's edit rather than by a
  separate re-plan.
