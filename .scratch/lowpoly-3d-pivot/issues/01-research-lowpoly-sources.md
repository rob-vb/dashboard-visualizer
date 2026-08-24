# Research: low-poly 3D asset sources

Type: research
Status: resolved
Blocked by: —

## Question

Which low-poly 3D asset source (or combination) should carry all three Themes — Forest, City, RTS?

Weigh at least **Polyfork** (https://polyfork.dev, `prompt.txt` is its agent-facing guide), **Kenney** (kenney.nl, CC0), and **Quaternius** (CC0). Look for others if they exist.

Judge each on:

1. **Coverage per Theme.** Forest needs trees and ground cover. City needs buildings that read as growth. RTS needs the thing the 2D research could not find: [research 02](../../isometric-dashboard/research/02-asset-packs.md) concluded "no off-the-shelf Warcraft-like units exist" in pixel art. Does 3D close that gap?
2. **The growth mechanic.** An Entity must render at 4 **Size Tiers** (`CONTEXT.md`). Does the source give distinct meshes per tier, a parametric knob, or nothing but uniform scale? Polyfork's `tallness` knob rebuilds a tree's whorl count rather than scaling it — is there an equivalent elsewhere?
3. **Licence.** Commercial SaaS use, attribution burden, and whether the files may ship inside a deployed build. CC0 has none of these problems; Polyfork forbids redistributing the files as assets. (Ticket 03 digs into the Polyfork case specifically — do not duplicate it, but do record how each rival compares.)
4. **Visual coherence.** One shared palette and scale across a Theme, and ideally across all three, so the app reads as one product.
5. **Cost and lock-in.** Free tiers, paid tiers, and what happens if the source disappears.

Verified facts already in hand about Polyfork (2026-08-18, from the live API — do not re-derive):

- 608 assets, 307 free, every free asset under 600 triangles.
- Free assets download anonymously: `download.auth` is `"none"`. Confirmed on `tall-pine-tree-ab4108.glb` (39 KB).
- Remix works anonymously: 40 bakes/hour, 100/month. A free account (email only) gives 100/hour and 300/week. Baked variants are cached globally and re-fetch for free.
- Free assets per relevant kit: Nature & Forest 36/58, Japanese Suburban Street 29/46, New York City 26/56, Space Base 27/61, Medieval Village 18/50, Spaceship Wars 3/18.
- Pro ($10/month, $99/year, or $100 one-time Founders Club) adds the whole catalogue, the `.mjs` program for runtime knobs, structured GLB with named parts, and a per-account CDN path.
- The free public GLB is one joined anonymous mesh for static assets — no named parts.

Write findings to `.scratch/lowpoly-3d-pivot/research/01-lowpoly-sources.md`. End with a ranked recommendation per Theme, and say plainly whether one source can carry all three.

## Answer

Findings: [`research/01-lowpoly-sources.md`](../research/01-lowpoly-sources.md) (Polyfork 2026-08-18, rivals and summary 2026-08-19).

**No single source carries all three Themes.** Each Theme is its own visual world, so per-Theme sourcing costs nothing.

| Theme | First choice | Runner-up |
|---|---|---|
| Forest | **Kenney Nature Kit** — CC0, 329 models, 61 trees, a shipped `pineSmall → pineDefault → pineTall` ladder, 16–230 triangles | Polyfork Nature & Forest (free tier) |
| City | **Quaternius Downtown City MegaKit** — CC0, 315 models | Polyfork New York City (**Pro only**) |
| RTS | **Quaternius Ultimate Fantasy RTS** — CC0, 128 models, *"buildings in different evolution stages"*, plus rigged characters | — (nothing else qualifies) |

**The RTS gap is closed, and not by Polyfork.** The 2D research concluded no off-the-shelf Warcraft-like units exist in pixel art. Polyfork has none either — 0 catalogue results for soldier, warrior, orc, archer, spearman, troop, army, banner, catapult and barracks, and all 41 of its characters are Pro. Quaternius ships both the units and a building evolution ladder, under CC0.

**Polyfork's free tier is props, not Entities.** Measured across the whole 608-asset catalogue: of the free half, 231 are props and only 9 are buildings; there are **zero** free vehicles, characters or terrain. So the free tier can build the Forest Theme end to end (including Dead Tree and Tree Stump for the churn state) and cannot build the City or RTS Theme at all.

**Two corrections to standing assumptions:**

1. **The `.mjs` module is free for free assets.** The map and ticket 07 recorded "Pro adds the `.mjs` for runtime knobs". Measured: `tall-pine-tree-ab4108.mjs` returns 200 anonymously and exports a real `createAsset(opts)`; the Pro asset's module 404s. So the free/Pro fork is not "pre-baked versus runtime" — it is **"Forest at runtime, free" versus "City and RTS at all, paid"**.
2. **No single `tallness` knob spans a four-tier ladder.** The per-asset ranges are narrow (Young Pine 2.0–3.15 m, Tall Pine 6.4–9.6 m) with an unspanned gap between them. A four-tier ladder needs *chaining across assets plus knobs*: Young Pine @2.0 → Young Pine @3.15 → Tall Pine @6.4 → Tall Pine @9.6. Ticket 05 should treat "parametric rebuild" as options 2 **and** 3 combined.

**The question for tickets 05 and 07:** the CC0 route covers all three Themes at zero cost, zero licence risk, zero vendor dependency and zero bake budget, but every mesh is static. Polyfork's one unique asset is parametric rebuild. Recommendation: **CC0 as the shipping baseline; take the "rebuilt versus swapped" question to the prototype and buy Polyfork later, per Theme, only where the knob visibly wins.**

Two things left unverified, both cheap and both owned by later tickets: the exact evolution-stage count in Ultimate Fantasy RTS (ticket 10 should download and count), and Poly Pizza's terms (it blocked this environment with a 403).
