# Grilling: free tier or paid, and which plan

Type: grilling
Status: resolved
Blocked by: 01, 03, 05

## Question

Which plan does the chosen asset source get used on, and what does the answer cost in architecture?

Only decidable once ticket 01 names the source, ticket 03 clears the licence, and ticket 05 says how many variants exist.

If the source is Polyfork, the fork is real (verified 2026-08-18):

- **Anonymous / free account** — 307 of 608 assets, all under 600 triangles. GLB and `.mjs` links need no key. The public GLB of a static asset is one joined anonymous mesh: no named parts, no detachables. Remix bakes: 40/hour and 100/month anonymous; 100/hour and 300/week with a free account. Every variant must be baked ahead of time through an HTTP round trip.
- **Pro** — $10/month, $99/year, or **$100 one-time Founders Club** (47 of 100 seats left on 2026-08-18, so this option can disappear). Adds the full catalogue, the `createAsset()` `.mjs` program so knobs evaluate in our own engine at runtime, structured GLB with named parts and real normals, a per-account CDN path, and 900 bakes/hour with no weekly cap.

Settle:

1. **Which plan.** Note that free coverage is uneven per Theme: Nature & Forest 36/58 free, but Spaceship Wars only 3/18.
2. **Whether runtime knobs are load-bearing.** If ticket 05 chose pre-baked variants, Pro's `.mjs` buys less. If the product ever wants a per-subscriber colour or shape, free cannot do it without a bake per subscriber.
3. **The lock-in trade.** A CC0 source (if ticket 01 ranks one close) costs nothing and never expires. Paying for parametric knobs is only worth it if the knobs are actually used.
4. **When to buy.** The Founders Club is one-time and finite. Buying before the gate (ticket 08) risks $100 on a pivot that may not land; buying after risks the seats being gone.

Consult `mattpocock-skills:grilling`. Record the answer as a decision with a date and a price, so ticket 11 can put it in the spec.

## Update — the question changed (2026-08-19)

Tickets 01 and 03 are resolved, and both premises above are now wrong.

**Correction 1 — the `.mjs` is free for free assets.** Measured: `tall-pine-tree-ab4108.mjs` returns 200 anonymously and exports a real `createAsset(opts)` that clamps against `params`; the Pro asset's module 404s. Point 2 above ("whether runtime knobs are load-bearing") is therefore not a free-versus-Pro question for the Forest Theme at all. What Pro actually buys is `.mjs` access to *paid* assets.

**Correction 2 — the free tier holds no Entities outside Forest.** Of Polyfork's free half: 231 props, 9 buildings, **0** characters, **0** vehicles, **0** terrain. The free/Pro split is not "pre-baked versus runtime". It is **"Forest at runtime, free" versus "City and RTS at all, paid"**.

**Correction 3 — the CDN is the wrong reason to buy Pro.** Ticket 03 recommends vendoring and self-hosting on any plan, because Polyfork's CDN carries no SLA, no uptime commitment and no published bandwidth cap, and a share link is designed to spread.

**Correction 4 — the baseline is not "nothing", it is CC0.** Kenney and Quaternius cover all three Themes free, permanently, with no licence email, no vendor and no bake budget. Quaternius is the *only* source that fields RTS units at all.

So the question this ticket now answers is not "which Polyfork plan". It is:

> **Do we buy Polyfork at all, and if so for which Theme?** Its one unique offering is parametric rebuild. Everything else — coverage, licence safety, cost, availability — favours CC0.

Sub-questions that survive: if we do buy, is it the $100 one-time Founders Club (finite, 47 seats left on 2026-08-18) or $99/year? And do we still create a **free Polyfork account** regardless, since the free tier's Forest assets and the 300-bakes-per-week budget cost only an email address?

One thing that did *not* change: colour-only knobs cannot be pre-baked into a GLB. If a Theme's customization is colour-based, that path needs the module.

## Comments

**2026-08-20 — answered upstream by [ticket 05](05-grilling-size-tier-geometry.md).** This ticket asks which Polyfork plan. The answer is **none**.

Ticket 05 settled two things that between them close it:

1. **One growth mechanism for all three Themes.** Parametric rebuild exists only at Polyfork, which fields zero RTS units and keeps every City building behind Pro. Rebuild could never be universal, so the universal mechanism is the swap.
2. **A Size Tier is swapped, not rebuilt.** ADR-0003 makes Size Tier four MRR quantile *buckets*. There is no continuum for a knob to express, so the parametric rebuild — Polyfork's one unique asset, and the only thing worth paying for — renders in-between geometry that nothing ever asks for.

The CC0 route (Kenney for Forest, Quaternius for City and RTS) ships all three Themes at zero cost, zero licence risk, zero vendor dependency and zero bake budget. The Founders Club seats can go; nothing here depends on them.

Left open rather than resolved — closing it is the user's call, since it was chartered as a spending decision.

## Answer

Resolved 2026-08-24. User delegated the decision ("ik volg al jouw aanbevelingen").

### We buy nothing. **Polyfork spend: €0. No plan, and no free account either.**

The upstream comment of 2026-08-20 already answered *which plan* — none. What was left was the spending confirmation and two sub-questions. Both close the same way.

**Founders Club vs annual: neither.** The $100 one-time seat is only worth holding if parametric rebuild is ever wanted, and ticket 05 removed the thing it would rebuild: a Size Tier is four MRR quantile buckets (ADR-0003), so there is no continuum for a `tallness` knob to express. A knob that renders in-between geometry nothing asks for is not an asset. Let the seats go — this decision does not become more expensive if it is ever reversed, because a reversal would be a fresh sourcing effort, not a resumed subscription.

**No free account either.** The free tier's two offerings are now both dead. The bake budget (300/week) is worth exactly zero because ticket 05 set the bake budget to zero — the Kenney ladder ships as fixed GLBs and nothing is generated. And the free Forest assets are redundant against Kenney, which is CC0, already downloaded, 3–10× lighter in triangles (16–230 vs 300–620), and one artist's single palette across all three Themes. Creating the account costs only an email address, but it also costs a credential to hold and a vendor in the dependency story for a benefit that is currently nil. If ticket 08 turns out to want a variant Kenney lacks, the account takes two minutes to create then, and nothing about that path is closed now.

**The last live thread is cut by ticket 06.** This ticket recorded one surviving worry: *"colour-only knobs cannot be pre-baked into a GLB. If a Theme's customization is colour-based, that path needs the module."* [Ticket 06](06-grilling-signal-vocabulary-3d.md) makes every colour in the Theme a `setColorAt` multiply in our own renderer — health state, risk severity, churn decay, cloud and spark identity. Colour never touches the asset pipeline at all, so there is no colour-knob path that needs Polyfork's `.mjs`.

### Consequences

- Ticket 03's five shipping conditions (the licence email to `hello@polyfork.dev`, vendoring the GLBs, never shipping a `-preview.glb`, baking with a free-account key, exposing no files as files) **all lapse**. Nothing in the product touches Polyfork.
- The asset story for ticket 11 is one line: **CC0 throughout — Kenney Nature Kit for Forest, Quaternius for City and RTS. No licence email, no attribution requirement, no vendor, no expiry, no recurring cost.**
- This also removes the CC-BY credits page the 2D effort's RTS decision required. Quaternius is CC0, so the RTS Theme no longer forces attribution UI into the product.

### What would re-open this

Only ticket 10 (RTS in 3D) finding that Quaternius' 128-model Ultimate Fantasy RTS pack cannot field units after all. That is a sourcing failure, and it would be a fresh sourcing question against the whole CC0 field — not a return to this plan comparison.
