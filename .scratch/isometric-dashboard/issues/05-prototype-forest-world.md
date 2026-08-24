# Prototype: the forest World

Type: prototype
Status: resolved
Blocked by: 01, 02, 04

## Question

Build a throwaway prototype of the forest World rendered from mock Signals, using the chosen rendering tech and assets. Does the look and feel land — isometric, pixelated, alive, "Pokémon-like"?

Proves the Entity mapping: subscriber = tree, size = MRR, orange = churn risk, dead tree = churned, rain = payments. The outcome doubles as the **theme-definition template** the city and RTS themes will follow (that fog graduates when this closes).

## Answer

Built at `prototypes/forest-world/` — open `index.html` in a browser, no build step. Hosted copy: https://claude.ai/code/artifact/27f15c28-493b-4470-9186-3889ff59b8df Three structurally different page variants around one PixiJS renderer core (`?variant=`, switcher bar at the bottom): **A Overworld** (full-bleed world, game-dialog HUD), **B Ranger station** (framed world + subscriber roster with hover-highlight and click-to-center), **C Diorama** (night share-card with a big MRR counter). Screenshots in `prototypes/forest-world/screenshots/`.

**Proven:**

- The full Entity mapping renders and reads: tree = Subscriber, 4 growth stages = Size Tiers, orange/deep-orange = at-risk warning/critical, grey dead tree = churned, rain = payment landed, dark cloud = payment failed, sparkle = new subscriber. Hover gives the subscriber card.
- The whole Theme runs on the ticket-04 mock generator + shared `foldWorldState`; the renderer never sees a Stripe shape (ADR-0001 holds in practice).
- Deterministic placement works (center-out cells, probe from `hash(subscriberId)`, assign in appearance order) — placement at any past time is a prefix of today's placement, which is exactly what ticket 06 needs.
- Presets stress the degenerate worlds: `singlePlan`, `tiny`, `churnWave`, `crowded` (500+ subscribers stays smooth).

**Learned (fed back into the spec):**

- Tier quantiles must use distinct MRR values, plus a single-plan fallback to Tier 2 — ticket 04 amended.
- A 3-year SaaS at 3%/mo churn has more dead trees than live ones; a raw render is a graveyard. New theme rule: the **mourning window** — churned = standing dead tree for 90 days, then a stump. Recorded in the template.
- Page chrome (HUD/roster/share framing) is app-level, not Theme-level; the Theme ends at the canvas edge.

**Deliverable:** the theme-definition template now exists at `docs/theme-definition-template.md` — the city and RTS themes fill in its 8 sections.

**Caveats:** sprites are procedural placeholders drawn on Evergrow's 32×16 iso grid (the $5 pack purchase is a human step; swapping in real art is a texture swap). And the core question — "does it land, is it Pokémon-like alive?" — needs your eyes: this session can only verify that it renders and reads. If the vibe is off, the variants are cheap to reshape.

## Comments

**2026-08-18 (user):** page-layout verdict is in — **variant B, Ranger station** (framed world + stats header + roster). B becomes the MVP page layout; A and C stay in the prototype as reference. The look-and-feel verdict on the forest itself is still open.

**2026-08-18 (user, later):** forest look **lands** ("gaaf"). One doubt: the payment rain cloud reads slightly negative. Tweak applied the same day: payment rain got a warm-white cloud plus gold-glint drops; the dark cloud stays reserved for failed payments. **User follow-up:** the gold glints are unnecessary — reverted. Final state: plain blue rain from a warm-white cloud; dark cloud = failed payment only.

**2026-08-18 (user, asset decision):** Evergrow will **not** be purchased. The self-made procedural sprites are promoted from placeholder to the real asset direction — production quality comes from iterating on them (more variants, richer shading, animation frames). Consequence: the forest theme has zero third-party license constraints.
