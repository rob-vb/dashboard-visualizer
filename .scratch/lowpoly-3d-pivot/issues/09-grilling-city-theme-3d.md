# Grilling: the City Theme in 3D

Type: grilling
Status: resolved
Blocked by: 08

## Question

What is the City **World** in low-poly 3D, and which kit builds it?

The closed effort decided City as *"your block of town"* on the CC0 Town Pack, with story-stacking as the growth mechanic and FOR SALE / boarded windows as risk ([ticket 08](../../isometric-dashboard/issues/08-grilling-city-theme.md), never vetoed). It also recorded a real weakness: **the pack lacks roads and terrain**, so filler tiles were DIY.

Re-decide on the 3D source picked in ticket 01. Settle:

1. **Kit choice.** If Polyfork wins, New York City (26 of 56 free) and Japanese Suburban Street (29 of 46 free) both exist, and they are different products — one is skyline, one is street. Which reads better as *a business you own*?
2. **Does story-stacking survive?** In 2D, stacking sprite storeys was the cheap growth trick. In 3D a taller building may need to be a different mesh or a parametric rebuild (ticket 05). Confirm the tier mechanic works here, not just in the forest.
3. **Roads and ground.** 3D kits often ship terrain and road pieces the pixel pack lacked. Does the gap close?
4. **The Signal vocabulary.** Apply ticket 06's answers. Rain over a city and a stump-equivalent for a churned building both need a form — the closed effort chose an abandoned building decaying to a rubble lot.

Consult `mattpocock-skills:grilling` and `mattpocock-skills:domain-modeling`. Fill in [`docs/theme-definition-template.md`](../../../docs/theme-definition-template.md) as rewritten by ticket 11.

## Update — candidates from ticket 01 (2026-08-19)

The kit question above is framed around Polyfork. Add the CC0 candidates, which [research 01](../research/01-lowpoly-sources.md) ranks first:

- **Quaternius Downtown City MegaKit** — CC0, 315 models, modular. Ranked first for this Theme.
- **Quaternius Ultimate Buildings Pack** — CC0, 76 models, modular, with *different atlas textures to change the palette*. That is a per-World palette knob for free, relevant to the customization fog.
- **Kenney City Kit (Commercial)** 50 + **(Suburban)** 40 + **(Roads)** + **(Industrial)** — CC0. Note that **the roads-and-terrain gap is closed**: the 2D pack lacked them and forced DIY filler tiles; Kenney ships roads as a pack of its own.
- **Polyfork New York City / Little Tokyo** — every City building is Pro. NYC has 13 buildings, exactly one free (a newsstand); Little Tokyo has 6, none free.

The trade is sharp here. Polyfork's `floors` knob is *"the number of 3.00 m storeys, REBUILT not stretched: each value adds or removes a whole window row plus its sills, lintels and spandrel brick"* — Brick Tenement 4–8 floors, Office Tower 6–12. That is the best growth mechanic found anywhere in the research, and it is exactly the story-stacking idea the 2D effort faked by hand. It costs Pro. The CC0 packs give more models, free, but a taller building is a different building.

## Answer

Resolved 2026-08-24, live with the user across five grilling rounds.

**The headline: the City is not bought. We author its geometry.** Every candidate
kit in the question above is rejected, including the CC0 ones the update
recommends. This is the first Theme on the map that does not come out of a
vendor's zip, and it redraws the map's **Out of scope** line on making our own
3D models — the user redrew it deliberately, on the evidence below, not because
the sources failed.

### Two measured facts that killed the candidates

Both kits were downloaded and parsed here, the same method ticket 05 used on the
Nature Kit — trust the geometry, never the vendor page.

**1. Quaternius Downtown City MegaKit is the wrong art style.** [Research
01](../research/01-lowpoly-sources.md) ranked it *first* for this Theme on model
count and never saw the pack. Its own preview render
(`quaternius.com/assets/images/fullres/downtowncitymegakit.jpg`) is a photoreal
PBR downtown: brick normal maps, glass reflections, neon signage, fire escapes.
It is not a sibling of anything in this product. **Correct research 01 on this
point** — the ranking was made blind.

**2. Kenney City Kit (Commercial) does ship a real storey ladder — and it is too
heavy.** Measured from the shipped GLBs (41 models, `kenney_city-kit-commercial_2.1.zip`):

| tier candidate | models | height (m) |
|---|---|---|
| shop | `building-c`, `building-e` | 0.893 |
| townhouse | `building-a`, `-b`, `-d`, `-h` | 1.293 |
| mid-rise | `building-f`, `-g`, `-j`, `-i`, `-k` | 1.470–1.693 |
| tower | `building-skyscraper-a`…`-e`, `building-m` | 2.880–5.470 |

Heights step by **exactly 0.400 m**, which is also the height of
`detail-awning` — that is one storey, delivered. Span is **6.1×**, against the
Forest ladder's 2.27×. City Kit (Roads) ships 95 pieces on a clean 1.00 × 1.00
grid, so **the roads-and-terrain gap from the 2D pack is closed** — the update's
claim is confirmed from the files.

