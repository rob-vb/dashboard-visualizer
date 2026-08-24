# Wayfinder map: Isometric Stripe Dashboard

Label: wayfinder:map

## Destination

A build-ready MVP spec for an app that renders a user's Stripe data as a living, isometric pixel-art world (forest / city / RTS themes). Public SaaS is the end goal; the first milestone is a personal tool. Building the app starts as a separate effort after this map closes.

**2026-08-18: destination reached, pending review.** The spec is assembled at [`spec.md`](spec.md). Tickets 04 and 08–11 were resolved autonomously with recommended defaults — spec §8 lists what still needs the user. Later the same day: prototype verdicts came in (look lands, scrubbing good, layout B, self-made sprites, rain tuned) and the user declined the veto round — the autonomous decisions stand. Only remaining human step: the Stripe seed run, needed at M3 (ticket 07). **The map is closed.**

> **Successor effort (2026-08-18):** [`.scratch/lowpoly-3d-pivot/map.md`](../lowpoly-3d-pivot/map.md) re-opens the render and art decisions — a gated pivot from 2D pixel-art sprites to low-poly 3D. Until that map's gate passes, everything below stands.

## Notes

- Domain language lives in `CONTEXT.md` (World, Entity, Signal, Theme). ADR-0001 fixes the generic Signal layer: themes are skins, they never read Stripe data directly.
- Stack (decided): TypeScript, Next.js, Vercel, Convex (DB), Better Auth, PixiJS 8 for rendering (see Decisions so far).
- Standing preference: **frontend first**. All visuals run on a mock Signal generator before any backend work starts. Backend tickets stay in the fog until the frontend is proven.
- Themes at launch: forest, city, RTS/game style (Warcraft-like). Customization is light and cosmetic only (e.g. palette, season, day/night).
- Stripe access in the MVP: pasted restricted read-only key, stored encrypted. Stripe Connect OAuth is the later upgrade path.
- No real-time events in the MVP; periodic refresh. Timeline scrubbing with full history is in scope. A live shareable link is in scope.
- The user's own Stripe account is nearly empty; [Task: seed Stripe test data](issues/07-task-stripe-test-data.md) covers test data. Tooling is ready at `tools/stripe-seed/` — **human step**: run `bash tools/stripe-seed/setup-wizard.sh` (paste two test-mode keys); the ticket resolves when its validation passes.
- Skills to consult per ticket type: `mattpocock-skills:prototype` for prototype tickets; `mattpocock-skills:grilling` + `mattpocock-skills:domain-modeling` for grilling tickets; `frontend-design` and `dataviz` when building visuals.

## Decisions so far

<!-- one line per closed ticket: gist + link -->

