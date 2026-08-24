# Research: Polyfork licence and asset delivery in a shipped build

Type: research
Status: resolved
Blocked by: —

## Question

If Polyfork wins ticket 01, may we actually ship its assets in a public SaaS, and how do the files reach the browser?

The licence says: *"Use in commercial projects, no attribution. No redistribution of the files themselves. No using them to build or train a commercial 3D asset generator."* A web app must serve the GLB bytes to every visitor. That is either normal use or redistribution, and the answer decides the whole delivery design.

Answer:

1. **Is serving GLBs from our own origin allowed?** Read https://polyfork.dev/licensing in full. If the text is ambiguous, say so and draft the exact question to send Polyfork — do not guess.
2. **Delivery options and what each requires.** Committing GLBs into the repo; serving them from our own CDN; hotlinking Polyfork's public `/cdn/` path (free assets need no key); the per-account `/c/<token>/` path Pro adds. Record the rate limits, caching behaviour, and failure mode of each.
3. **The remix bake budget as a build-time dependency.** Free: 40 bakes/hour, 100/month anonymous; 100/hour and 300/week with a free account; Pro raises it to 900/hour and drops the weekly cap. Baked variants are cached globally and cost nothing to re-fetch. If Size Tiers become pre-baked variants (ticket 05), how many bakes does a full build need, and does that fit?
4. **Lock-in.** If Polyfork goes away, do the already-downloaded GLBs remain usable under the licence? Does Pro's "anything you download stays yours forever" claim cover a lapsed subscription?
5. **The `/demo` and share-link paths.** Both serve Worlds to anonymous visitors. Confirm nothing about them changes the answer.

Write findings to `.scratch/lowpoly-3d-pivot/research/03-polyfork-licence-delivery.md`. End with a clear verdict: safe to ship, safe with conditions, or blocked pending an answer from Polyfork.

## Answer

Findings: [`research/03-polyfork-licence-delivery.md`](../research/03-polyfork-licence-delivery.md) (2026-08-18).

**Verdict: safe with conditions.** Nothing here blocks the pivot or the gate.

The licence names "websites" and "products you sell" as permitted uses, and the pricing FAQ explicitly disclaims any intent to keep files behind Polyfork's CDN ("not to keep the files away from you"). One clause stays ambiguous for a web app — *"no offering them through tools that hand the files to other people"* — because a browser necessarily receives an intact, addressable GLB. The reading that we are permitted is inference, not text; the licence itself says "ask us before you ship". A ready-to-send email to `hello@polyfork.dev` is drafted in §2 of the findings.

Five conditions, in priority order:

1. **Send the §2 email before public launch** — not before the prototype or the gate.
2. **Vendor the GLBs and serve them ourselves.** Hotlinking Polyfork's CDN puts a third party with no SLA, no uptime commitment and no published bandwidth cap in the request path of a paying customer's dashboard. Vendoring also pins the approved look against upstream rebuilds.
3. **Never ship a `-preview.glb` of a `free: false` asset** without Pro. Trap: paid assets' previews are publicly fetchable at full fidelity (`birch-tree-181b33-preview.glb` → 200, 619 triangles, anonymous), so shipping a Pro asset by accident is trivially easy.
4. **Bake with a free-account key and commit the output.** The anonymous bake budget is shared, not ours — the counter was observed dropping without our requests.
5. **Expose no files as files** — no download button, no asset browser, no export. That is the line the licence actually draws.

Three findings that change other tickets:

- **The bake budget is a build-time cost, never a runtime cost.** A new bake costs 1; re-fetching any variant anyone has ever baked costs 0. A full three-Theme build is ~72 bakes. Anonymous (100/month) is too tight for iteration; a free account (300/week) clears it comfortably. → tickets 05, 07.
- **The CDN is the wrong reason to buy Pro.** We should self-host on any plan. → ticket 07.
- **Colour knobs cannot be pre-baked into a GLB at all.** Only knobs marked `affects: geometry` produce a distinct file; a colour-only variant returns the default-paint preview with a note saying to use the module. So on the free path, customization is limited to geometry knobs and a fixed set of baked variants. → ticket 07.
- **Baked variants carry no vertex NORMALs** (published GLBs do). three.js computes flat normals, which is the right look for flat-shaded low-poly — but a baked tier variant and a published default are not equivalent inputs. Do not mix them in one scene unchecked. → ticket 05.

**Lock-in is availability risk, not licence risk.** The licence is explicit that downloaded files stay yours permanently "whether you cancel, let a card lapse, or we stop selling subscriptions entirely". Vendoring reduces the exposure to zero.

## Comments

**2026-08-20 — superseded by [ticket 05](05-grilling-size-tier-geometry.md).** That ticket settled that a Size Tier is *swapped*, not *rebuilt*, and that the Forest Theme uses Kenney's CC0 Nature Kit. Polyfork is therefore not used at all.

Every condition this research imposed lapses:

- the licence email to `hello@polyfork.dev` — not needed
- vendoring the GLBs instead of leaning on Polyfork's CDN — moot
- never shipping a `-preview.glb` of a paid asset — moot
- baking with a free-account key and committing the output — the bake budget is **zero**
- vendor-survivability exposure — gone; CC0 has no vendor and no revocation

The findings stand as an accurate record of a path not taken. Do not delete: if a future effort re-opens parametric geometry, the licence analysis is still the answer.
