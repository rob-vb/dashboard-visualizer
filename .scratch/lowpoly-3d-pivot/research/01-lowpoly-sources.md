# Low-poly 3D asset sources for the three Themes

Research date: 2026-08-18. Successor to [`isometric-dashboard/research/02-asset-packs.md`](../../isometric-dashboard/research/02-asset-packs.md), which surveyed the same three Themes in 2D pixel art.

Every claim below was checked against a primary source — the vendor's own site, licence page, API or shipped file — unless marked **[UNVERIFIED]**. Claims marked **[MEASURED]** were derived by hitting the live API or downloading the file during this research.

Context that constrains every judgement:

- An **Entity** must render at four **Size Tiers** and read as *the same subscriber grown*, not four different objects.
- Three **Themes** — Forest, City, RTS — must each look like one product, and ideally like one another's siblings.
- The files ship inside a deployed commercial SaaS build and are served to anonymous browsers (`/demo` and the share link).

The Polyfork section is first because it is the incumbent candidate the map names. Kenney and Quaternius follow.

> **Provenance note.** The Polyfork section was researched on 2026-08-18 by a subagent that was cut off by an API session limit before it reached the rivals. The Kenney and Quaternius sections and this summary were completed in the parent session on 2026-08-19. Both halves are first-hand; the second half is thinner on catalogue-wide tallies because it did not page an API — the vendors publish zips, not endpoints.

## Summary and recommendation

**No single source carries all three Themes well.** That is the finding, and it is not a disappointment: `CONTEXT.md` makes each **Theme** its own visual world, so coherence is required *within* a Theme and irrelevant *across* Themes. Sourcing per Theme is therefore free of cost.

| Theme | First choice | Runner-up | Why |
|---|---|---|---|
| **Forest** | **Kenney Nature Kit** (CC0, 329 models) | Polyfork Nature & Forest (free tier) | Kenney ships a small→default→tall pine ladder off the shelf at 16–230 triangles; Polyfork rebuilds real geometry from a knob but tops out at a narrow per-asset range. Both work. Kenney costs nothing and depends on nobody. |
| **City** | **Quaternius Downtown City MegaKit** (CC0, 315 models) | Polyfork New York City (**Pro only**) | Polyfork's `floors` knob (4–8 storeys, rebuilt not stretched) is the best growth mechanic found anywhere in this research — and every City building in it is behind Pro. Quaternius is free and static. |
| **RTS** | **Quaternius Ultimate Fantasy RTS** (CC0, 128 models) | — | **The only source that closes the gap.** It ships "buildings in different evolution stages" — a literal Size Tier ladder — plus characters. 2D pixel art had no units; Polyfork has no units either (0 results for soldier, warrior, orc, archer, barracks, catapult). |

**The strategic question this hands to tickets 05 and 07 is sharper than "which vendor".** It is:

> The CC0 route (Kenney + Quaternius) covers all three Themes at zero cost, zero licence risk, zero vendor dependency and zero bake budget — but every mesh is static. Polyfork's one unique asset is **parametric rebuild**: geometry that is genuinely regenerated from a knob. Is that worth $99/year, the licence email from ticket 03, and a dependency on one small vendor?

My reading: **the CC0 route is the safe default and the RTS Theme has already picked it** — nothing else fields units. Polyfork earns its place only if ticket 05 concludes that a Size Tier must be *rebuilt* rather than *swapped*, and the gate (ticket 08) confirms a viewer can see the difference. Take that question to the prototype rather than settling it on paper: build one Forest tier ladder both ways and look at them.

A pragmatic mixed plan, if the gate likes both: **Kenney/Quaternius as the shipping baseline for all three Themes; Polyfork bought later, per Theme, where the parametric knob visibly wins.** That order keeps the pivot free until it has proven itself.

---

## Polyfork

Primary sources: <https://polyfork.dev/prompt.txt> (the agent-facing API guide), <https://polyfork.dev/licensing>, and the live `https://polyfork.dev/api/*` endpoints.

Ticket 03 owns the licence-and-delivery question in depth. What follows is only what bears on *choosing* the source.

### Catalogue shape — the free/Pro split is a Theme split [MEASURED]

