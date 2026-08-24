# PROTOTYPE — Forest World (ticket 05 / 06)

**Throwaway code.** This folder answers ticket 05 ("does the forest World land?")
and hosts ticket 06's timeline extension. Nothing here is production code; the
build effort rewrites it. See `.scratch/isometric-dashboard/issues/05-prototype-forest-world.md`.

## Run it

Open `index.html` in a browser (double-click works — no server, no build step).

Hosted copy (single-file bundle, published 2026-08-18):
https://claude.ai/code/artifact/27f15c28-493b-4470-9186-3889ff59b8df

- **← / →** or the bottom bar: switch page variants
  - `?variant=A` — **Overworld**: full-bleed world, floating game-dialog HUD
  - `?variant=B` — **Ranger station**: framed world + subscriber roster (hover a row → highlight the tree; click → center it)
  - `?variant=C` — **Diorama**: night share-card framing with a big MRR counter
- **Drag** pans, **wheel** zooms, **hover a tree** for its subscriber card
- **Timeline** (ticket 06): scrub the slider to any day in the 3-year history,
  **▶** (or space) replays the whole history in ~6 seconds, **Today** jumps back.
  `?t=<epoch seconds>` opens at a past date. Churn risk shows only at today (ADR-0002).
- Bottom bar: mock presets (`default`, `singlePlan`, `tiny`, `churnWave`, `crowded`) and a free-text seed

## What is what

Tree = Subscriber. Size = MRR tier (4 stages). Orange = churn risk (deep orange =
critical). Grey bare tree = churned in the last 90 days; after that a stump
remains. Rain = a payment landed recently. Dark cloud = a payment failed.
Sparkle = new subscriber.

## Files

- `mock-signals.js` — the ticket-04 mock generator, `foldWorldState`, tier rules, deterministic placement
- `sprites.js` — procedural pixel sprites (placeholders for the Evergrow pack, same 32×16 iso grid)
- `world.js` — the PixiJS renderer (the "Theme" — sees only Signals, never Stripe shapes)
- `main.js` / `index.html` — the three page variants + switcher
- `screenshots/` — captured verdict material
- `test.mjs` — node harness: determinism, prefix placement, a fold snapshot, and the `foldWorldState` benchmark

## Test it

```sh
node prototypes/forest-world/test.mjs             # check
node prototypes/forest-world/test.mjs --snapshot  # re-record test-snapshot.json
```

Re-record the snapshot only when the fold's output is *meant* to change. A refactor
that must keep the output identical (ticket 12) proves it by leaving the file alone.
