# MVP Spec — Isometric Stripe Dashboard

Assembled 2026-08-18 (ticket 12). Every section links to the ticket or ADR that
decided it; change a decision there, then update here. Decisions marked
**[veto]** were made autonomously with recommended defaults and await the
user's confirmation.

## 1. Vision

An app that renders a business's Stripe data as a living, isometric pixel-art
World: subscribers are trees (or buildings, or castles), payments are rain,
churn risk glows orange, and scrubbing the timeline replays the business's
whole history. End goal: public SaaS. First milestone: a personal tool.

## 2. Domain model

Glossary: [`CONTEXT.md`](../../CONTEXT.md) — Signal, Moment Signal, Timeline,
Risk Overlay, Subscriber, Size Tier, World, Entity, Theme.

- **ADR-0001** — Themes are skins over one generic Signal layer; they never read Stripe data.
- **ADR-0002** — Churn risk is a present-only overlay; the Timeline of Moment Signals is what scrubs. Forced by Stripe's 30-day event retention ([research 03](research/03-stripe-history.md)).
- **ADR-0003** — An Entity represents a Stripe customer (aggregated MRR), not a subscription.

The canonical Signal set, tier rules and mock-generator contract:
[ticket 04](issues/04-grilling-signal-set.md) **[veto]**. The shared
`foldWorldState` and the deterministic placement rule are reference-implemented
in the prototype (`prototypes/signals/mock-signals.js`) and are the
contract the production code re-implements 1:1 (with tests asserting parity).

## 3. The MVP is / is not

**Is:** one user (the developer) → then invite-ready SaaS; pasted restricted
read-only Stripe key; three themes (forest first); full-history timeline;
periodic refresh; live share link; demo mode.

**Is not** ([map](map.md) out-of-scope): pricing/monetization; free-form
AI-built dashboards; real-time webhook events; Stripe Connect OAuth (upgrade
path only).

## 4. Frontend

Stack: TypeScript, Next.js (Vercel), PixiJS 8 client-only via `next/dynamic`
(`ssr: false`) ([research 01](research/01-rendering-tech.md)).

- **Theme contract**: [`docs/theme-definition-template.md`](../../docs/theme-definition-template.md). A Theme receives folded World state + the Moment Signals in the animation window; page chrome is app-level.
- **Forest** (launch theme): proven in [ticket 05](issues/05-prototype-forest-world.md); look confirmed by the user (2026-08-18). Assets: **self-made pixel sprites** (user decision — no Evergrow purchase); the prototype's procedural set is the starting point and gets production polish (variants, shading, animation frames); zero third-party license constraints. Payment rain falls from a **warm-white cloud** (user-tuned; gold-glint drops were tried and rejected); the dark cloud is only for failed payments. Page layout: **variant B, "Ranger station"** (user verdict 2026-08-18) — framed world + stats header + subscriber roster with hover-highlight and click-to-center; variant C's diorama framing returns later as the share-link view.
- **City**: [ticket 08](issues/08-grilling-city-theme.md) **[veto]** — CC0 Town Pack, story-stacking growth.
- **RTS**: [ticket 09](issues/09-grilling-rts-theme.md) **[veto]** — buildings-only medieval, CC-BY (credits page required), units post-MVP.
- **Timeline**: proven in [ticket 06](issues/06-prototype-timeline.md) — day-stepped slider, ~6-months/sec replay, Today button; full fold per frame is fine at MVP scale; placement is prefix-stable by construction.
- **Mourning window**: churned Entities decay to a residue form after 90 days (theme template §2).

## 5. Backend ([ticket 11](issues/11-grilling-backend-architecture.md) **[veto]**)

Stack: Convex (DB + actions + cron), Better Auth (magic link + Google).

- Convex stores **derived Signals only** (`connections`, `signals`, `riskOverlay`, `subscriberMeta`, `shares`); no raw Stripe mirrors.
- Stripe key: AES-256-GCM app-layer encryption, master key in Convex env; plaintext only inside sync actions; never client-visible.
- Sync: backfill on connect (subscriptions `status=all` → invoices → charges, per [research 03](research/03-stripe-history.md)); incremental cron every 6 h; manual refresh throttled to 15 min. "Last synced X ago" chip.
- Share link: `/w/<slug>`, off by default, viewer sees World + timeline but never subscriber names; revenue numbers owner-toggleable, default hidden; `noindex`.

**Build order rule (standing):** all of §5 starts only after §4 runs fully on
the mock generator.

## 6. Onboarding & demo ([ticket 10](issues/10-grilling-onboarding-demo-customization.md) **[veto]**)

Landing (with live mock demo) → sign up → paste restricted key (checklist UI
from research 03 §4, `sk_` keys rejected) → first sync rendered as the World
growing → theme pick with previews from the user's own data → optional knobs →
World. `/demo` = mock-driven, theme-switchable, no account.

## 7. Milestones (frontend-first)

1. **M1 — App shell + forest on mock**: Next.js app, production port of the mock generator + fold (with parity tests against the prototype), forest theme with real Evergrow sprites, chosen page layout.
2. **M2 — Timeline**: scrubbing + replay in the app.
3. **M3 — Real data**: Convex, Better Auth, key connect flow, sync adapter (validated against the seeded test account, [ticket 07](issues/07-task-stripe-test-data.md)), personal-tool milestone reached.
4. **M4 — Share + demo + onboarding polish.**
5. **M5 — City + RTS themes** (each = fill the template + sprites; no data-layer work by construction).

## 8. Open items (need the user)

1. **Verdicts** — all in (2026-08-18): forest look lands; scrubbing feels good; page layout = **B, Ranger station**; payment rain = warm cloud, plain drops, no gold glint.
2. **Veto pass** — declined by the user (2026-08-18): the autonomous decisions in tickets [04](issues/04-grilling-signal-set.md), [08](issues/08-grilling-city-theme.md), [09](issues/09-grilling-rts-theme.md), [10](issues/10-grilling-onboarding-demo-customization.md) and [11](issues/11-grilling-backend-architecture.md) **stand as written**. The per-ticket veto lists stay in place; overrule any of them whenever, then update this spec.
3. **Purchases**: none for the forest (self-made sprites, user decision 2026-08-18); optionally Pixometric (~$2) for the RTS theme, decidable at M5.
4. **Stripe seed run**: `bash tools/stripe-seed/setup-wizard.sh` — **not needed until M3** (M1/M2 run entirely on the mock generator); run it when the sync adapter work starts. Ticket 07 resolves when its validation passes.
5. **Product name and branding** — never charted; naming is taste.
