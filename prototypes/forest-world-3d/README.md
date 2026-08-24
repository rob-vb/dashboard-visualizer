# PROTOTYPE — 3D Forest World (ticket 08, the gate)

**Throwaway code.** This folder answers one question: *does a low-poly 3D Forest
World earn the same verdict the pixel-art Forest World got?* See
`.scratch/lowpoly-3d-pivot/issues/08-prototype-3d-forest-gate.md`.

The gate passed on 2026-08-24, and ticket 14 then deleted `prototypes/forest-world/`
(the PixiJS original). It lives only in git history, at commit `ed8b8a9`. The
render-independent Signal layer it was built on survives at `prototypes/signals/`,
and this prototype still loads that `mock-signals.js` unchanged — the proof that
the pivot is a Theme-layer change (ADR-0001).

## Open the hosted copy

Single-file bundle, published 2026-08-24 — works on a phone, no server needed:
https://claude.ai/code/artifact/0fdf9d44-f1ff-49f2-ade5-be0300dd5e45

The 2D original it was measured against, kept as the gate's record:
https://claude.ai/code/artifact/27f15c28-493b-4470-9186-3889ff59b8df

Rebuild the bundle after any change:

```sh
node prototypes/forest-world-3d/build-artifact.mjs   # -> dist/forest-world-3d.html
```

## Run it locally

```sh
node prototypes/forest-world-3d/serve.mjs
```

- 3D — http://localhost:5173/prototypes/forest-world-3d/
- phone — the server prints a LAN URL; open it on a real phone and read the HUD

A server is needed (unlike the 2D prototype): ES modules and `fetch` do not work
from `file://`.

## Drive it

- **Drag** pans, **wheel** zooms, **hover a tree** for its card
- **Right-drag** (or shift-drag, or shift+wheel) turns freely; **two fingers** turn on touch
- **Turn** buttons bottom-right, or **Q** / **E**, step to the next of the four stands (ticket 04)
- **Timeline**: scrub, **▶** (or space) replays 36 months in ~6 s, **Today** returns
- **← / →** switch page variant: `A` Overworld, `B` Ranger station, `S` Share link
- `?variant=` `?preset=` `?seed=` `?t=<epoch>` `?pitch=26.565` set the initial state
- Variant B: hover a roster row to highlight its tree, click to fly the camera to it

## Gate knobs (top right, "open")

Everything the map handed this ticket as an open question, live:

| Knob | Ticket | What to look for |
|---|---|---|
| Camera pitch 26.565° / 35.264° | 04 Q6 | how much a tall tree hides behind it |
| Cells per Entity 1.9 / 2.4 / 3.0 | 04 Q9 | crowded or sparse |
| Tier scale span 0 → 1 | 05 Q6 | does €99 read bigger than €9 without a magnifier |
| Cloud zoom threshold | 06 Q3 | when clouds should stop being a ceiling |
| Ease the 90-day ramp | 06 Q7 | how a recent loss fades |
| Sway / rain / shadows / night / exposure | 06 Q12 | motion and mood, and what mobile can drop |

The header line is the measurement: `fps · frame ms (write / gl) · draw calls ·
triangles · entities · fold ms`.

## Presets

`default` (237 entities) · `crowded` · `scale1583` (1,583 — research 02's target)
· `scale3000` (3,167 — headroom) · plus the 2D prototype's own presets.

## What is what

Tree = Subscriber. Silhouette + a modest scale = MRR tier (ticket 05's measured
ladder, 13 living geometries). Orange canopy = churn risk, deep orange = critical,
today only (ADR-0002). A tree drained from green to grey-brown = churned, the tint
ramping across the 90-day mourning window; after that, a stump. Rain from a
warm-white cloud = a payment landed; a dark flickering cloud = one failed. Gold
sparks = a new subscriber, cool-white sparks = one that returned.

## Files

- `extract-assets.mjs` — run once by hand; turns Kenney Nature Kit GLBs into `assets/geometry.json`
- `assets/geometry.json` — 23 models as raw position/normal/index arrays (no GLTFLoader at runtime)
- `world3d.js` — the three.js Theme: instancing, FX pools, camera, the knobs
- `main.js` / `index.html` — the page variants, timeline, knob panel, perf HUD
- `vendor/three.*.js` — three.js r180, vendored so the page has no network dependency
- `serve.mjs` — the static server
- `screenshots/` — captured gate material

## Deliberately held constant

The page chrome is copied verbatim from the 2D prototype — same fonts, same boxes,
same layouts. The gate compares two *Worlds*; if the chrome changed too, a
preference could not be attributed. The only new furniture is the dark knob panel,
styled as an instrument rather than as product.