Paging the whole catalogue (`GET /api/assets?per_page=50`, 13 pages, 608 unique assets) and tallying by `class` and `free`:

| class | free | Pro |
|---|---|---|
| prop | 231 | 126 |
| building | 9 | 70 |
| vehicle | 0 | 57 |
| character | 0 | 41 |
| terrain | 0 | 7 |
| ultra | 67 | 0 |

That table is the single most decision-relevant fact about Polyfork. **The free tier is props: street furniture, ground cover and trees. Every Entity-shaped object that is not a tree — every building, every character, every terrain — is Pro.** Of 307 free assets, 282 are `remixable` and the largest is 618 triangles.

Per kit, free / Pro:

| kit | free | Pro | status |
|---|---|---|---|
| Nature & Forest | 36 | 22 | filling-up |
| Little Tokyo (Japanese suburban street) | 29 | 17 | published |
| Open Plan | 36 | 10 | filling-up |
| Space Base | 27 | 34 | filling-up |
| New York City | 26 | 30 | filling-up |
| Pirate Cove | 26 | 35 | published |
| Medieval Village | 18 | 32 | published |
| Coral Reef | 13 | 41 | published |
| Retro Cars | 16 | 13 | published |
| Sky Town (Salvage Commons) | 8 | 40 | published |
| Spaceship Wars | 3 | 15 | filling-up |
| Cozy Farm | 1 | 9 | filling-up |
| (kitless "ultra" + misc) | 68 | 2 | — |

New fact not in the ticket: published kits are also **sold individually at $28** (`price_usd` on `GET /api/kits`, e.g. Medieval Village, Pirate Cove, Coral Reef, Little Tokyo, Retro Cars, Sky Town). Kits still "filling-up" — including **Nature & Forest and New York City, the two this project needs most** — are `for_sale: false` and reachable only through Pro.

### Theme 1 — Forest: strong, and free [MEASURED]

`GET /api/assets?kit=nature-forest-kit-f29d6a` returns 58 parts. The free ones cover the Theme end to end:

- **Trees, free**: Tall Pine Tree (9.0 m, 350 tri), Broadleaf Oak (6.98 m, 457 tri), Maple Tree (7.48 m, 548 tri), Young Pine (3.0 m, 414 tri), **Dead Tree** (5.0 m, 536 tri), **Tree Stump** (0.48 m, 505 tri).
- **Ground cover, free**: Grass Tuft, Grass Terrain Blob, Dirt Terrain Blob, Wildflower, Round Bush, Cattail Reed, Lily Pad, Small/Medium Rock, Large Boulder, Rock Spire, Fallen Log, path stones.
- Pro-only in this kit: Birch Tree, Fern Plant, Toadstool, every building (Log Cabin, Ranger Station, Fire Lookout Tower), every character (Black Bear, Red Fox, Forest Deer, Hiker, Forest Ranger), and the 26,540-triangle `Nature & Forest Terrain`.

Two of those free assets matter beyond their count. **Dead Tree and Tree Stump give the Forest Theme a churned/decayed Entity state off the shelf** — precisely the gap the 2D research flagged as risk 2 ("Dying/decay tree states: not off-the-shelf"). 3D closes it.

### Theme 2 — City: the growth mechanic is real, and it is entirely Pro [MEASURED]

Two city kits exist: **New York City** (56 published parts) and **Little Tokyo** (46). Building counts: NYC has 13 buildings, of which **exactly one (Newsstand) is free**; Little Tokyo has 6 buildings, **none free**. The free half of both kits is street furniture — sidewalk tiles, lamps, hydrants, awnings, fire escapes, traffic cones.

The buildings themselves are the best answer to "buildings that read as growth" found anywhere in this research. Reading `https://polyfork.dev/cdn/{id}-params.json`:

- **Brick Tenement** — `floors`, range 4–8, `affects: geometry`: *"number of 3.00 m storeys, REBUILT not stretched: each value adds or removes a whole window row plus its sills, lintels and spandrel brick"*. Also `windowCols` 2–4, which re-solves pier widths so openings stay even.
- **Office Tower** — `floors`, range 6–12: *"the tower stands 18 m at 6 (a squat block barely taller than it is wide) and 36 m at 12 (a slender shaft)"*. Also `bays` 4–8, `mullionWeight`, `cornerPier`.
- **Narrow Walk-Up** — `floors` 3–5, same rebuild language, plus a `ground` choice (`shop` / shut shop / plain housing).