The blocker is cost per Entity:

| | avg triangles / Entity | at 1,583 Entities |
|---|---|---|
| Kenney Nature Kit (Forest, shipped) | 150 | 237k |
| Kenney City Kit (Commercial) | 1,986 | **3,145k** |

**13.3×** the Forest, and [ticket 15](15-task-measure-device-fps.md) has still
not put a number on a real device. Every city building is also **one mesh, one
primitive, one atlas material** (`colormap`, `metallicFactor` already 0 — no
Kenney quirk here), so ticket 06's canopy/trunk split has no equivalent: a
`setColorAt` risk tint would paint walls, windows and roof together.

### Why authoring wins

- **A building is a box. A tree is not.** The reason the map bought assets does
  not hold for this Theme.
- **It brings back the growth mechanic ticket 07 gave up.** Dropping Polyfork
  cost the `floors` knob — "rebuilt, not stretched" — which research 01 called
  the best growth mechanic it found anywhere. Authored geometry restores it for
  free, and it *is* the 2D City's story-stacking idea, which the kit can only
  imitate by swapping to a different building.
- **It deletes the tint problem.** Shell and windows are separate meshes by
  construction, so "the windows go dark" costs nothing and needs no
  UV-splitting build step.
- **~60–200 triangles per Entity** instead of 1,986.

What we lose: Kenney's detail (awnings, fire escapes, window frames, 41 models
of variety), the time to build it, and the certainty that the look works. That
last one is why Q14 buys a gate.

### The architecture: a storey is an instance, not a mesh

The single load-bearing decision. Rejected: baking one geometry per storey count
(~36 geometries, ~72 draw calls). Chosen: **author one storey, one roof, one
ground floor, one road tile — a building is a stack of storey instances.**

- `subscriber_grew` becomes **literal**: a storey appears. That is the metaphor,
  not a stand-in for it.
- The whole City holds at **~6 draw calls**, against the Forest's 41.
- Authoring is three small meshes, not 36 variants.

Two costs, named: a colour write now loops over an Entity's storeys (~8,000
instance writes at 1,583 Entities, ~2 ms against a 16.7 ms budget — research
02 measured 0.400 ms for 1,583), and stacked identical storeys risk looking
repetitive, which the roof and ground-floor variety below is there to break.

**Geometry is generated in code**, not in Blender. The Forest pipeline ends at
`geometry.json` so the page needs no loader; code-generated geometry lands in
that same place with one less tool, makes the storey parametric by construction,
and makes "the storey is 20 cm shorter" a one-line edit during the gate.

### The Theme definition

**1. Identity.** *"Your block of town"* — a cool **dusk** downtown block on a
raised ground slab. Authored geometry, no third-party assets, no licence.

Dusk is not decoration: it is the only light in which **a lit window is
information**, and lit-versus-dark windows are this Theme's close-up risk
language. Night loses the silhouettes that carry Size Tier; daylight throws the
window channel away. The share link keeps its hand-tuned **night** diorama
(ticket 13), so the two stay visibly different.

The City gets **its own look, on purpose** — `CONTEXT.md` makes each Theme its
own visual world, and research 01 confirmed coherence is required *within* a
Theme and irrelevant *across* Themes. Only the **rendering** language is shared
with the Forest — flat-shaded, untextured, one material per mesh — and that is
an instancing constraint, not a taste choice. A warm daylight woodland and a
cool dusk block should not be mistaken for each other.

**2. Entity mapping.** One Subscriber = one building on one fixed cell.

| State | City rendering |
|---|---|
| Size Tier 1–4 | **1 / 2 / 4 / 8 storeys** |
| `active` | neutral facade, windows warm-lit |
| `at_risk` warning | facade `#d1913c`, half the window strips dark |
| `at_risk` critical | facade `#c2612f`, all windows dark |
| `churned`, recent | windows out at once; facade drains to grey across the window |
| `churned`, after 90 days | empty lot, construction fence and dumpster |

- **Size Tier is countable.** Doubling per tier gives an 8× silhouette span —
  wider than the kit's measured 6.1× — and lets a viewer read the tier by
  counting floors. **`hash(id)` must never offset the storey count**, or that
  reading breaks.
- **Footprint never grows.** Height only, one fixed cell. Placement is
  prefix-stable and center-out, so a widening building would push into its
  neighbour's cell. A tree grows up, not sideways; so does a building.
- **The facade belongs to risk, not to variety.** Ticket 06 Q5/Q6 fixed the
  rule that colour must paint the silhouette or it dies at full zoom-out, and at
  dusk the silhouette is the facade. Variety therefore moves **up to the roof**:
  roof type, roof colour, ground floor (shop or plain), all keyed on
  `hash(subscriberId)`. Facades stay one near-neutral family so the risk
  multiply lands identically on every building — exactly as the always-green
  canopy did in the Forest. Window strips are the second channel.
