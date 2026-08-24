# Isometric pixel-art asset packs for the three launch themes

Research date: 2026-08-18. Every claim below was checked against the primary page (asset page or license page) unless marked **[UNVERIFIED]**.

Context: assets will be embedded in a commercial SaaS web app (sprites served as PNG/atlas files to browsers). This means every non-CC0 license needs a read on "redistribution": all of them allow embedding in a product, none of them explicitly discusses that a web app inherently exposes the raw PNGs to the browser. See "Gaps and risks".

## Summary and recommendations

| Theme | Recommended pack(s) | Source + price | License verdict | Coverage gaps |
|---|---|---|---|---|
| Forest | **Evergrow** (Pixel Hoo) + **DaunGames Rain Effect** for weather | itch.io, $5+ / rain: free (CC0) | Commercial OK; modify OK; no resale/redistribution of assets even if modified | No dying/diseased tree state (only stumps + fallen logs); pack is v0.5 "in development"; rain comes from a separate CC0 pack |
| City | **Isometric Tiles – Town Pack** (Screaming Brain Studios) as CC0 base; optionally **City Buildings 30** (Kelano) for modern building variety | itch.io, free (CC0) / Kelano $4 | Town Pack CC0 = zero-risk for SaaS; Kelano: commercial OK, credit optional | No construction/growth stages in either pack (workaround: Town Pack tiles stack into multi-story buildings); Town Pack has no roads/terrain; the two packs differ in tile size (128x64 vs 64x64) — mixing needs care |
| RTS (Warcraft-like) | **Isometric Strategy – Medieval Pixel Art Tiles** (crabcrabcrabs) for terrain+buildings; **no good off-the-shelf unit set** — flag | itch.io, name-your-own-price (CC-BY 4.0) | CC-BY 4.0: commercial OK, attribution required in app credits | No units, no construction stages verified. Only verified isometric pixel pack with construction stages *and* units is CC0 but sci-fi (OGA Mech pack). This theme has the weakest off-the-shelf coverage |

Cross-cutting license note: prefer CC0/CC-BY packs where possible because the app serves sprites to browsers. CC0 = no conditions. CC-BY = credits page. Custom itch licenses (Evergrow, Kelano, Gabriel Studio) allow commercial embedding but forbid redistributing the files "standalone" — embedding in a web app is the intended use, but pack the sprites into atlases rather than shipping the vendor's original files verbatim.

---

## Theme 1: Forest

### Evergrow — Isometric Pixel Art 32x32 Cottage Core Tile Set (RECOMMENDED)
- Source: https://pixelhoo.itch.io/evergrow — $5.00+ (Pixel Hoo)
- Style: isometric pixel art, 32x32 tiles, cottage-core palette, hand-made ("no generative AI").
- Coverage (from the asset page):
  - Trees: pine and oak, **4 growth stages each** — the only pack found that directly delivers small→large tree growth.
  - Decay-adjacent: chopped trunks and fallen logs. **No explicit dying/diseased tree state.**
  - Terrain: grass tiles, dirt paths; animated water + waterfall tiles.
  - Props: rocks, bushes, weeds, mushrooms, flowers, 5 forest houses, lamp posts, berry bushes, well, crates.
  - Weather: none shipped; seasonal variants (spring/summer/autumn/winter) are *planned*, not delivered (v0.5).
- License (stated on page): commercial and non-commercial use permitted; assets can be modified; assets "CAN'T be resold or redistributed even if modified". No attribution requirement stated.
- Risk: version 0.5, "in development" — roadmap items (seasons, biomes) are promises, not assets. Buy for what is in the zip today.

### [FREE] 2D Isometric Forest Pixel Art 32x32 (Kipperfalcon) — free supplement/fallback
- Source: https://kipperfalcon.itch.io/2d-isometric-forest-pixel-art — free / name-your-own-price
- Style: isometric pixel art, 32x32 (same grid as Evergrow — good pairing candidate; palette match needs visual check).
- Coverage: 115 props: 88 tiles, 17 grass leaves, 5 tree types, 5 rocks. **No growth stages, no dead trees, no weather** (page).
- License (stated on page): "released under CC0 for art and is free for personal and commercial use"; page also says it cannot be repackaged/redistributed/resold and bans AI-training use. Note the internal tension: true CC0 cannot carry those restrictions; treat the page text as the author's intent and don't rely on pure-CC0 freedoms for this pack.