A building that literally gains storeys as MRR grows is a better Size Tier story than anything 2D could offer — the 2D research's best City answer was stacking Screaming Brain tiles by hand.

### Theme 3 — RTS: Polyfork does not close the units gap [MEASURED]

The 2D research concluded "no off-the-shelf Warcraft-like units exist" in pixel art. Polyfork does **not** fix this.

Searching the catalogue for military terms returns nothing:

| query | results |
|---|---|
| soldier, warrior, orc, archer, spearman, troop, army, banner, catapult, barracks | **0 each** |
| knight | 1 — a free *Sword* prop |
| castle | 1 — *Pirate Galleon* (Pro) |

All 41 `character` assets are Pro, and none is a combat unit. The closest thing to an RTS roster is the **Medieval Village Kit**: Male Villager, Female Villager, Merchant, Draft Horse, Village Chicken (all Pro), plus Watchtower, Wall Module / Corner / with-Door / with-Window, Stone Chapel, Timber Barn, Windmill, Blacksmith Forge, Village Tavern, Two-Story House, Thatched Cottage (all Pro). Only Market Stall and 17 props are free.

So Polyfork's RTS Theme would have to be **a medieval village that grows walls and towers, not an army that fields units**. That is a Theme redefinition, and it belongs to ticket 10.

One partial consolation: characters are *animation-ready* rather than *animated*. `prompt.txt` states they carry a **Mixamo-compatible 22-bone skeleton with no bundled animation clips**, and ship a `mixamo.mjs` retargeter for free Mixamo FBX clips. Some characters also expose `has_ik: "legs"` with a `walker()` helper that keeps feet planted using distance travelled rather than time. So animation is possible but is assembly work, not a delivered asset.

### The growth mechanic — verified first-hand, with one important correction

The `tallness` knob is exactly as advertised, and it is the strongest single reason to prefer Polyfork. From `tall-pine-tree-ab4108-params.json`:

> "Total height in metres, and it REBUILDS rather than scaling: branch whorls are added at a roughly constant 1.6–1.8 m tier pitch, so 6.4 m is a sparse 3-whorl young pine, 9.0 m the shipped 4-whorl tree and 9.6 m a dense 5-whorl veteran. Triangle count changes with the whorl count."

**Proved by baking, anonymously, without an account [MEASURED].** `GET https://polyfork.dev/cdn/tall-pine-tree-ab4108-remix.glb?p={"tallness":N}`:

| tallness | GLB size |
|---|---|
| 6.4 m | 20,176 bytes |
| 8.0 m | 25,924 bytes |
| 9.6 m | 31,700 bytes |

The file grows by ~57 % across the range. This is not a scale transform written into a node matrix — it is new geometry. Young Pine behaves the same way: 2.0 m → 18,480 bytes, 3.15 m → 39,220 bytes.

**The correction ticket 05 needs.** The `tallness` range on any *single* asset is narrow, not a full growth ladder:

| asset | knob | range | default |
|---|---|---|---|
| Young Pine | `tallness` | **2.0 – 3.15 m** | 3.0 |
| Tall Pine Tree | `tallness` | **6.4 – 9.6 m** | 9.0 |
| Broadleaf Oak | `tallness` | 0.82 – 1.06 (multiplier) | 1.0 |
| Dead Tree | `tallness` | 0.76 – 1.06 (multiplier) | 1.0 |
| Round Bush | `size` / `tallness` | 0.55–1.1 / 0.52–1.05 | — |
| Maple Tree | `canopyHeight` 1.75–2.78, `tiers` 2–4 | — | — |

There is a **gap between 3.15 m and 6.4 m that no single asset spans**. A four-tier ladder therefore needs *chaining across assets plus knobs*, not one knob:

- Tier 1 — Young Pine @ `tallness: 2.0` (single-tier seedling)
- Tier 2 — Young Pine @ `tallness: 3.15`
- Tier 3 — Tall Pine @ `tallness: 6.4` (sparse 3-whorl)
- Tier 4 — Tall Pine @ `tallness: 9.6` (dense 5-whorl veteran)