- [Task: assemble the MVP spec](issues/12-task-spec-assembly.md) — the destination deliverable, assembled at [`spec.md`](spec.md): vision → domain → frontend → backend → onboarding → frontend-first milestones M1–M5 → open items needing the user.
- [Research: rendering technology for the isometric World](issues/01-research-rendering-tech.md) — PixiJS 8, loaded client-only via `next/dynamic` (`ssr: false`), optionally with `@pixi/react`; best fit on depth sorting, animation/scrubbing, and sprite performance. Three.js only if true 3D ever enters the roadmap.
- [Research: isometric pixel-art asset packs and licenses](issues/02-research-asset-packs.md) — forest: Evergrow ($5, 4-stage tree growth; no dying state yet) + CC0 rain; city: Town Pack (free, CC0), stackable buildings as growth; RTS: Medieval Pixel Art Tiles (CC-BY 4.0) for terrain/buildings, but **no off-the-shelf Warcraft-like units exist** — commission, pivot to sci-fi, or go buildings-only. Prefer CC0/CC-BY; re-atlas custom-licensed sprites.
- [Grilling: backend architecture, share link, refresh cadence](issues/11-grilling-backend-architecture.md) — Convex stores derived Signals only (no raw Stripe mirrors); key encrypted app-side (AES-256-GCM, master key in Convex env); sync = backfill on connect + 6-hour cron + throttled manual refresh; share link = owner-toggleable public slug showing the World but never subscriber names, revenue visibility an owner choice. Spec-level only; build order stays frontend-first.
- [Grilling: onboarding flow, demo mode, customization](issues/10-grilling-onboarding-demo-customization.md) — landing page doubles as the live mock-driven demo (`/demo`); sign up (magic link + Google) → paste restricted key (checklist from research 03 §4) → first sync rendered as the World growing → theme pick with previews from the user's own data → knobs in a paintbrush popover on the World.
- [Grilling: the RTS Theme](issues/09-grilling-rts-theme.md) — asset strategy: **buildings-only medieval** on crabcrabcrabs CC-BY (+ optional Pixometric); units post-MVP; "Your kingdom": tent→castle tiers, fire = critical risk, burnt ruin → rubble; credits page required (CC-BY).
- [Grilling: the City Theme](issues/08-grilling-city-theme.md) — "Your block of town" on the CC0 Town Pack: story-stacking = growth tiers, FOR SALE/boarded = risk, abandoned building → rubble lot; risk noted: pack lacks roads/terrain (DIY filler tiles).
- [Prototype: timeline scrubbing and deterministic layout](issues/06-prototype-timeline.md) — timeline added to the forest prototype (slider + 6-months/sec replay + Today); deterministic placement proven by construction and by test (placement at past T is a prefix of today's); full-fold-per-frame stays smooth at MVP scale; risk overlay correctly vanishes in the past. "Magical?" verdict awaits the user.
- [Prototype: the forest World](issues/05-prototype-forest-world.md) — built at `prototypes/forest-world/` (open `index.html`): three page variants (Overworld / Ranger station / Diorama) on one PixiJS core driven by the mock generator; full Entity mapping renders incl. rain, risk oranges, dead trees + 90-day "mourning window" → stumps; theme-definition template extracted to `docs/theme-definition-template.md`; user verdicts 2026-08-18: forest look **lands**, page layout = **variant B (Ranger station)**, sprites stay **self-made** (no Evergrow purchase, no license constraints); payment rain tuned after user feedback (warm cloud, plain drops; gold glint tried and reverted).
- [Grilling: the canonical Signal set and the mock generator](issues/04-grilling-signal-set.md) — Signals split into a scrubable **Timeline of Moment Signals** (appeared/grew/shrank/churned/returned/payment received/failed) and a present-only **Risk Overlay** (ADR-0002); Entity = Stripe customer with aggregated MRR (ADR-0003); size = 4 MRR quantile tiers; mock generator is a pure seeded function (params: seed, now, growth curve, plan mix, churn/failure rates) sharing one `foldWorldState` with the real adapter. Resolved autonomously — assumptions listed in the ticket for veto.
- [Research: reconstructing business history from the Stripe API](issues/03-research-stripe-history.md) — feasible: rebuild full history from persisted objects (subscriptions `status=all`, invoices, charges), never from the 30-day event stream; churn-risk comes from live fields; ~750–1,100 calls for a 1,000-subscriber/3-year sync; only invoice-less plan changes and status flaps older than 30 days are unrecoverable.

## Not yet specified

- **Product name and branding** — never charted; pure taste, needs the user.
- *(Everything else graduated into tickets 08–12; see Decisions so far and [`spec.md`](spec.md).)*

## Out of scope

- **Pricing / monetization** — a separate effort once the product exists (decided while charting).
- **Free-form AI-agent-built dashboards** — replaced by fixed themes + light customization; may return as a fresh effort.
- **Real-time events in the MVP** ("it rains the moment a payment lands") — periodic refresh instead; webhooks are post-MVP.
- **Stripe Connect OAuth in the MVP** — the spec notes it as the upgrade path only.
