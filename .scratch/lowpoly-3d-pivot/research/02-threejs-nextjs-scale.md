# Research 02: three.js in Next.js, at World scale

Answers [issue 02](../issues/02-research-threejs-nextjs-scale.md). Researched 2026-08-19.

**Verdict: three.js + React Three Fiber, loaded client-only. It carries ~1,000 Entities
comfortably, and the ceiling is not the Entity count — it is the draw-call count, which the
asset shape from [research 01](01-lowpoly-sources.md) already collapses to single digits.**

The technique is `BatchedMesh` (one draw call for the whole Entity population, per-instance
visibility and colour built in), with `InstancedMesh` as the simpler fallback and `LOD` as an
optional escape hatch that this project almost certainly never needs.

## Sources

Primary only. Everything read or measured on 2026-08-19.

| Source | What it is |
| --- | --- |
| `https://threejs.org/docs/pages/BatchedMesh.html` | three.js API reference |
| `https://threejs.org/docs/pages/InstancedMesh.html` | three.js API reference |
| `https://threejs.org/docs/pages/LOD.html` | three.js API reference |
| `https://threejs.org/docs/pages/Raycaster.html` | three.js API reference |
| `https://threejs.org/docs/pages/GLTFLoader.html` | three.js API reference |
| `https://threejs.org/docs/pages/WebGLRenderer.html` | three.js API reference |
| `https://threejs.org/manual/en/optimize-lots-of-objects.html` | three.js manual, with measured fps |
| `https://r3f.docs.pmnd.rs/getting-started/installation` | R3F docs |
| `https://r3f.docs.pmnd.rs/advanced/scaling-performance` | R3F docs |
| `https://nextjs.org/docs/app/guides/lazy-loading` | Next.js docs |
| `registry.npmjs.org` + jsdelivr dist files | versions; bundle sizes **[MEASURED]** |
| `prototypes/forest-world/*.js` | the PixiJS prototype this must reproduce |

Claims marked **[MEASURED]** were derived by downloading and measuring during this research.
Bundlephobia was rate-limited (HTTP 429), so bundle numbers are self-measured from the shipped
dist files, the same method research 01 used for Phaser.

---

## 1. Re-opening research 01: which of its six reasons survive the pivot?

[research 01](../../isometric-dashboard/research/01-rendering-tech.md) chose PixiJS 8 on six
criteria and parked three.js with "choose it only if the World is expected to evolve into true
3D". The World now is true 3D, so the honest thing is to walk its six criteria rather than wave
at the escape clause.

**The decisive new evidence is not in the docs — it is in `prototypes/forest-world/`.** Three of
research 01's six verdicts rested on PixiJS features that the prototype, once built, never used.
Grepped across `main.js`, `world.js`, `sprites.js`, `mock-signals.js` and `index.html`:

| PixiJS feature research 01 bought | Uses in the prototype |
| --- | --- |
| `AnimatedSprite` (criterion 3's headline) | **0** |
| GSAP `PixiPlugin` (criterion 3) | **0** |
| `@pixi/tilemap` (criterion 2's headline) | **0** |
| `ParticleContainer` (criterion 4) | **0** |

What the prototype actually uses from PixiJS is small: `Sprite`, `Container`, `zIndex` +
`sortableChildren`, `eventMode: 'static'` for hover, `tint`/`alpha` for the highlight,
`app.ticker`, and one global `scaleMode = 'nearest'` (`sprites.js:42`). Every animation in the
World — the sway (`world.js:203`, `skew.x = sin(...)`), the growth pop (`world.js:208`, a hand-rolled
scale ease), falling raindrops, rising sparks — is arithmetic written by hand inside
`app.ticker.add(...)`. None of it is engine feature. All of it ports to a three.js `useFrame`
callback with the property names changed.

Criterion by criterion:

| # | Research 01 criterion | Status after the pivot |
| --- | --- | --- |
| 1 | Pixel-art fidelity (`scaleMode: 'nearest'` global default) | **Moot.** No textures at all — the Entities are flat-shaded vertex-colour meshes (`COLOR_0`, [research 03 §4](03-polyfork-licence-delivery.md)). There is nothing to filter. |
| 2 | Isometric scene management (`zIndex`/`sortableChildren`, `@pixi/tilemap`) | **Inverted.** Research 01's objection was that three.js means "fighting the transparent-object sort order with `renderOrder`, or modeling the world in true 3D with an orthographic camera — more machinery than the MVP needs." That machinery *is* the MVP now. Opaque meshes sort on the depth buffer for free and correctly; `zIndex = spot.x + spot.y` (`world.js:78`) and the hand-written `isoToScreen()` (`world.js:21`) both **delete** — the isometric projection becomes an `OrthographicCamera`. |
| 3 | Animation (`AnimatedSprite`, Ticker, GSAP plugin) | **Bought nothing.** See the table above: zero uses. The Ticker's replacement is R3F's `useFrame`. |
| 4 | Performance at 100s–1000s of sprites | **Flips to three.js.** Pixi's sprite batching has no answer for 3D meshes; `BatchedMesh`/`InstancedMesh` are exactly the primitive this workload wants (§3). |
| 5 | Bundle / Next.js fit | **Flips to three.js.** three is ~183 KB gzip against pixi.js's ~246 KB; +r3f still lands roughly level with pixi.js alone (§2.3). The `ssr: false` pattern is identical for both. |
| 6 | React ecosystem / learning curve | **The one real cost.** Research 01 called it "the 3D concept tax (cameras, materials, lights, transparency sorting)". That tax is now the product, not an overhead. R3F 9.7.0 is the more mature React renderer of the two. |

So of research 01's six reasons: two go moot, three flip to three.js, and one (the concept tax) is
now a cost the product requires. **Nothing in research 01 argues against the pivot on its own
terms.** Its recommendation was correctly reasoned for a 2D pixel-art World and does not survive
the World becoming 3D.

One thing research 01 got right and this research confirms: the **`next/dynamic` + `ssr: false`
client-only pattern is unchanged**, and neither library has a Vercel blocker.

---

## 2. Stack shape

### 2.1 three.js directly, R3F, or Babylon?

**Recommendation: three.js as the engine, React Three Fiber as the binding.**

- R3F is "a React renderer for three.js" and states "There is no overhead. Components render
  outside of React" ([r3f introduction](https://r3f.docs.pmnd.rs/getting-started/introduction)).
  It is not an abstraction over three.js — every three.js class is reachable as a JSX element, and
  an imperative escape hatch (`useThree`, refs to raw objects) is always available. So choosing
  R3F does not forfeit any three.js API this research relies on.
- Current versions **[MEASURED]** from the npm registry on 2026-08-19: `three@0.185.1` (zero
  dependencies), `@react-three/fiber@9.7.0`, `@react-three/drei@10.7.8`.
- Peer deps: r3f 9 requires `react >=19 <19.3` and `three >=0.156`; drei 10.7.8 requires
  `react ^19`, `three >=0.159`, `@react-three/fiber ^9.0.0`. The docs confirm the pairing:
  "@react-three/fiber@8 pairs with react@18, @react-three/fiber@9 pairs with react@19."
- **Babylon.js is not recommended**, and the reason is the same shape as research 01's Phaser
  finding: Babylon is a full engine (its own scene graph, physics, inspector, asset pipeline,
  GUI) with no first-party React renderer comparable to R3F. The spec's page is a React dashboard
  with a canvas in it, not a game with a React overlay. There is also a concrete
  three.js-specific asset argument: Polyfork is a **three.js-first catalogue** — it ships an
  `.mjs` ES module whose `createAsset(opts)` returns three.js objects ([research 01
  §"the .mjs is free"](01-lowpoly-sources.md)), so any non-three engine forfeits the runtime-knob
  path entirely and is stuck with pre-baked GLBs forever. That interacts directly with ticket 07.

**When to skip R3F.** The prototype's `createForestWorld(mount, data, opts)` is a single
imperative function that owns a canvas and exposes `setTime` / `highlight` / `centerOn` /
`destroy`. That shape works just as well with bare three.js in a `useEffect`. R3F earns its place
for three specific things this project will want — `<Canvas frameloop="demand">` (§4.3), Suspense-based
GLB loading with automatic caching (§6), and drei's `<Bounds>`/camera-controls for click-to-center
(§5) — not for expressing 1,000 Entities as 1,000 React components. **Do not render one JSX
element per Entity.** The Entity population is one `<primitive object={batchedMesh} />`; React
sees one node whatever the subscriber count.

### 2.2 Next.js integration

Two requirements, both documented:

1. **Client-only mount.** Next.js docs: `next/dynamic` with `{ ssr: false }` loads a component
   "only on the client side", and "`ssr: false` option is not supported in Server Components. You
   will see an error if you try to use it. … Please move it into a Client Component"
   ([lazy loading guide](https://nextjs.org/docs/app/guides/lazy-loading)). So: a `"use client"`
   wrapper that does `dynamic(() => import('./World'), { ssr: false })`. **Identical to the
   pattern the PixiJS prototype would have used** — this is not a new cost.
2. **`transpilePackages`.** R3F's install docs, for Next.js 13.1+: add `transpilePackages: ['three']`
   to `next.config.js`. This is the one line of config three.js needs that PixiJS did not.

No server runtime is involved, so nothing about Vercel deployment changes.

### 2.3 Bundle cost **[MEASURED]**

Bundlephobia returned HTTP 429, so these are measured from the packages' own shipped dist files
(downloaded from jsdelivr, `gzip -9`):

| Package | Version | Minified | Min+gzip | Method |
| --- | --- | --- | --- | --- |
| `three` | 0.185.1 | 750,938 B | **187,457 B (~183 KB)** | `build/three.module.min.js` + `build/three.core.min.js`, both shipped pre-minified |
| `@react-three/fiber` | 9.7.0 | 154,129 B | **48,997 B (~48 KB)** | `dist/events-4c71f21f.cjs.prod.js` (the dev-stripped production build), minified with esbuild 0.28.2 |
| `pixi.js` (incumbent) | 8.19.0 | 879,857 B | 251,852 B (~246 KB) | research 01, via bundlephobia |

The three number reproduces research 01's bundlephobia figure (182,763 B) to within 2 %, which is
a good cross-check on the method.

**So the whole 3D stack is ~232 KB gzip against PixiJS's ~246 KB — the pivot is bundle-neutral,
slightly favourable.** Two caveats, both honest:

- These are whole-library figures. Real bundles tree-shake; a World that never touches three's
  animation system, physics helpers, or half the material zoo ships less than 183 KB. Neither
  library's real figure is knowable before the app exists, so compare like with like: whole
  against whole.
- **`@react-three/drei` is where bundle discipline is actually needed.** Unlike three and r3f it
  carries a large dependency list (`three-stdlib`, `three-mesh-bvh`, `camera-controls`,
  `troika-three-text`, `@mediapipe/tasks-vision`, `hls.js`, `stats.js`, …). Drei is
  per-component tree-shakeable and should be imported that way; treat it as a menu, not a
  dependency. Nothing in this research's recommended path *requires* drei.

Behind `dynamic(..., { ssr: false })` none of this blocks the dashboard shell's first paint,
which was research 01's own mitigation and holds unchanged.

---

## 3. Scale: what technique carries ~1,000 Entities

### 3.1 The constraint is draw calls, and the asset shape has already solved it

R3F's own performance page states the budget in one line: "Each mesh is a draw call, you should be
mindful of how many of these you employ: **no more than 1000 as the very maximum**"
([scaling performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance)). The three.js
manual demonstrates the same thing with measured numbers: 19,000 boxes as separate meshes gives
"a framerate under 20fps"; the same 19,000 boxes merged into one geometry gives "60 frames per
second" ([optimize lots of objects](https://threejs.org/manual/en/optimize-lots-of-objects.html)).
One draw call per Entity is the naive design and it is the design that fails.

The Polyfork asset shape makes the fix nearly free. **[MEASURED]** on the real files, every
Entity GLB carries exactly one mesh, one primitive, and one material, and that material is
identical across assets:

```json
{"pbrMetallicRoughness": {"metallicFactor": 0, "roughnessFactor": 0.85}}
```

Zero images, zero textures, zero glTF extensions; geometry is `POSITION, COLOR_0[, NORMAL]`,
non-indexed. So **one shared `MeshStandardMaterial({ vertexColors: true, flatShading: true })`
covers the whole Entity population**, which is the precondition both batching primitives require.

### 3.2 `InstancedMesh` vs `BatchedMesh` — and a Firefox trap

| | `InstancedMesh` | `BatchedMesh` |
| --- | --- | --- |
| Docs | "render a large number of objects with the **same geometry and material(s)** but with different world transformations" | "render a large number of objects with the **same material but with different geometries** or world transformations" |
| Draw calls for the Entity population | one per distinct geometry (~10 for Forest) | **1** — where `WEBGL_multi_draw` exists |
| Per-instance colour | `setColorAt` | `setColorAt` (accepts `Vector4`, so alpha too) |
| Per-instance visibility | none — hide by writing a zero-scale matrix | `setVisibleAt(id, bool)` |
| Per-instance frustum culling | none | `perObjectFrustumCulled`, **default `true`** |
| Depth sorting | none | `sortObjects` default `true`, plus `customSort` |
| Add/remove at runtime | fixed `count`, resize means reallocate | `addInstance` / `deleteInstance` / `addGeometry` / `deleteGeometry` |
| Raycast | brute force over `count`, returns `instanceId` | brute force over instances, per-geometry bounds |

**The trap. `BatchedMesh` is not one draw call on Firefox.** Read first-hand in three.js r185,
`src/renderers/WebGLRenderer.js:1303–1322`:

```js
if ( object.isBatchedMesh ) {
    if ( ! extensions.get( 'WEBGL_multi_draw' ) ) {
        ...
        for ( let i = 0; i < drawCount; i ++ ) {
            uniforms.setValue( _gl, '_gl_DrawID', i );
            renderer.render( starts[ i ] / bytesPerElement, counts[ i ] );
        }
    } else {
        renderer.renderMultiDraw( ... );
    }
}
```

MDN's browser-compat data for `WEBGL_multi_draw` **[MEASURED]** (fetched from
`mdn/browser-compat-data`): Chrome 86, Safari 15, Edge/Opera/Samsung/WebView mirrored —
**Firefox `false`, Firefox Android `false`, Opera Android `false`.** MDN labels the extension
"Limited availability … not Baseline because it does not work in some of the most widely-used
browsers."

So on Firefox a 1,000-instance `BatchedMesh` degrades to a 1,000-iteration draw loop — exactly the
"19,000 meshes at under 20fps" case the three.js manual measures. It still renders correctly; it
just loses the whole point.

**Recommendation: `InstancedMesh`, one per distinct geometry, as the primary technique.**
Instanced rendering is core WebGL2 (`drawElementsInstanced`) with no extension and no browser
gap, and the Forest Theme's geometry set is small enough that "one draw call per geometry" is
already a single-digit number:

| Geometry bucket | Count |
| --- | --- |
| Entity Size Tier ladder (Young Pine ×2, Tall Pine ×2 — [research 01](01-lowpoly-sources.md)) | 4 |
| Churn states (Dead Tree, Tree Stump) | 2 |
| Second species for variety (Oak, Maple) — optional, ×4 tiers if taken seriously | 2–8 |
| Ground / terrain (one merged mesh, or a plane) | 1 |
| Scenery props (rocks, grass tufts, bushes, wildflowers) — one InstancedMesh each | ~6 |
| FX (raindrops, clouds, sparks) — one InstancedMesh each (§4) | 3 |
| **Total draw calls for the whole World** | **~16–22** |

Against R3F's ceiling of 1,000. **The Entity count does not appear in that table at all** —
10 Entities and 10,000 Entities produce the same number of draw calls. That is the single most
important structural fact in this research.

Keep `BatchedMesh` in reserve for two specific futures: (a) if per-Entity unique geometry ever
becomes a feature (every subscriber gets its own baked tree), where the geometry count explodes
and instancing stops applying; (b) if per-instance frustum culling becomes necessary at high zoom
(§3.4) — `perObjectFrustumCulled` is real and `InstancedMesh` has no equivalent. Both are
post-gate concerns.

**`LOD` is the wrong tool here.** `three.js`'s `LOD` class is per-`Object3D` — "Every LOD level is
associated with an object, and rendering can be switched between them at the distances specified"
— so 1,000 Entities means 1,000 `LOD` objects and 1,000 draw calls, undoing the win. If LOD is
ever needed, the instanced form of it is two `InstancedMesh`es (near/far) with instances moved
between them by distance, using the 70–350-triangle free `ultra` assets that
[research 01](01-lowpoly-sources.md) already identified as "a very cheap LOD … path". Do not
reach for it before the gate measures a problem.

### 3.3 The measured budget **[MEASURED]**

Triangle and vertex counts parsed from the GLB JSON chunks of the real files:

| Asset | Triangles | Vertices (non-indexed) |
| --- | --- | --- |
| Tier 1 — Young Pine @ `tallness 2.0` | 246 | 738 |
| Tier 2 — Young Pine @ `tallness 3.15` | 534 | 1,602 |
| Tier 3 — Tall Pine @ `tallness 6.4` | 270 | 810 |
| Tier 4 — Tall Pine @ `tallness 9.6` | 430 | 1,290 |
| Dead Tree | 536 | 1,608 |
| Tree Stump | 505 | 1,515 |
| Broadleaf Oak | 457 | 1,371 |
| **Ladder average** | **~370** | **~1,110** |

So the per-frame geometry load:

| Entities | Triangles/frame | Vertices/frame |
| --- | --- | --- |
| 237 (prototype `default` preset) | ~88 k | ~263 k |
| 792 (`crowded` preset) | ~293 k | ~879 k |
| **1,000 (the ticket's target)** | **~370 k** | **~1.11 M** |
| 1,583 (`targetSubscribers: 1000`) | ~586 k | ~1.76 M |

Two reference points from primary sources put those numbers in context:

- The three.js manual's merged case runs **19,000 boxes = ~228 k triangles at 60 fps** in one draw
  call.
- three.js ships a first-party benchmark, `examples/webgl_instancing_performance.html`, whose
  **default configuration is 1,000 instances of Suzanne — 967 triangles, 505 vertices each
  [MEASURED] from `examples/models/json/suzanne_buffergeometry.json` — i.e. ~967 k triangles**,
  with a count slider up to 10,000 and INSTANCED / MERGED / NAIVE modes to compare. That default
  is roughly 2.6× our 1,000-Entity triangle load, and it ships as a demo.

**Note for ticket 05, not for this ticket:** the Size Tier ladder is *non-monotonic* in triangle
count — tier 2 (534 tri) is heavier than tier 4 (430 tri), because the ladder chains across two
different source assets. Visually irrelevant, but it means "bigger tier" and "more triangles" are
not the same axis when budgeting.

### 3.4 Frame rate: what this research can and cannot promise

**Honest limit: this research ran on a headless 2-vCPU AMD EPYC-Rome container with no GPU. Every
CPU-side number below is measured; no frame-rate number is, and I will not invent one.**

What the arithmetic supports:

- **Mid-range laptop: comfortable, with margin.** ~370 k triangles in ~20 draw calls, one
  material, no textures, no shadows required, flat shading. That is a smaller workload than a
  three.js example that ships as a default demo, and an order of magnitude below the draw-call
  ceiling R3F names. The CPU-side per-frame cost is measured at well under 1 ms (§4).
- **Phone: plausible at the target, but unproven, and this is the gate's job.** The number to
  watch on mobile is not triangles, it is **vertices** — ~1.11 M vertices per frame at 1,000
  Entities, non-indexed. At 60 fps that is ~67 M vertices/s of vertex-shader throughput, which is
  demanding for a mid-range mobile GPU under thermal load. Indexing the geometry does **not**
  rescue this: the meshes are flat-shaded with per-face vertex colours, so adjacent faces cannot
  share vertices, which is exactly why Polyfork ships them non-indexed.

The mitigation ladder, in the order it should be tried, all of it documented rather than invented:

1. **`frameloop="demand"`** on `<Canvas>` — R3F: "set the canvas `frameloop` prop to `demand`" to
   render only when necessary, "saving battery and reducing fan noise". A World that is not being
   scrubbed and not animating costs zero frames. **This is the biggest single mobile win**, and
   its price is dropping the continuous ambient sway (`world.js:203`) on mobile — a Theme
   decision, not an engine limit.
2. **`dpr={[1, 2]}` plus `regress()`** — R3F's adaptive-resolution and movement-regression
   mechanism: "Listen to `state.performance.current` to scale resources", "multiply it with pixel
   ratio for adaptive resolution". Attacks fill rate, which is the other mobile constraint.
3. **Per-instance frustum culling** — switch the Entity population to `BatchedMesh` with
   `perObjectFrustumCulled` (default `true`) when the camera is zoomed in. Costs the Firefox
   penalty of §3.2; take it only if measured.
4. **Instanced LOD onto the free `ultra` assets** (70–350 tri) for distant Entities. ~4× vertex
   reduction on most of the population.
5. **Cap the Entity count on small viewports** — a phone showing 1,000 trees at once is a
   questionable design anyway.

**Ticket 08's gate should measure exactly this**, and the benchmark already exists: open
`https://threejs.org/examples/#webgl_instancing_performance` on the target laptop and the target
phone, set count to 1000, and compare INSTANCED against NAIVE. It is a 2.6×-heavier version of
our workload, from the engine's own authors, and it takes a minute.

---

## 4. The Timeline: what breaks first

**It is not the meshes. It is `foldWorldState`, and it is already broken in 2D.**

### 4.1 The measured finding **[MEASURED]**

`prototypes/forest-world/mock-signals.js` was run under Node 22.22 on the container described
above, timing `foldWorldState(data, t)` across subscriber counts:

| `targetSubscribers` | Entities | Timeline Signals | Fold, as shipped | Fold, one-line fix |
| --- | --- | --- | --- | --- |
| 150 (`default` preset) | 237 | 3,137 | **2.35 ms** | 0.68 ms |
| 500 (`crowded` preset) | 792 | 10,888 | **30.7 ms** | 0.73 ms |
| **1000** | **1,583** | **22,617** | **127.8 ms** | **0.98 ms** |
| 2000 | 3,167 | 44,415 | **561.6 ms** | 3.64 ms |
| 5000 | 7,917 | 112,192 | (not run) | 9.78 ms |

At the ticket's target scale the fold as shipped costs **128 ms — about 7.8 frames per second,
before three.js draws a single triangle.** Ticket 06's verdict that "a full fold of the Timeline
per frame is fine in 2D at MVP scale" is correct *at the preset it was proven on* (150 → 2.35 ms)
and does not survive the jump to 1,000. It is already marginal at the prototype's own `crowded`
preset (30.7 ms → 32 fps).

### 4.2 The cause and the fix

`mock-signals.js:312` computes the Size Tier of every churned Entity via `lastMrrBeforeChurn`,
and `mock-signals.js:332-340` implements that by **scanning the entire Timeline once per churned
Entity**:

```js
function lastMrrBeforeChurn(data, e) {
  let mrr = 0;
  for (const s of data.timeline) {
    if (s.subscriberId !== e.subscriberId || s.at > (e.churnedAt ?? Infinity)) continue;
    ...
```

That is O(churned Entities × Signals) — 1,583 × 22,617 ≈ 36 M iterations per fold. The main loop
above it is O(Signals) and costs under a millisecond.

The fix is to carry `lastMrr` forward inside the single pass the fold already makes, and drop
`lastMrrBeforeChurn` entirely. Measured, that is a **130× speedup at 1,583 Entities (127.8 ms →
0.98 ms)** and it stays under 10 ms out to ~8,000 Entities. The fold becomes genuinely O(Signals)
and the Timeline stops being the constraint.

**This is engine-independent.** It is not a three.js finding and not a reason to pivot — it is a
finding about `foldWorldState` that would bite PixiJS identically. It belongs to whoever owns the
data layer, not to the Theme layer. Flagging it here because the ticket asks what breaks first,
and the answer is unambiguous.

### 4.3 What the 3D renderer actually adds per frame — and why it is not the problem

The ticket's worry is that "every frame may add and remove meshes". **The prototype already
solved that, and the solution ports directly.** `world.js:71-103` builds a node for *every
subscriber that ever appears*, once, before the first paint, and `setTime` only toggles
`node.visible` and swaps a texture when a key changes (`world.js:175-189`). No object is
allocated during scrubbing.

The three.js form is the same shape and strictly cheaper:

- Allocate each `InstancedMesh` once at `count = totalSubscribersEverSeen` (the same set
  `buildPlacement` already enumerates).
- `setTime(t)` folds, then writes `setMatrixAt` / `setColorAt` for the instances whose bucket,
  transform or state changed, sets `instanceMatrix.needsUpdate = true`, and sets each mesh's
  `.count`.
- Nothing is constructed or destroyed. No GC.

**Measured cost of the pessimistic version** — recomposing *all* 1,583 instance matrices and
colours from scratch every frame, using three.js's own `Matrix4.compose`/`Color`, allocating a
fresh `Vector3` per iteration: **0.400 ms per frame**, producing 101,312 bytes of `instanceMatrix`
and 18,996 bytes of `instanceColor` to upload (~6 MB/s at 60 fps). That is 2.4 % of a 16.7 ms
frame budget for the worst case that never actually happens.

**So the per-frame renderer cost is ~0.4 ms against a fold cost of ~128 ms.** The mesh churn the
ticket worries about is a rounding error next to the fold.

Two real 3D-specific costs remain, and both have named fixes:

- **Per-instance state is a colour multiply, not a geometry swap.** Verified first-hand in
  `src/renderers/shaders/ShaderChunk/color_vertex.glsl.js` (r185): `vColor.rgb *= instanceColor.rgb`
  under `USE_INSTANCING_COLOR`, and `vColor *= getBatchingColor(...)` under `USE_BATCHING_COLOR`.
  Per-instance colour **multiplies** the GLB's `COLOR_0`, which is precisely PixiJS's `tint`
  semantics. The prototype's healthy/warning/critical canopy palettes (`sprites.js` `PAL.canopy`)
  therefore become three `Color` constants passed to `setColorAt`, **not** three more geometries.
  This collapses the geometry-bucket combinatorics from `species × tier × state` to
  `species × tier`.
- **The FX layer is the real allocation churn, and it is already churning in 2D.**
  `world.js:112-169` `rebuildEffects` destroys and rebuilds every effect sprite, guarded by
  `fxDay !== lastFxDay` (`world.js:190-191`). But `main.js:200` sets `PLAY_SPEED = 6 months per
  real second` ≈ **180 world-days per second**, so at 60 fps the day advances ~3 days per frame
  and **the guard passes on literally every frame during playback**. The naive three.js port of
  that — `new Mesh(...)` per raindrop, `.dispose()` per frame — is the one thing in this design
  that would actually break, because it churns geometries and materials through the GPU resource
  cache. The fix is the same as everywhere else: three fixed-size `InstancedMesh`es (raindrops,
  clouds, sparks) with a max count, where a frame writes matrices and alphas and never allocates.
  This is the three.js equivalent of the `ParticleContainer` research 01 bought and the prototype
  never used.

---

## 5. What survives from PixiJS: the pivot touches only the canvas

**Confirmed. The "Ranger station" layout is untouched.** `main.js:119-165` builds variant B's
stats header, roster and veil entirely from DOM strings and `document.createElement`; the tooltip
(`main.js:57-72`) is an absolutely-positioned DOM node driven by `clientX/clientY`. None of it
touches PixiJS. In a Next.js app all of that is ordinary React.

The seam is the World's returned object (`world.js:269-290`), and **every member of it survives
verbatim**:

| Surface | PixiJS implementation | three.js implementation | Cost change |
| --- | --- | --- | --- |
| `setTime(t)` | fold + texture swap | fold + `setMatrixAt`/`setColorAt` | −, measured 0.4 ms (§4.3) |
| `highlight(id)` | `spr.tint` + `spr.alpha` (`world.js:280-285`) | `setColorAt` + `instanceColor.needsUpdate` | same semantics (colour **multiply**, verified in the shader chunk); O(n) either way |
| `centerOn(id)` | translate the world container (`world.js:274-279`) | move the camera / `OrbitControls.target`, or drei `<Bounds>` | cheaper — one object, not a scene translate |
| hover → `onHover(e)` | `eventMode: 'static'` + `pointerover` per sprite | `Raycaster`, `intersect.instanceId` → subscriber id | see below |
| `destroy()` | `app.destroy(true, {children:true})` | `renderer.dispose()` + geometry/material dispose | equivalent |
| `t`, `t0`, `now`, `state` | plain values | unchanged | — |
| pan / zoom (`world.js:247-263`) | hand-rolled pointer + wheel maths | `OrbitControls` / `MapControls`, off the shelf | **deleted code** |
| `isoToScreen()` (`world.js:21`), `zIndex = x + y` (`world.js:78`) | hand-rolled isometric projection + painter sort | `OrthographicCamera` + the depth buffer | **deleted code** |

### Raycasting vs 2D hit tests — measured **[MEASURED]**

The concern is that picking in 3D is expensive. It is O(n) brute force: three.js
`InstancedMesh.raycast` does one whole-mesh bounding-sphere early-out, then loops all `count`
instances (`src/objects/InstancedMesh.js`), tagging each hit with `instanceId`. `BatchedMesh`
does the same over its instance list.

Measured on the real asset — an `InstancedMesh` of **1,583 instances of the actual 457-triangle
Polyfork Broadleaf Oak**, parsed straight out of `broadleaf-oak-997c22.glb`, raycast from an
`OrthographicCamera` at random screen positions:

> **0.577 ms per pick** (500 picks, 384 of them hitting an Entity)

That is ~3.5 % of a 16.7 ms frame, on a 2-vCPU server core, for the whole population. And R3F does
not pay it continuously: "**By default Fiber will only raycast when the user is interacting with
the canvas**" ([R3F events](https://r3f.docs.pmnd.rs/api/events)) — a still World costs nothing,
and camera-only movement needs an explicit `state.events.update()`.

For comparison, PixiJS's `eventMode: 'static'` hit test is also a walk of the interactive display
list, so 2D was never free either. **Raycasting is not a reason to hesitate.** If it ever is, the
escalation path is: restrict the raycast set with R3F's `events.filter`, throttle picks to one per
rendered frame, or add a BVH via `three-mesh-bvh` (already a transitive dependency of drei).

One genuinely new affordance, worth recording because it is a product opportunity rather than a
cost: in 3D `centerOn` can be an animated camera move rather than an instant jump, and the share
link's "diorama" framing the closed effort parked becomes a camera position rather than a separate
render path.

---

## 6. Loading: how big is the download?

### 6.1 Measured, on the real files **[MEASURED]**

A complete Forest Theme asset set was downloaded and measured: the four Size Tier bakes from
[research 01](01-lowpoly-sources.md)'s ladder, both churn states, three alternative species/bush,
and seven scenery props.

| | Raw | gzip -9 |
| --- | --- | --- |
| **16 GLBs — a whole Theme's Entity + scenery set** | **671,988 B (656 KB)** | **127,705 B (125 KB)** |
| Single published GLB (`tall-pine-tree-ab4108`, 350 tri) | 39,060 B | 7,088 B |
| Smallest tier bake (`young-pine @ tallness 2.0`) | 18,480 B | 2,529 B |

**gzip alone gives 5.26× on this corpus.** That is unusually good for binary mesh data, and the
reason is structural: the meshes are non-indexed and flat-shaded, so each face repeats its normal
and its `COLOR_0` three times in a row. Flat-shaded low-poly is close to a best case for a
byte-level compressor.

Baking cost: **0 remix bakes were consumed** to produce those four tier variants — the anonymous
budget read 40/40 before and 40/40 after — because research 01 had already baked those exact knob
values, and per [research 03 §4](03-polyfork-licence-delivery.md) "Variations anyone has already
baked are served to everybody and never counted."

### 6.2 Does ~1,000 Entities mean a large download? No — and the reason is structural

**The download does not scale with the Entity count at all.** 1,000 Entities are 1,000 instance
matrices — 64 bytes each, generated on the client from the Timeline fold — drawn from the same
16 files. Going from 100 subscribers to 10,000 subscribers adds **zero bytes** of asset payload.

125 KB gzipped, cached `immutable` behind content-hashed filenames (the self-hosting path
[research 03](03-polyfork-licence-delivery.md) recommends), is **smaller than the three.js
bundle itself** and is a one-time cost per visitor. Three Themes at that rate is ~375 KB gzipped
total, and only the active Theme needs loading.

### 6.3 Draco: no. Meshopt: probably not either

three.js's `GLTFLoader` supports `KHR_draco_mesh_compression` (via `setDRACOLoader`) and
`EXT_meshopt_compression` (via `setMeshoptDecoder`). Measured decoder cost from the `three@0.185.1`
package **[MEASURED]**:

| Decoder | Raw | gzip |
| --- | --- | --- |
| Draco (`examples/jsm/libs/draco/gltf/`: `draco_decoder.wasm` + `draco_wasm_wrapper.js`) | 250,876 B | **74,727 B** |
| Meshopt (`examples/jsm/libs/meshopt_decoder.module.js`) | 29,256 B | **7,690 B** |

**Draco's decoder is 75 KB gzipped against a whole-Theme asset payload of 125 KB gzipped.** It
would have to beat gzip by more than 60 % on files that gzip already compresses 5.26× just to
break even, and it costs a WASM instantiation plus a decode pass on the main thread or a worker.
**Do not use Draco.** It is designed for texture-heavy, high-polygon assets; these are neither.

Meshopt is at least cheap enough to be arguable (7.7 KB gzip) and its decode is much faster than
Draco's, but at 125 KB total it is optimising a rounding error. **Recommendation: ship plain GLB
with `Content-Encoding: gzip`/`br` from our own origin, and revisit compression only if a Theme's
asset set ever grows past a megabyte.** This also keeps the build simple: no `gltf-transform`
step, no decoder files to copy into `public/`, no version-skew between the decoder and the loader.

### 6.4 Two loading traps, both first-hand

1. **Published and baked GLBs have different attribute sets, and `BatchedMesh` throws on the
   mismatch.** Measured: `broadleaf-oak-997c22.glb` carries `POSITION, COLOR_0, NORMAL`;
   `young-pine-…-remix.glb` carries `POSITION, COLOR_0` only (matching
   [research 03 §4](03-polyfork-licence-delivery.md)'s "baked variants have no vertex normals").
   `BatchedMesh._validateGeometry` (r185, `src/objects/BatchedMesh.js:417-439`) throws
   `"Added geometry missing \"<name>\". All geometries must have consistent attributes."` and,
   separately, `"All geometries must consistently have \"index\"."` So a Size Tier ladder that
   mixes a published default with baked variants **cannot go into one batch** until the baked ones
   get `computeVertexNormals()` — or until every geometry has its normals deleted and the material
   uses `flatShading: true`. The latter is cleaner and matches the intended look. `InstancedMesh`
   does not have this constraint (each geometry is its own mesh), which is one more reason to
   start there.
2. **Every measured GLB is non-indexed.** `tall-pine-tree-ab4108.glb` is 1,050 vertices for 350
   triangles. Do not assume indexed geometry when sizing buffers or reserving `maxVertexCount`.

### 6.5 Loading mechanics

Use R3F's `useGLTF` / `useLoader`, which is "cached automatically" per URL
([R3F scaling performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance)) — so 16 files
load once regardless of how many components ask for them, and Suspense gives the loading state.
The GLB payload sits behind the same `dynamic(..., { ssr: false })` boundary as the engine, so
neither blocks the dashboard shell.

---

## 7. Recommendation

### The stack

```
three@0.185.x
  + @react-three/fiber@9.x            (React 19; needs transpilePackages: ['three'])
  + @react-three/drei@10.x            optional, imported per-component only
  mounted via next/dynamic(..., { ssr: false }) inside a "use client" wrapper
```

- **Entity population:** one `InstancedMesh` per distinct geometry (Size Tier ladder + churn
  states + optional second species), all sharing **one** `MeshStandardMaterial({ vertexColors:
  true, flatShading: true })`. Fixed `count` allocated once at "every subscriber that ever
  appears"; `setTime` writes matrices and colours and never allocates.
- **Entity health state** (healthy / warning / critical / highlighted / dimmed): per-instance
  `setColorAt`, which multiplies `COLOR_0`. Not extra geometry.
- **Scenery and FX:** one `InstancedMesh` per prop type and per effect type. Never `new Mesh` in a
  frame.
- **Camera:** `OrthographicCamera` for the isometric look, `OrbitControls`/`MapControls` for pan
  and zoom. Deletes `isoToScreen()`, the `zIndex` sort, and the hand-rolled pan/zoom handlers.
- **Assets:** plain GLB, self-hosted, gzip/brotli on the wire, content-hashed and `immutable`.
  No Draco, no meshopt.
- **Mobile:** `frameloop="demand"`, `dpr={[1, 2]}`, R3F performance regression.
- **Held in reserve:** `BatchedMesh` (for per-instance frustum culling or an explosion in geometry
  count — but note the Firefox `WEBGL_multi_draw` gap), instanced LOD onto the free `ultra`
  assets, `three-mesh-bvh` for picking.

Bundle cost against the incumbent: **~232 KB gzip (three + r3f) versus PixiJS's ~246 KB.** The
pivot is bundle-neutral.

### The scale ceiling it buys

| | |
| --- | --- |
| **Draw calls at 1,000 Entities** | **~16–22**, against R3F's stated ceiling of 1,000 — and **independent of the Entity count** |
| **Triangles / vertices per frame at 1,000 Entities** | ~370 k / ~1.11 M — below the default configuration of three.js's own shipped instancing benchmark (~967 k triangles) |
| **Per-frame CPU cost of the renderer** | **0.400 ms** to rewrite *all* 1,583 instance matrices and colours (pessimistic; the real path writes only what changed) |
| **Hover pick over 1,583 Entities** | **0.577 ms**, and only on user interaction |
| **Asset download for a whole Theme** | **125 KB gzipped, 16 files, flat in the Entity count** |
| **The actual ceiling** | **`foldWorldState`.** As shipped it is 128 ms at 1,583 Entities (~8 fps). With the O(n) fix it is **0.98 ms**, and stays under 10 ms to ~8,000 Entities. |

**So: the recommended stack carries ~1,000 Entities with the renderer using ~1 ms of a 16.7 ms
frame, and the honest ceiling after the fold is fixed is several thousand Entities on a laptop —
bounded by mobile vertex throughput long before it is bounded by three.js.** The two things this
research cannot certify are a measured frame rate on real hardware and mobile behaviour at 60 fps;
[ticket 08](../issues/08-prototype-3d-forest-gate.md) is where those get measured, and
`webgl_instancing_performance` at count = 1000 is a one-minute proxy to run first.

### Against research 01

Nothing in [research 01](../../isometric-dashboard/research/01-rendering-tech.md) survives as an
argument for PixiJS once the World is 3D (§1): two of its six criteria go moot, three flip to
three.js, and the sixth — the "3D concept tax" — is now the product. Its own escape clause
("choose Three.js only if the World is expected to evolve into true 3D") is satisfied on its face.
The independent evidence that seals it is the prototype: `AnimatedSprite`, GSAP's `PixiPlugin`,
`@pixi/tilemap` and `ParticleContainer` — four of research 01's six headline reasons — have **zero
uses** in the shipped code.

---

## Appendix: measurement platform and reproduction

Platform: headless container, **AMD EPYC-Rome, 2 vCPU, no GPU**, Node v22.22.0, three r185.
Node's V8 is the same engine as Chrome's, so CPU-side numbers are a fair laptop proxy; **no
GPU-side or frame-rate number was measured here.**

```bash
# --- bundle sizes (bundlephobia returned HTTP 429; self-measured instead)
curl -sL -O https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.min.js
curl -sL -O https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.core.min.js
gzip -9 -c three.module.min.js | wc -c    # 86590
gzip -9 -c three.core.min.js   | wc -c    # 100867   -> ~183 KB total
curl -sL -o r3f.js https://cdn.jsdelivr.net/npm/@react-three/fiber@9.7.0/dist/events-4c71f21f.cjs.prod.js
npx esbuild r3f.js --minify --format=cjs --outfile=r3f.min.js
gzip -9 -c r3f.min.js | wc -c             # 48997

# --- decoder cost
curl -sL -O https://cdn.jsdelivr.net/npm/three@0.185.1/examples/jsm/libs/draco/gltf/draco_decoder.wasm      # 192420 B, 63223 gz
curl -sL -O https://cdn.jsdelivr.net/npm/three@0.185.1/examples/jsm/libs/draco/gltf/draco_wasm_wrapper.js   #  58456 B, 11504 gz
curl -sL -O https://cdn.jsdelivr.net/npm/three@0.185.1/examples/jsm/libs/meshopt_decoder.module.js          #  29256 B,  7690 gz

# --- the Forest asset set (16 files; 0 bakes consumed, all knob values pre-existing)
curl -sL -o t3.glb 'https://polyfork.dev/cdn/tall-pine-tree-ab4108-remix.glb?p=%7B%22tallness%22%3A6.4%7D'
curl -sL -o oak.glb https://polyfork.dev/cdn/broadleaf-oak-997c22.glb
# ... see §6.1 table; totals: 671,988 B raw / 127,705 B gzip -9
curl -s https://polyfork.dev/api/me     # remix_bakes_left_this_hour: 40 before AND after

# --- Firefox / WEBGL_multi_draw
curl -sL https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/WEBGL_multi_draw.json
#   chrome 86, safari 15, firefox false, firefox_android false, opera_android false
curl -sL https://unpkg.com/three@0.185.1/src/renderers/WebGLRenderer.js | sed -n '1303,1322p'
#   the per-instance draw loop taken when the extension is absent

# --- shader semantics of per-instance colour
curl -sL https://unpkg.com/three@0.185.1/src/renderers/shaders/ShaderChunk/color_vertex.glsl.js
#   vColor.rgb *= instanceColor.rgb;   /  vColor *= getBatchingColor(...)

# --- BatchedMesh attribute constraint
curl -sL https://unpkg.com/three@0.185.1/src/objects/BatchedMesh.js | sed -n '417,440p'
```

The three CPU benchmarks (fold timing, instance-matrix write, raycast over 1,583 real oak
instances) were one-off scripts written to `/tmp` and are described completely in §4.1, §4.3 and
§5; each is ~30 lines and re-derivable from `prototypes/forest-world/mock-signals.js`,
`glbs/broadleaf-oak-997c22.glb` and the three.js ESM build.