Two meshes, four genuinely distinct geometries, one species, one palette. That satisfies "the same subscriber grown" better than uniform scale and better than four unrelated species. Ticket 05 should treat "parametric rebuild" as *option 2 and option 3 combined*, not option 3 alone.

Other geometry knobs worth recording: `season: summer|snow` on the pines *builds a real snow shell* (added geometry, 30–50 mm proud of the needles) rather than repainting — a free seasonal customization knob for the Fog item about per-Theme customization. `colorway` presets (deep-pine / spring-fir / shadow-spruce / golden-larch on the pine; summer / spring / deep-forest / autumn on the oak) give a palette-safe recolour. `has_night: true` assets carry emissive zones in a `night` object.

### A correction to a standing assumption: the `.mjs` is free for free assets [MEASURED]

The ticket and map both record "Pro adds the `.mjs` program for runtime knobs". That is imprecise, and the imprecision is architecturally load-bearing.

```
GET https://polyfork.dev/cdn/tall-pine-tree-ab4108.mjs   (free asset, anonymous)  -> 200, 12,006 bytes
GET https://polyfork.dev/cdn/brick-tenement-5257e9.mjs    (Pro asset,  anonymous)  -> 404
```

The free asset's module is a real ES module: it exports `params`, `presets`, `rig`, `detach`, `night` and `createAsset(opts)`, and `createAsset` clamps `opts.tallness` against `params.tallness.min/max` before rebuilding. So **runtime knob evaluation is available on the free tier for free assets** — what Pro buys is `.mjs` access to *paid* assets (plus the per-account CDN path and the raw `/dl/` downloads).

Restated for tickets 05 and 07: the free/Pro fork is **not** "pre-baked variants versus runtime knobs". It is "**Forest at runtime, free**" versus "**City and RTS at all, paid**". That is a cleaner and more consequential framing than the one the map currently carries.

### Licence, cost, lock-in

<https://polyfork.dev/licensing>, quoted:

- *"Use any asset you download here in personal and commercial projects: games, apps, websites, prototypes, videos, client work and products you sell."*
- *"No attribution required, ever."*
- Forbidden: *"Resell or redistribute the assets themselves … no re-uploading the files (GLB or ES module, original or modified) to other marketplaces, asset packs, template libraries or file-sharing sites, whether free or paid."*
- *"Your game can ship the models inside it; the files as standalone assets stay here."*
- Also forbidden: building or training a commercial 3D asset generator from the files.

The "your game can ship the models inside it" sentence reads as permission for the SaaS case. **Ticket 03 must still settle it** — a web app serving GLB bytes to anonymous browsers is closer to the line than a compiled game binary is, and neither the map nor this ticket should treat it as closed.

