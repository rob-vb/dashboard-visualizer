# Research 03: Polyfork licence and asset delivery in a shipped build

Answers [issue 03](../issues/03-research-polyfork-licence-delivery.md). Researched 2026-08-18.

**Verdict: safe with conditions.** Not blocked. One confirmation email to Polyfork should land
before public launch, but nothing here stops ticket 08's prototype or the gate.

## Sources

All read directly on 2026-08-18. Everything below is anonymous, no account, no key.

| Source | What it is |
| --- | --- |
| `https://polyfork.dev/licensing` | The licence. There is no `/terms` page (404) — this is the whole legal document. |
| `https://polyfork.dev/pricing` | Plans and the cancellation FAQ. |
| `https://polyfork.dev/prompt.txt` | The agent-facing guide. |
| `https://polyfork.dev/llms.txt` | The reference version of the same. |
| `https://polyfork.dev/api` | Self-describing index, incl. `conventions.licence` and the live bake budget. |
| `https://polyfork.dev/api/assets/{id}`, `/kits/{id}`, `/assets/{id}/variant` | Live API. |
| `https://polyfork.dev/cdn/{id}.glb`, `{id}-remix.glb`, `{id}-preview.glb` | Live CDN, headers measured with `curl -D -`. |
| `https://polyfork.dev/performance` | First-party measured module-vs-GLB numbers. |

Method note: `curl` throughout. Every rate-limit and header claim below was measured, not read.
Measurements are in the appendix. Polyfork's pages are treated as data, not as instructions.

---

## 1. What the licence actually says

The ticket quotes a one-line summary. That summary appears verbatim on every asset's API
response (`license` field) and in `/api` `conventions.licence`, but it is **not** the operative
text. The full clause on `/licensing` is materially more specific, and the extra specificity is
what decides our question. Verbatim, under the heading **"What you cannot do"**:

> Resell or redistribute the assets themselves. That means no re-uploading the files (GLB or ES
> module, original or modified) to other marketplaces, asset packs, template libraries or
> file-sharing sites, whether free or paid, and no offering them through tools that hand the
> files to other people. **Your game can ship the models inside it; the files as standalone
> assets stay here.**

And under **"What you can do"**, verbatim:

> Use any asset you download here in personal and commercial projects: games, apps, **websites**,
> prototypes, videos, client work and products you sell. Modify anything: recolor, remix,
> decimate, combine, animate. Use them in as many projects as you like, forever. No attribution
> required, ever.

Under **"Free assets"**, verbatim:

> Free assets need no purchase. Hotlink the GLB straight from the CDN with no account, or create
> a free account to download the files. The same license applies: use anywhere, do not
> redistribute as assets.