### Isometric Medieval Pixel Art Asset Pack – Starter Kit (Gabriel Studio) — alternative forest base
- Source: https://gabrielstudio.itch.io/isometric-medieval-worlds-starter-kit — $3.99 (sale, normally $4.99); bundle with 2 sibling packs $11.57
- Style: isometric pixel art, **64x32 tiles (2:1)**, PNG; Unity/Godot/Unreal friendly.
- Coverage: 52 grass + 32 dirt terrain tiles with transitions; 12 animated water tiles; **modular tree system** (6 trunks, 2 stumps, 4 canopies → up to 36 tree variants — modularity can fake growth stages by swapping canopies, but no designed growth ladder); bushes, flowers, docks, ruins, tent, fences, campfire, rocks, cliffs. No weather.
- License (stated on page): personal and commercial projects allowed; "redistribution, resale or sharing of the original files as standalone assets is not permitted".

### Weather add-on: 2D Pixel Rain Effect (DaunGames)
- Source: https://daungames.itch.io/rain-effect — free / name-your-own-price, **CC0** (stated on page)
- Rain sprite sheet + Aseprite file. Tiny (1.3 kB) but CC0, so it can be recolored/scaled freely to overlay any theme.
- Other options exist (e.g. Seliel the Shaper "Pixel Art Effects – Weather", https://seliel-the-shaper.itch.io/weather-effects) — **[UNVERIFIED]** license/contents, not fetched.

### Also seen (not fetched in detail)
- FREE Animated Isometric Trees / FREE 2D Isometric Plants by Engvee (https://engvee.itch.io/free-isometric-plants) — free; commercial use reportedly allowed **[UNVERIFIED — license text not read from the pack page]**.
- Cozy Isometric Nature: Starter Pack 32x32 (dev.diavlo), Isometric Asset Pack: Forest (Rafael Sewa) — listed on the itch tag page https://itch.io/game-assets/tag-isometric/tag-nature, not evaluated.

---

## Theme 2: City

### Isometric Tiles – Town Pack (Screaming Brain Studios) (RECOMMENDED base — license)
- Source: https://screamingbrainstudios.itch.io/iso-town-pack — free / name-your-own-price
- Style: "true 2-Dimensional **2:1 isometric** render", pixel-art tiles; building tiles 128x64, roof tiles 143x92; teal-keyed sheets; Tiled example map included.
- Coverage: 443 tiles — 3 building tilesheets (216 building types, two lighting directions), roofing sheet (11 roofs). Tiles mix and **stack for multi-story buildings** — this stacking is the best available stand-in for building "growth stages" (render 1 story → N stories as MRR grows). **No roads, terrain, or props in this pack** (page lists buildings + roofs only).
- License (stated on page): **CC0 / Public Domain** — "free to use however you like in any project, commercial or non-commercial". Zero risk for serving to browsers.

### City Buildings – 30 Pixel Art Buildings, 64x64 (Kelano Studio) — building variety
- Source: https://kelano-studio.itch.io/city-buildings (old URL ninjagame-dev.itch.io redirects here) — $4.00 (sale, normally $5.00)
- Style: 30 urban 64x64 isometric pixel-art buildings, transparent PNG; residential/commercial/industrial/civic incl. shops, skyscrapers, church, warehouses, stadium.
- Coverage: buildings only — **no construction stages, roads, or terrain** (page).
- License (stated on page): "Free for commercial and non-commercial use. Credit appreciated but not required."
- Caveat: 64x64 vs Town Pack's 128x64 — mixing the two packs means scaling one of them; check visually before committing.

### Pixel City – Isometric Pixelart Graphics (oli414) — terrain/roads candidate, license risk
- Source: https://oli414.itch.io/isocity — $6.05+
- Style: 16-bit isometric pixel art.
- Coverage: 74 tiles (62 terrain incl. slopes/hills, 12 roads incl. sloped roads and rivers), 77 sprites (40 cars, 32 trucks, **only 5 buildings**).
- License: **no license terms stated on the asset page** **[UNVERIFIED — do not use commercially without contacting the author]**. This is the only pack found with proper pixel-art isometric roads + terrain, so it may be worth an email.

### Kenney isometric packs — safe license, wrong art style
- Source: https://kenney.nl/assets/isometric-tiles-city (also isometric-tiles-buildings, isometric-tiles-landscape, isometric-roads, isometric-blocks; catalog: https://kenney.nl/assets/category:2D?search=isometric) — free, donations optional
- License: **CC0** (stated on asset page). Perfect for SaaS redistribution.
- Style: 128x128 pre-rendered/flat-shaded isometric tiles — **not pixel art** (assessed from previews and tile resolution; Kenney does not label these "pixel"). Roads, landscape, buildings and vehicles coverage is broad, so this is the best *fallback* if the pixel-art constraint is relaxed, but it will not match pixel-art forest/RTS themes.

---

## Theme 3: RTS / Warcraft-like

### Isometric Strategy – Medieval Pixel Art Tiles (crabcrabcrabs) (RECOMMENDED base)
- Source: https://crabcrabcrabs.itch.io/isometric-strategy-medieval-pixel-art-tiles — name-your-own-price
- Style: medieval-fantasy isometric pixel art; page states **320 tiles at 64x64**, sprite sheets + Aseprite source files; animated elements (swaying flags). Released ~July 2026, actively updated.
- Coverage: natural terrain + modular castle/fortification architecture. **No units and no construction stages confirmed on the page.** Modular walls/buildings can be composed into "under construction" looks, but that is DIY.
- License (itch metadata on page): **Creative Commons Attribution v4.0 International** — commercial SaaS use allowed, redistribution allowed, **attribution required** (credits page in the app satisfies CC-BY).

### Pixometric Collection: Medieval World (MedimonGames) — cheap building/environment set
- Source: https://medimongames.itch.io/pixometric-collection-medieval-world — $1.99+
- Style: minimalist isometric pixel art; 90 sprites; **day/noon/night versions** and a winter-season update (nice for a "living world" clock).
- Coverage: medieval buildings, vegetation, water, ornaments. Explicitly **no characters/units**; no construction stages mentioned. Marketed "for RTS or CityBuilder games".
- License (itch metadata on page): **CC-BY 4.0** — commercial OK, attribution required.

### Units problem — the gap
No isometric *pixel-art* Warcraft-style pack with units + buildings + construction stages was found. Options:
- **GG Complete Isometric Character Set** (Game Gland) — https://gamegland.itch.io/gg-complete-isometric-character-set — free/NYOP; 12 animated character sheets, 8 directions, idle/attack/walk/die. Style is *pre-rendered* isometric, not strictly pixel art. License: **no formal license text on the page**; author states in comments that commercial use and editing are fine, credit optional **[weak legal footing — comment-based permission only]**.
- **Sci-Fi Strategy Mech Buildings Isometric Asset Pack** (acdrnx, OpenGameArt) — https://opengameart.org/content/sci-fi-strategy-mech-buildings-isometric-asset-pack — free, **CC0**. The only verified pack with the full RTS loop: 8 buildings x 3 designs **with construction stages, door animations and destruction sequences**, background tileset, 6 unit types x 3 designs with walk/idle/shoot animations. Pixel art, isometric — but **sci-fi Mars theme**, not medieval. If the RTS theme can flex from "Warcraft" to "Command & Conquer", this is the safest, most complete choice.
- **Tiny RTS Tileset** (itchabop) — https://itchabop.itch.io/tinyrts — $10; explicitly Warcraft-inspired: human + orc factions, town hall/farm/barracks/towers, peasant/soldier/peon/grunt units with move/idle/attack/death animations, gold mine, terrain incl. dead trees. License on page: free+commercial use OK, modify OK, no redistribution/resale, credit optional. **But it is top-down 8x8, not isometric** — usable only if the RTS theme drops the isometric requirement.

### Other RTS candidates rejected
- RTS Style Buildings (Various Stages), ToastyCatStudios — https://toastycatstudios.itch.io/rts-style-buildings-various-stages — has construction stages but is **3D low-poly (.blend/.fbx)**, one building so far, no license text on page.
- 4K Isometric RTS Building Pack (Marcin) — https://marcinjedrol.itch.io/4k-isometric-rts-building-pack — $5.99, detailed but 3D-rendered, not pixel art.
- [FREE] RTS: Isometric Castles 105 Pack (Polyy.AI) — 3D renders; creator name suggests AI-generated content — avoid.

---

## CraftPix — evaluated and largely ruled out

- License (https://craftpix.net/file-licenses/): both free and premium licenses allow personal and commercial use, modification, and distribution of games built with the assets; no attribution required ("any credit will be highly appreciated"); reselling source files or exposing the art files to end users through the app is forbidden ("an app that allows the user to save or export a modified version of the artwork itself is not fine"); AI training explicitly banned. For a rendering-only SaaS the license is workable.
- Fit problem: CraftPix's isometric tilesets are **vector art, not pixel art**. Verified on two product pages: Isometric Ruin Tileset (https://craftpix.net/product/isometric-ruin-tileset/ — "Vector: Yes") and Isometric Field Tileset (https://craftpix.net/product/isometric-field-tileset-assets/ — "The graphics are 100% vector"). Their pixel-art tilesets (https://craftpix.net/categorys/pixel-art-tilesets/) are top-down, not isometric. **No CraftPix pack found that is both isometric and pixel art** — searched their catalog; the category URL /categorys/isometric-2d-tilesets/ 404s.

---

## Gaps and risks

1. **Web-app redistribution ambiguity (all non-CC0 packs).** Evergrow, Gabriel Studio, Kelano, Tiny RTS and CraftPix all forbid redistributing the asset files while allowing embedding in commercial products. A web app necessarily serves the PNGs to browsers, where they are trivially saveable. None of these licenses addresses this case explicitly. Mitigations: prefer CC0 (Screaming Brain, Kenney, DaunGames, OGA mech pack) or CC-BY (crabcrabcrabs, Pixometric); for custom-license packs, ship packed/re-atlased sprites rather than the vendor's original files, and keep purchase receipts. For a high-visibility launch, a one-line permission email to Pixel Hoo (Evergrow) is cheap insurance.
2. **Dying/decay tree states: not off-the-shelf.** Evergrow has stumps and fallen logs; Tiny RTS has dead trees (top-down); no isometric pixel pack found with a designed healthy→dying→dead tree ladder. Plan to commission or recolor (desaturate/brown-shift canopy sprites) — Evergrow allows modification.
3. **Building construction/growth stages: not off-the-shelf in pixel isometric.** Only the CC0 sci-fi OGA pack has real construction stages. For City, use Town Pack story-stacking; for RTS, either accept the sci-fi reskin or DIY scaffold overlays (crabcrabcrabs CC-BY allows derivatives).
4. **RTS units in isometric pixel art: the weakest spot.** GG character set has no formal license; everything else is 3D or top-down. Budget for commissioned unit sprites, or pivot the RTS theme to sci-fi on the CC0 OGA pack.
5. **Style mixing.** Tile grids differ across recommended packs (32x32 Evergrow/Kipperfalcon; 64x32 Gabriel; 64x64 crabcrabcrabs/Kelano; 128x64 Screaming Brain). Per theme this is fine (each theme = one base pack), but cross-theme UI consistency will need a shared rendering scale and possibly palette-mapping. Verify palette compatibility visually before purchase decisions — store pages do not document palettes.
6. **Unverified items** (marked inline above): Pixel City (oli414) license — none stated; Engvee packs' license text — not fetched; Seliel weather pack — not fetched; Kenney "not pixel art" is an assessment from previews/resolution, not a label on the page; GG character set permission exists only as an author comment.