Pricing: Pro is $10/month, $99/year, or a $100 one-time Founders plan (`subscribe` block on every paid asset; <https://polyfork.dev/pricing>). Individual published kits are $28. Lock-in is the real exposure — this is a single small vendor, several of the kits this project needs are still "filling-up", and the whole growth mechanic depends on their remix service staying up. Downloaded GLBs and `.mjs` files remain usable, but *baking a new variant* requires the service. Ticket 03 owns the survivability question.

### Visual coherence

`GET /api/kits/nature-forest-kit-f29d6a` returns a `usage` contract: every part carries a `colorway` knob curated per part, and *"they are all built to the kit palette, so any combination stays coherent"*, over *"one shared real-world scale in meters"*. Coherence **within** a kit is contractual. **Across** kits it is not — `prompt.txt` advises "Prefer one kit" and to check `seam_margin_m` when joining kits. Since each Theme maps to one kit (Nature & Forest → Forest, NYC or Little Tokyo → City, Medieval Village → RTS), this is a good fit: coherence is guaranteed exactly where the product needs it, and the three Themes are *meant* to look different from each other.

The 67 free `ultra` assets (70–350 triangles, kitless — Pine Tree at 70 tri, Mushroom at 112, Treasure Chest at 120) are a separate visual language with no kit palette. Not usable for a coherent Theme, but worth remembering as a very cheap LOD or "hundreds of Entities" path.

---

## Kenney

Primary source: <https://kenney.nl/assets/category:3D> and the individual pack pages, all read 2026-08-19. The Nature Kit zip was downloaded and its GLBs parsed — everything marked [MEASURED] below comes from the shipped files, not the page.

### Licence — CC0, and that is the whole story

Every 3D pack page carries **"License: Creative Commons CC0"**. No attribution, no redistribution clause, no edge case to email about, no vendor to survive. Compared to ticket 03's five conditions on Polyfork, the Kenney condition list is empty.

### The 3D catalogue, per Theme

| Pack | Files | Theme fit |
|---|---|---|
| Nature Kit | **330** | Forest |
| Mini Forest | 20 | Forest (a lighter visual language) |
| City Kit (Commercial) | 50 | City |
| City Kit (Suburban) | 40 | City |
| City Kit (Roads), City Kit (Industrial) | — | City ground and filler |
| Fantasy Town Kit | 160 | RTS |
| Castle Kit | 75 | RTS |
| Tower Defense Kit | 160 | RTS |
| Mini Characters | 25 | units |
| Blocky Characters | 20 | units |

Note what the City row fixes: the 2D research recorded that the pixel Town Pack **lacked roads and terrain**, forcing DIY filler tiles. Kenney ships City Kit (Roads) as a pack of its own. The 3D gap closes.

### What the Nature Kit actually contains [MEASURED]

Downloaded `kenney_nature-kit.zip` (10.5 MB) and parsed it:

- **329 models**, each shipped in **five formats**: `.glb`, `.fbx`, `.obj` (+`.mtl`), `.dae`, `.stl`. GLB means no conversion step for three.js.
- **61 tree models.**
- Triangle counts, parsed from the GLB JSON chunks:

| model | triangles |
|---|---|
| `rock_smallA` | 16 |
| `tree_pineTallA` | 78 |
| `tree_pineTallD` | 98 |
| `grass` | 132 |
| `tree_pineSmallA` | 164 |
| `tree_oak` | 196 |
| `tree_pineDefaultA` | 230 |

These are **3–10× lighter than Polyfork's** (300–620). At 1,000 **Entities** that difference is real, and it is a direct input to research 02.

- **Attributes: `POSITION`, `NORMAL`, `TEXCOORD_0`. Two materials per model, zero embedded images.** This is a *different* merge strategy from Polyfork's, which ships one shared material with `COLOR_0` vertex colours so any set merges to one draw call. Kenney models carry real normals (so no flat-shading surprise) but colour comes from materials, not vertices. Ticket 02 must not assume the Polyfork merge story applies here.

### The growth mechanic — a naming ladder, not a knob

There are **no parameters**. Every model is a fixed mesh. But the Nature Kit names a ladder of the same species:

```
tree_pineSmallA  B  C  D
tree_pineDefaultA  B
tree_pineTallA  tree_pineTallA_detailed
tree_pineRoundA  B  C  D  E  F
tree_pineGroundA  B
```

That is small → default → tall in one species, which is exactly what four **Size Tiers** need — as *option 2* from ticket 05 ("distinct meshes"), delivered rather than assembled. It reads as the same subscriber grown because it is the same artist's same tree.

What it cannot do: the in-between. A tier change is a swap, never a rebuild, so animating `grew` means cross-fading or popping between two meshes. Polyfork can interpolate `tallness` continuously; Kenney cannot.

### Coherence, cost, lock-in

One artist, one palette, one scale across the whole 3D catalogue — coherence within *and* across Themes, which is stronger than Polyfork offers (its kits are contractually coherent only within a kit). Cost: free, donation-optional. Lock-in: **none**. The zip is on disk; CC0 has no revocation and no vendor.

The one thing Kenney does not have is an API. Delivery is: download the zip, commit what you use. Ticket 03's recommendation for Polyfork was to vendor the files anyway, so this is not a real difference in the shipping path — only in the authoring loop, where Polyfork's API and MCP server are genuinely more agent-friendly.

---

## Quaternius

Primary source: <https://quaternius.com/> and the individual pack pages, read 2026-08-19. Model counts and licences below were parsed from the pack pages themselves [MEASURED]; pack *contents* were not verified from downloaded files, because distribution is a Google Drive folder rather than a direct URL — marked [UNVERIFIED] where it matters.

### Licence — CC0

Every pack page links `creativecommons.org/publicdomain/zero/1.0/` and states "free to use in personal and commercial projects". Formats: FBX, OBJ, glTF, Blend.

One nuance: a Patreon tier sells **"Source keys"** for the `.blend` source kits. The exported CC0 models are free to everyone; only the editable sources are paid. Nothing this project needs is behind that.

### The catalogue, per Theme [MEASURED]

| Pack | Models | Theme fit |
|---|---|---|
| **Ultimate Fantasy RTS** | **128** | **RTS — buildings in evolution stages** |
| Medieval Village MegaKit | 304 | RTS |
| Medieval Village Pack | 44 | RTS |
| Ultimate Modular Ruins Pack | 90 | RTS (decay / churn states) |
| Downtown City MegaKit | 315 | City |
| Ultimate Buildings Pack | 76 | City (modular, atlas textures for palette swaps) |
| Buildings Pack | 9 | City |
| Ultimate Nature Pack | 150 | Forest |
| Stylized Nature MegaKit | 116 | Forest (Ghibli-styled) |
| Ultimate Stylized Nature Pack | 63 | Forest (textured, normal maps) |
| Stylized Tree Pack | 45 | Forest |
| Ultimate Modular Men / Women | 11 each | units (soldier, farmer, adventurer outfits) |
| RPG Character Pack, Ultimate Animated Character Pack | — | units, rigged and animated |

### Ultimate Fantasy RTS — the pack that closes the gap

128 models, CC0, August 2022, FBX/OBJ/glTF/Blend. The pack description, verbatim:

> "This pack includes a collection of buildings in different evolution stages, along with nature assets."

**"Evolution stages" is a Size Tier ladder, shipped.** This is the single most decision-relevant fact about Quaternius, and it lands precisely on the hole that both prior researches found: the 2D research said "no off-the-shelf Warcraft-like units exist" in pixel art, and the Polyfork section above found 0 results for soldier, warrior, orc, archer, spearman, troop, army, banner, catapult and barracks. Quaternius has the buildings *and* the ladder *and* — via the Modular Men/Women and RPG/Animated Character packs — rigged units.

[UNVERIFIED] The exact stage count per building is not published on the page and could not be read from the Google Drive distribution. Ticket 10 should download the pack and count before committing the RTS Theme to it.

`Ultimate Modular Ruins Pack` (90 models) is worth flagging separately: the churned **Entity** needs a decay state, and a ruins pack in a matching art style is exactly that.

### Growth mechanic, coherence, delivery

Static meshes, no parameters — same limitation as Kenney. The difference is that Quaternius's RTS pack has the ladder *authored in*, so the Size Tier problem is solved by asset selection rather than by a knob.

Coherence is per-pack, and the packs vary in style more than Kenney's do — a Ghibli-styled nature megakit and a textured buildings pack are not siblings. Mixing packs *within* one Theme needs a look at the palettes first.

Delivery: a public Google Drive folder per pack. No API, no MCP server, no programmatic catalogue. Download and vendor. Acceptable for shipping, meaningfully worse than Polyfork for the authoring loop.

---

## The wider field

Not pursued in depth, and the reason is worth recording: **Kenney and Quaternius between them already cover all three Themes under CC0**, so the field's remaining value is in filling specific gaps rather than in replacing either.

- **Poly Pizza** (`poly.pizza`) — a CC0 aggregator that hosts Kenney's and Quaternius's catalogues, including a browsable page for the Ultimate Fantasy RTS bundle. It has a documented API. It blocked both WebFetch and `curl` from this environment (403), so its terms were **not** verified first-hand — check before depending on it. As an aggregator over sources we can reach directly, it is a convenience, not a dependency.
- **Sketchfab / Fab** — a previous research attempt started here and did not finish. Both host CC0 and CC-BY models, but per-model licences vary, which reintroduces exactly the per-asset licence audit that CC0 packs remove. Only worth revisiting for a specific missing model.
- **itch.io** — many CC0 low-poly packs, quality and licence clarity both uneven. Same verdict: gap-filler.

[UNVERIFIED] None of these three was checked to the standard of the sections above. If a Theme turns out to be short a specific model, that is when to spend the time.