- **Mourning Window: 90 days, the same as the Forest.** The window is how long a
  loss stays visible, which is a property of the business, not of the skin. If
  Themes differed, one business would look a different age in each.
- **At day 90 every storey instance retires together** with the 600 ms tween,
  and the lot props take the cell. It must **not** drop a storey at a time —
  that would collide with `subscriber_shrank`, which has to keep meaning a tier
  change.

**3. Moment Signal effects.** Inherits ticket 06's three FX pools unchanged —
Cloud, Drop, Spark. `payment_received` is the warm-white cloud and plain drops;
`payment_failed` is the dark cloud with the brightness flicker; `appeared` is
three gold sparks over a lot becoming a building; `returned` is five cool-white
sparks. `grew` / `shrank` are storey instances added or removed on tier
crossings only, with the ~600 ms tween.

**The 2D City's flashing OPEN sign and roof coins are cut.** They need a fourth
pool and per-building placement, and one FX system across three Themes is what
ADR-0001 exists to buy. **Honest risk to carry into the gate:** rain at dusk
over a grey city may read heavier than it does over a forest. The warm-white
cloud (`#fbf6e8`) was chosen precisely to stop rain reading as gloom, but this
is a knob for the prototype, not a thing to settle on paper.

**4. Ambient loop.** A slow window-light twinkle on **lit windows only** — one
instance per storey, so it is nearly free. Desktop-only and off under
`prefers-reduced-motion`, the same rule the Forest sway follows and for the same
reason: a permanently animating World defeats `frameloop="demand"`.

**5. Terrain and placement.** A **flat** street grid on a raised ground slab
with a visible edge — a diorama. The Forest won its gate on rolling ground
(`relief: 0.9`), and that does not port: buildings need flat lots. Roads do that
work instead, because a straight line running away from the camera reads depth
while the camera stands still. Roads are drawn on every Nth line of the
**existing** cell grid — the Theme styles the ground and never moves an Entity.
Roads run to the slab edge and are cut by it, which reads as deliberate rather
than unfinished, and matches the diorama language ticket 13 already uses.

**Kenney's road tiles are not used either.** They are a textured atlas, and a
textured road under an untextured building reads as two kits glued together.
A flat quad with a painted line is about twenty lines of geometry.

**Street lights are ground furniture, not Entities** — see §6.

**6. Degenerate worlds.**
- **Single-plan** — one uniform height everywhere. Left as is: the roof and
  ground-floor variety carries it, and a street of equal-height buildings reads
  as a planned terrace, which is a real thing a city does.
- **Tiny** (5 Entities) — **the slab shrinks to fit**, so five buildings read as
  a small block instead of a mostly-empty city.
- **Crowded** — ~11,900 storey instances at 3,167 Entities (mean 3.75 storeys),
  comfortably inside instancing. Draw calls are flat in the Entity count.
- **Churn wave** — the one that needed real work, because a dusk city of dark
  buildings and empty lots is grimmer than a forest of stumps. Two guards:
  **the street lights never go out**, so the city never reads as abandoned; and
  the construction fence does the rest — a fenced lot with a dumpster says
  **redevelopment**, not ruin. That was the argument for choosing it and it pays
  off here.

**7. Cosmetic knobs.** Deliberately not settled — the map's customization fog
waits on ticket 10, since a knob only means something once all three Themes
exist. Dusk is fixed here as the **default**, not as the only option. One fact
for that fog: the City has no texture atlas at all, so a palette knob is a pure
`setColorAt` multiply and costs nothing.

**8. Out of Theme scope.** Unchanged — page chrome is app-level. The Theme ends
at the slab edge.

### What this hands on

- **A gate before the spec.** The authored look is the one thing that cannot be
  judged on paper, which is exactly what the Forest gate proved. New
  [ticket 17](17-prototype-3d-city-gate.md), and it is **light**: reuse the
  ticket 08 harness — same mock Signals, same camera, same page — and swap only
  the Theme. [Ticket 11](11-task-update-spec-and-adr.md) now blocks on it.
- **[Ticket 11](11-task-update-spec-and-adr.md) owes a second ADR**, beside the
  camera one: *the City's geometry is authored, not bought*. It is hard to
  reverse, it contradicts research 01 and the map's own scope line, and it came
  out of a real trade-off — all three tests pass.
- **[Ticket 10](10-grilling-rts-theme-3d.md) must be re-read before it runs.**
  Authoring is now a live option for the RTS Theme too, and that collides with
  the reason Quaternius Ultimate Fantasy RTS was picked: its **rigged units**.
  Authored geometry does not rig cheaply. See also
  [ticket 16](16-grilling-entity-animation.md).
- **Two Themes now source differently** — Forest buys CC0, City authors. That is
  allowed: research 01 established that sourcing per Theme costs nothing,
  because coherence is only required inside a Theme.
- **No `CONTEXT.md` change.** No new domain term appeared. *Storey* is
  implementation, not domain language, and **World**, **Entity**, **Size Tier**
  and **Mourning Window** all keep their meanings here.
