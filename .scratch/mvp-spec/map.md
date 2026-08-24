# Map: Isometric Stripe Dashboard — MVP Spec

Label: wayfinder:map

> **Note (2026-08-18):** the active map for this effort is
> [`.scratch/isometric-dashboard/map.md`](../isometric-dashboard/map.md).
> That map reached its destination; the spec lives at
> [`.scratch/isometric-dashboard/spec.md`](../isometric-dashboard/spec.md).
> This file is the older charting output and is kept for reference.

## Destination

A build-ready MVP spec for an app that renders a user's Stripe data as a living, isometric pixel-art world (Pokémon-like "3D" pixel style). The map is done when every decision the spec needs is made and the spec can be assembled and handed off to a build effort.

## Notes

Standing decisions from the charting session (2026-08-18):

- **Product**: public SaaS as end goal; first milestone is a personal tool. Three fixed launch themes: forest, city, game/RTS (Warcraft-3-like). Light cosmetic personalization only (e.g. palette, season, day/night). Live shareable link of your world is in scope. No real-time events in the MVP — periodic refresh; the timeline ("scroll back in time") IS in scope, full history as the goal.
- **Domain model**: one generic layer. The data layer emits **Signals**; a **Theme** is a skin that renders a **World** with one **Entity** per subscriber. See `CONTEXT.md`.
- **Stack**: TypeScript, Next.js, Vercel, Convex (DB), Better Auth. Stripe access in MVP: pasted restricted read-only key; Stripe Connect is the later upgrade path. Art comes from existing asset packs.
- **Ordering rule (user requirement)**: **frontend first.** All visuals run on a mock data generator before ANY backend work (Convex, auth, Stripe sync) starts.
- **Skills to consult**: `mattpocock-skills:prototype` for prototype tickets; `frontend-design:frontend-design` for visual work; `mattpocock-skills:grilling` + `mattpocock-skills:domain-modeling` for decision tickets.
- This repo is not a git repository; the local-markdown tracker in `.scratch/` is canonical. Research findings live under `.scratch/mvp-spec/research/`.

## Decisions so far

<!-- one line per closed ticket: gist + link -->

## Not yet specified

- **City and RTS theme prototypes** — after the forest prototype proves the Signal→visual contract, the same question repeats per theme (what is an Entity here, what does rain/churn look like).
- **Personalization options per theme** — which cosmetic knobs (palette, season, day/night) each theme exposes; only decidable once theme prototypes exist.
- **Onboarding flow** — the exact steps (sign-up → connect Stripe → pick theme → personalize), plus a demo mode driven by the mock generator.
- **Timeline UX** — scrubbing controls, playback, and deterministic entity placement so an Entity keeps its spot across time.
- **Shareable link** — URL model, privacy, what a viewer sees; depends on backend decisions.
- **Backend architecture** — Convex data model, encrypted key storage, sync cadence, Better Auth integration; deliberately last per the frontend-first rule.
- **Stripe Connect upgrade path** — detail only matters once the SaaS milestone nears.
- **Product name and branding.**
- **Spec assembly** — the closing ticket that compiles all decisions into the build-ready spec.

## Out of scope

- **Pricing / business model** — separate effort after the product exists.
- **Free-form AI-agent-built dashboards** — ruled out in charting; fixed themes won.
- **Real-time events (webhooks) in the MVP** — periodic refresh instead; real-time is a post-MVP upgrade.