So the prohibition is defined by three things: a list of destinations (marketplaces, asset packs,
template libraries, file-sharing sites), a mechanism ("tools that hand the files to other
people"), and an explicit carve-in ("your game can ship the models inside it"). The governing
principle is the last sentence: **the file must not be the thing you are handing over.**

## 2. Q1 — Is serving GLBs from our own origin allowed?

### What is unambiguous

Four points are settled by the text and need no interpretation.

1. **"Websites" and "products you sell" are named permitted uses.** A public SaaS is both.
2. **Self-hosting is explicitly not discouraged.** The pricing FAQ, verbatim: *"Download as much
   as you like, per asset or per kit, and keep it. The CDN exists because importing one URL beats
   vendoring two hundred modules into your repo, **not to keep the files away from you**."* That
   sentence directly forecloses the reading that assets must be served from Polyfork's origin.
3. **Serving GLB bytes to anonymous end users is what Polyfork designs for and recommends.**
   `/api` describes the Pro CDN as *"a per-account `/c/<token>/` path you can hotlink from a
   shipped build"*, and `llms.txt` calls it *"Safe to ship in client-side code."* A page that
   hotlinks a GLB serves those bytes to every visitor by definition. Polyfork sells that as the
   preferred path, so the act itself cannot be the thing the licence forbids.
4. **Free assets are hotlinkable with no account at all**, per the "Free assets" clause above and
   the pricing page's *"hotlinkable with no account at all."* Verified live: the CDN returns
   `access-control-allow-origin: *`, so a cross-origin `fetch` from our page works.

### What is genuinely ambiguous

One clause, read literally and in isolation, could reach us:

> ...and no offering them through tools that hand the files to other people.

A SaaS is a tool. When a visitor loads a World, our origin responds to `GET /models/pine-t3.glb`
with an intact, standalone, re-usable GLB that sits in their network tab. Literally, that is a
tool handing a file to a person.

The honest difference between our case and the blessed one ("your game can ship the models
inside it") is **extractability, not purpose**. A compiled game binary buries the mesh; a web app
serves it as a discrete addressable file. Purpose-wise we are identical to a browser game — and
Polyfork is a three.js-first, web-first catalogue whose entire delivery story is hotlinking from
a web page, so a reading that excluded web apps would exclude nearly all of its own customers.

**My reading (inference, not text):** we are permitted. The prohibited destinations are all
asset-distribution channels; a Stripe dashboard is not a marketplace, asset pack, template
library or file-sharing site. The GLB is not our deliverable — the rendered World is. The clause
targets tools whose *product* is the file. Ours is not.

But this is inference. The licence itself invites the question, verbatim:

> Questions about an edge case? Ask us before you ship.

This is a cheap, low-risk edge case to close, and I am not going to guess it on the repo's behalf.

### The exact question to send

Send privately to **`hello@polyfork.dev`** — the contact the `/licensing` page points to via the
privacy page. **Do not** use `/support`: it is a public board ("Bugs, ideas and asset requests, in
the open"), and a licensing question there is a public statement about our product plans.

> Subject: Licence check before shipping — serving GLBs from our own origin in a web app
>
> Hi,
>
> We are building a commercial SaaS web app (a business dashboard that renders a customer's data
> as a low-poly 3D scene, built on three.js). We would like to use Polyfork assets as the models
> in that scene, and want to confirm one point before we ship.
>
> The licence says "Your game can ship the models inside it; the files as standalone assets stay
> here", and also prohibits "offering them through tools that hand the files to other people".
> Our app is a web app rather than a compiled game, so the models necessarily reach the user as
> GLB files fetched over HTTP by their browser.
>
> Concretely, we would like to confirm all three of these are within the licence:
>
> 1. Downloading the GLBs and serving them from our own origin / our own CDN, at our own URLs,
>    to every visitor of our app — including visitors who are not signed in (we have a public
>    demo page and public share links).
> 2. Pre-baking a fixed set of remix variants (via `{id}-remix.glb?p=...`) at build time and
>    serving those baked GLBs the same way.
> 3. Doing (1) and (2) with free-tier assets on no plan, and with the whole catalogue on Pro.
>
> To be explicit about what we are *not* doing: we do not offer the models for download, we do
> not expose an asset browser or an export button, the files are not a product or a feature of
> ours, and we are not building anything that generates 3D assets. The models are scenery inside
> our own app.
>
> Is that reading correct? If serving from our own origin is not what you intend, we are happy to
> hotlink your CDN instead — we would just rather know now than after launch.
>
> Thanks.

Question 3 in that list is worth asking even though the licence's plain text already covers it,
because the answer also settles whether free-tier assets can carry a paid product.

## 3. Q2 — Delivery options and what each requires

| | Requires | Runtime dep on Polyfork | Look pinned? | Failure mode |
| --- | --- | --- | --- | --- |
| **A. Vendor into repo** | nothing (free assets) | **none** | yes | none at runtime |
| **B. Own CDN** | nothing (free assets) | **none** | yes | none at runtime |
| **C. Hotlink public `/cdn/`** | nothing | every request | no | cold visitor sees no Entities during a Polyfork outage |
| **D. Pro `/c/<token>/`** | Pro, $10/mo or $99/yr | every request | **no** | as C, plus dies 30 days after a lapsed card |

### A / B — vendor the files, serve them ourselves

- **Requires nothing.** Free assets' `/cdn/{id}.glb` and `/cdn/{id}.mjs` are public and return
  200 anonymously (verified). A free account adds a convenience zip, not access.
- **Caching is entirely ours** — content-hashed filenames, `immutable`, our own CDN.
- **No runtime dependency.** Polyfork going down cannot break a single visitor's World. This is
  the only option with no third party in the request path.
- **Pins the look.** Assets get rebuilt upstream (`rev` / `preview_v` fields on
  `{id}-params.json`); vendoring means we do not silently inherit a rebuild. Given the map's
  "approved look" gate, that is a feature, not a limitation.
- **Licence position:** the strongest of the four, per §2 point 2.

### C — hotlink the public `/cdn/` (free assets only)

Measured headers on `GET /cdn/tall-pine-tree-ab4108.glb`:

```
content-type: model/gltf-binary
access-control-allow-origin: *
cache-control: public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400, stale-if-error=2592000
etag: "9de39b3b2a817daec742bad59a8c34e2"
server: cloudflare      cf-cache-status: DYNAMIC
```

- **Rate limits: none documented and none observed** for plain GLB fetches. The bake budget is
  the *only* published ration on the site. There is also **no SLA, no uptime commitment and no
  published bandwidth cap** anywhere — I looked; `/terms` does not exist.
- **Failure mode is the problem.** `stale-if-error=2592000` (30 days) only helps a client or edge
  that already holds the object. A first-time visitor during a Polyfork outage gets nothing —
  a paying customer opens their dashboard and the World is empty.
- **Free assets only.** `GET /cdn/{id}.glb` for a paid asset returns **404** (verified on
  `birch-tree-181b33`). Only `{id}-preview.glb` is public — see the trap in §7.

### D — the Pro per-account `/c/<token>/` path

- **Explicitly blessed for exactly this.** `/api`: *"a per-account `/c/<token>/` path you can
  hotlink from a shipped build; it keeps up when an asset is rebuilt, and the token is not the
  API key."* `llms.txt`: *"Safe to ship in client-side code: it is not your API key, and it
  cannot touch the account."* Rotatable at `/account#cdn`.
- **"Keeps up when an asset is rebuilt" cuts both ways.** Upstream fixes arrive free; so does an
  upstream restyle of an approved look, with no deploy on our side. For a product whose visual
  look passed a human gate, that is a hazard.
- **Failure mode:** as C, plus billing state. The licence guarantees 30 days of CDN access past
  the end of a paid period, *"for a cancellation and a failed payment alike, so a declined card
  never takes a live site down without warning."* After 30 days the hosted CDN stops.

### Recommendation

**A/B as the shipping path, whatever plan we end up on.** Vendoring is the only option that keeps
a paying customer's dashboard working when Polyfork is down or our card fails, and it pins the
approved look. Pro is still worth buying — but for the `.mjs` module and the catalogue, not for
the CDN. See §4.

Feeds ticket 07: the free/Pro split is not really about the CDN. It is about the module.

## 4. Q3 — The remix bake budget as a build-time dependency

### Measured behaviour

| Observation | Result |
| --- | --- |
| New geometry bake (`?p={"tallness":7.2}`) | hour 39→38, month 99→98. **Costs exactly 1 of each.** |
| Re-fetch the identical bake | hour 38→38, month 98→98, **0.14 s**. **Costs nothing.** |
| Bake already made by someone else (`tallness=9.6`) | served, counter unchanged. **Costs nothing.** |
| Baked variant cache headers | `max-age=604800, s-maxage=2592000, immutable`, `x-remix: exact` |

This confirms the documented rule: *"The budget is on generating NEW geometry. Variations anyone
has already baked are served to everybody and never counted."*

**The headline finding: the bake budget is a one-off build-time cost, never a runtime cost.** It
does not scale with our user count. Once a variant exists it is free forever, for us and for
every future CI run. It scales only with the number of distinct (asset, knob-set) pairs we ship,
plus however many we throw away while iterating.

### The caps

| Tier | Per hour | Longer window |
| --- | --- | --- |
| Anonymous | 40 | **100 / month** |
| Free account (an email address) | 100 | **300 / week** |
| Pro | 900 | **uncapped** |

### Does a full build fit?

Size Tier is 4 buckets (`CONTEXT.md`). The Forest kit's `tall-pine-tree-ab4108` exposes exactly
the right knob: `tallness`, a range 6.4–9.6 m, `affects: geometry`, described as *"it REBUILDS
rather than scaling: branch whorls are added at a roughly constant 1.6–1.8 m tier pitch."* That
is a Size Tier ladder in one knob, and it is the honest way to do it — the map's "never rescale
to fake a fit" rule from `prompt.txt` is satisfied.

Sizing, per Theme:

- one Entity model × 4 Size Tiers = **4 bakes**
- 3 Entity models (species variety) × 4 = **12 bakes**
- × a `season` knob (summer/snow, also `affects: geometry`) = **24 bakes**
- three Themes at that rate = **~72 bakes** for the whole product
- scenery and props that do not vary by Size Tier = **0 bakes** (ship the published default GLB)

So a full three-Theme build is **tens of bakes, not hundreds**.

Against the caps:

- **Anonymous (100/month) is too tight.** 72 fits once, with almost no room for the iteration a
  design pass actually needs — every rejected `flare` / `facets` / `tallness` experiment burns one.
- **A free account (300/week) clears it comfortably.** A full rebake of all three Themes plus
  several rounds of iteration fits inside a single week. **This is the right tier for the bake
  work even if we never buy Pro.**
- **Pro is irrelevant to this question** — with Pro you would not pre-bake at all, because the
  `.mjs` evaluates `tallness` in our engine at runtime.

### Two conditions on the bake step

1. **Bake with a free-account key, not anonymously.** The anonymous budget is not isolated to us.
   Between two of my own checks the anonymous counter dropped by 4 with no request from me
   (39→38 by my bake, then 34 unprompted) — it is keyed to something shared, plausibly IP. A CI
   runner on a shared egress IP could arrive at a budget someone else already spent. A key
   attaches the budget to us.
2. **Commit the baked GLBs; do not bake on every CI run.** Then CI never touches Polyfork and the
   budget is irrelevant to the pipeline. (Even a re-baking CI would mostly cost 0, since unchanged
   knob sets are cached — but only while the knob sets are unchanged.)

### One caveat for ticket 05

**Baked variants have no vertex normals.** Verified: the published `/cdn/{id}.glb` carries
`POSITION, COLOR_0, NORMAL` with named nodes (`tall-pine-tree`, `pine`); the `-remix.glb` bake
carries `POSITION, COLOR_0` only, one unnamed node. This matches the documented
*"What they do not carry is the .mjs program, the normals, and on a static prop the named
hierarchy."* three.js computes flat normals when they are absent, which is the correct look for
flat-shaded low-poly — but a baked Size Tier variant and the published default are **not**
equivalent inputs. Do not mix them in one scene without checking the shading matches.

Both carry `COLOR_0`, so both render coloured in three.js rather than white.

### And a knock-on for the free path

`/api/assets/{id}/variant` for a **colour-only** want returns the *default-paint* preview GLB,
with an explicit `glb_note`: *"this variant only changes colour, which is applied at runtime: the
GLB above is the default paint. Use the module and call the params."* Verified live.

**So on the free plan, colour variants cannot be delivered as a GLB at all.** Only knobs marked
`affects: geometry` bake into a distinct file. If a Theme's customization knobs are colour-based
(palette, day/night), the free path cannot pre-bake them — that needs the `.mjs`, which needs
Pro. This is a sharper input to ticket 07 than the CDN question is.

## 5. Q4 — Lock-in

**The licence is unusually explicit and lands in our favour.** Verbatim:

> Everything you downloaded while subscribed is yours permanently, under this same license, with
> no attribution and no expiry. **That is not a courtesy we can withdraw: it is the license the
> files were delivered under**, and it applies whether you cancel, let a card lapse, or **we stop
> selling subscriptions entirely.** The single exception is breaking the terms above.

Answering the ticket's two sub-questions directly:

- **If Polyfork goes away, do already-downloaded GLBs remain usable?** **Yes**, permanently, under
  the same commercial licence, with no attribution and no expiry. The clause names company
  shutdown explicitly.
- **Does "anything you download stays yours forever" cover a lapsed subscription?** **Yes**,
  explicitly — "whether you cancel, let a card lapse". The only withdrawal trigger anywhere in
  the document is breaching the terms (redistribution / competing generator), and even then we get
  notice and a chance to answer unless the breach is deliberate and ongoing.

What *does* stop, verbatim: *"the hosted CDN, remix baking, and new assets published after your
subscription ends"*, with 30 days of grace past the end of the paid period.

**So the lock-in risk is not licence risk. It is availability risk, and it lands entirely on
whichever delivery option keeps a live dependency in the request path.** Vendoring (option A/B)
reduces it to zero. This is the strongest argument for A/B independent of the plan we choose.

Note this survives the module path too: if we ship the Pro `.mjs` and Pro later lapses, the
modules are downloaded files and stay licensed. We lose the ability to bake *new* variants and to
get *new* assets. A shipped World needs neither.

One inconsistency worth knowing, not worth blocking on: `/licensing` says *"You can take the whole
catalog with you at any time while subscribed, as a single download from your account"*, while
`/pricing` and `llms.txt` both restrict `catalog.zip` to the Founders Club and tell Pro users to
take assets per-asset or per-kit. Either way we can obtain every file we actually use.

## 6. Q5 — `/demo` and share links

**Nothing about them changes the licence answer.** The licence draws no distinction between
authenticated and anonymous viewers, or between paying and non-paying ones. "Websites" is a named
permitted use; free assets are hotlinkable "with no account at all". A public demo page is a
website and a share link is a website.

Two things they *do* sharpen:

1. **They make option C untenable.** A share link is designed to spread. Sending viral traffic at
   Polyfork's public CDN — on no contract, no SLA and no documented bandwidth cap — is fragile
   and, past some volume, discourteous. Self-hosting removes the question.
2. **They widen the blast radius of the §7 trap.** Anything on `/demo` or a share link is served
   to anyone. The constraint is on what *we* ship, not on who fetches it — so the paid-preview
   rule below applies there exactly as it does to the signed-in app.

## 7. Traps found

**1. Paid assets' preview GLBs are publicly fetchable at full fidelity.** `GET
/cdn/birch-tree-181b33-preview.glb` returns **200, 45 KB, 619 triangles, anonymously**, even
though `/cdn/birch-tree-181b33.glb` is a 404 and the asset reports `free: false, plan: "pro",
owned: false`. `llms.txt` states `preview_fidelity` is **1.0 across the paid catalogue**.

It is trivially easy to ship a Pro asset by accident: the preview URL is right there in the public
API response and it returns a complete model. **Hard rule for the build: never ship a
`-preview.glb` of an asset whose `free` is `false` unless we hold Pro.** Previews exist to preview.

**2. The free-tier line is exactly 600 triangles**, and it is enforced on the *published* asset,
not on a bake. Verified across the Forest kit: pine 350 ✓ free, oak 457 ✓, bush 512 ✓, maple 548 ✓,
toadstool 604 ✗ paid, birch 619 ✗ paid. Baking a free asset to its maximum `tallness` (9.6 m) took
it from 350 to 430 triangles and was served without complaint — **the top Size Tier of a free tree
stays inside the free tier.** Forest has 5+ free tree candidates, which is enough for Entities.

**3. The anonymous bake budget is shared, not ours.** See §4 condition 1.

## 8. Verdict

**Safe with conditions.** Polyfork's assets can carry a public commercial SaaS. The permitted-use
clause names "websites" and "products you sell"; the pricing FAQ explicitly disclaims any intent
to keep the files behind their CDN; and Polyfork's own recommended delivery path is hotlinking a
GLB from a shipped build, which serves the bytes to every anonymous visitor.

Conditions, in priority order:

1. **Send the §2 email to `hello@polyfork.dev` before public launch.** Not before the ticket 08
   prototype, and not before the gate — the residual ambiguity in "tools that hand the files to
   other people" is narrow, and the licence itself asks to be consulted on edge cases. Cheap
   insurance; do not launch on my inference alone.
2. **Vendor the GLBs and serve them ourselves** (option A/B). Removes the runtime dependency,
   removes the availability risk that §5 identifies as the real lock-in, pins the approved look,
   and takes our traffic off someone else's uncontracted bandwidth.
3. **Never ship a `-preview.glb` of a `free: false` asset** unless we hold Pro. §7 trap 1.
4. **Bake with a free-account key and commit the output.** §4 conditions.
5. **Do not expose the files as files** — no download button, no asset browser, no export. That
   is the line the licence actually draws, and staying well clear of it is free for us.

Nothing here blocks the pivot, and nothing here decides free-vs-Pro on its own. The input this
research hands to ticket 07 is that **the CDN is the wrong reason to buy Pro** — we should
self-host either way. The right reason is the `.mjs` module: on the free path, colour knobs cannot
be pre-baked into a GLB at all (§4), so a free build's customization knobs are limited to
geometry knobs and a fixed set of baked variants.

---

## Appendix: reproduction

```bash
# licence, plans, agent guide
curl -s https://polyfork.dev/licensing
curl -s https://polyfork.dev/pricing
curl -s https://polyfork.dev/prompt.txt
curl -s https://polyfork.dev/llms.txt

# live budget (works anonymously)
curl -s https://polyfork.dev/api/me | python3 -m json.tool

# free asset is public, CORS-open, cacheable
curl -sI https://polyfork.dev/cdn/tall-pine-tree-ab4108.glb
#   200, model/gltf-binary, 39060 bytes
#   access-control-allow-origin: *
#   cache-control: public, max-age=86400, s-maxage=604800,
#                  stale-while-revalidate=86400, stale-if-error=2592000

# paid asset: real file 404s, preview is public at full fidelity
curl -so /dev/null -w '%{http_code}\n' https://polyfork.dev/cdn/birch-tree-181b33.glb          # 404
curl -so /dev/null -w '%{http_code} %{size_download}\n' \
     https://polyfork.dev/cdn/birch-tree-181b33-preview.glb                                     # 200 45308

# a bake costs exactly 1; re-fetching it costs 0
curl -s 'https://polyfork.dev/cdn/tall-pine-tree-ab4108-remix.glb?p=%7B%22tallness%22%3A7.2%7D'
#   hour 39->38, month 99->98; x-remix: exact; cache-control ... immutable
#   second identical fetch: counters unchanged, 0.14 s

# colour-only variant does NOT bake a file
curl -s 'https://polyfork.dev/api/assets/tall-pine-tree-ab4108/variant?want=golden+larch'
#   glb -> ...-preview.glb, glb_note: "the GLB above is the default paint"

# the Size Tier knob
curl -s https://polyfork.dev/cdn/tall-pine-tree-ab4108-params.json
#   tallness: range 6.4..9.6, affects: geometry, "REBUILDS rather than scaling"
```

Triangle counts parsed from the GLB JSON chunk:

| File | Triangles | Attributes | Nodes |
| --- | --- | --- | --- |
| `/cdn/tall-pine-tree-ab4108.glb` (published, 9.0 m) | 350 | POSITION, COLOR_0, **NORMAL** | `tall-pine-tree`, `pine` |
| `-remix.glb?p={"tallness":7.2}` | 350 | POSITION, COLOR_0 | 1 unnamed |
| `-remix.glb?p={"tallness":9.6}` | 430 | POSITION, COLOR_0 | 1 unnamed |
