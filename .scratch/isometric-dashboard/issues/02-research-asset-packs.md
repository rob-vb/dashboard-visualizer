# Research: isometric pixel-art asset packs and licenses

Type: research
Status: resolved

## Question

Which existing isometric pixel-art asset packs fit the three launch themes (forest, city, RTS/game style)? For each serious candidate record:

- Source and price (Kenney, itch.io, CraftPix, etc.)
- License terms — is commercial SaaS use allowed, is attribution required, can assets be redistributed as part of a web app?
- Style consistency across the pack (palette, tile size, perspective angle)
- Coverage of what the themes need: growth stages (small→large tree / building), decay or "dying" states, weather effects (rain), terrain tiles, props

Recommend one pack (or a compatible combination) per theme, and flag any theme with no good off-the-shelf coverage — that gap changes downstream prototype tickets.

## Answer

Full findings with per-claim sources: [research/02-asset-packs.md](../research/02-asset-packs.md)

### Forest — **Evergrow** (Pixel Hoo) + DaunGames Rain Effect

- Source/price: itch.io, $5+ (rain effect: free, CC0).
- License verdict: commercial use OK, modification OK; files may not be resold or redistributed even if modified — embed as re-packed atlases, not the vendor's original files. No attribution required.
- Style: 32x32 isometric pixel art, consistent cottage-core palette, hand-made.
- Coverage: pine + oak trees with **4 growth stages** (only pack found that delivers small→large growth directly), stumps and fallen logs, terrain, animated water, rich props.
- Gaps: no explicit dying/diseased tree state (stumps/logs are the closest); no weather in the pack (use the CC0 rain effect); pack is v0.5 "in development" — buy for what ships today, not the roadmap.

### City — **Isometric Tiles – Town Pack** (Screaming Brain Studios), optionally + City Buildings 30 (Kelano, $4)

- Source/price: itch.io, free, **CC0** (Kelano add-on: commercial OK, credit optional).
- License verdict: CC0 base = zero risk for a SaaS that serves sprites to browsers.
- Style: 2:1 isometric, 443 tiles; buildings stack into multi-story structures — a workable substitute for construction/growth stages.
- Gaps: no construction stages proper; **no roads or terrain** in the Town Pack; the only pixel-art isometric roads pack found (Pixel City, oli414) states no license — do not use without author contact. Kelano tiles are a different tile size (64x64 vs 128x64) — mixing needs care.

### RTS/game (Warcraft-like) — **Isometric Strategy – Medieval Pixel Art Tiles** (crabcrabcrabs) for terrain + buildings; **units flagged as a gap**

- Source/price: itch.io, name-your-own-price, CC-BY 4.0.
- License verdict: commercial OK; attribution required (app credits page).
- Gaps — **weakest theme, flagged**: no isometric pixel pack found that delivers Warcraft-like units plus construction stages. The one verified complete option (OpenGameArt Sci-Fi Mech pack, CC0: construction stages, destruction, 6 unit types) is sci-fi, not medieval. Downstream prototype tickets should plan to commission units, accept a sci-fi pivot, or scope the RTS theme to buildings-only at first.

### Cross-cutting notes

- Kenney is CC0 but its isometric packs are **not pixel art** — safe style-mismatched fallback only.
- CraftPix licensing works for a rendering-only SaaS, but all their isometric packs are vector, not pixel art — ruled out.
- A web app inherently serves the raw PNGs to browsers; no custom itch license addresses this explicitly. Prefer CC0/CC-BY packs; re-atlas sprites for custom-license packs; consider a permission email to Pixel Hoo before public launch.
