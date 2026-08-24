# Research: three.js in Next.js, at World scale

Type: research
Status: resolved
Blocked by: —

## Question

What does the render stack look like if the World becomes real 3D, and does it hold at MVP scale?

This re-opens [research 01](../../isometric-dashboard/research/01-rendering-tech.md), which chose PixiJS 8 and parked three.js behind "only if true 3D ever enters the roadmap". It has.

Answer:

1. **Stack shape.** three.js directly, or React Three Fiber, or Babylon? In Next.js the closed effort loaded PixiJS client-only via `next/dynamic` with `ssr: false` — does the same pattern hold, and what does it cost in bundle size?
2. **Scale.** One **Entity** per subscriber. Target ~1,000 Entities in one **World**, each a 300–600 triangle low-poly mesh drawn from a small set of shared source meshes. What technique carries that — instanced meshes, merged geometry, LOD — and what frame rate does it give on a mid-range laptop and on a phone?
3. **The timeline.** [Ticket 06](../../isometric-dashboard/issues/06-prototype-timeline.md) proved a full fold of the **Timeline** per frame is fine in 2D at MVP scale, driving ~6 months per second of replay. In 3D the fold is unchanged, but every frame may add and remove meshes. What breaks first, and what is the fix — object pooling, instance-attribute updates, something else?
4. **What survives from PixiJS.** The "Ranger station" page layout (spec §4) is DOM and React: stats header, subscriber roster, hover-highlight, click-to-center. Confirm the pivot touches only the canvas, and say what click-to-center and hover-highlight cost in 3D (raycasting versus 2D hit tests).
5. **Loading.** GLB loading, draco/meshopt compression, and whether ~1,000 Entities from a handful of source GLBs means a small download or a large one.

Prefer primary sources: three.js docs, R3F docs, and real benchmarks over blog claims.

Write findings to `.scratch/lowpoly-3d-pivot/research/02-threejs-nextjs-scale.md`. End with a recommended stack and the scale ceiling it buys.

## Answer

Findings: [`research/02-threejs-nextjs-scale.md`](../research/02-threejs-nextjs-scale.md).

**Recommended stack:** `three@0.185.x` + `@react-three/fiber@9.x` (React 19,
`transpilePackages: ['three']`), mounted client-only via `next/dynamic(..., { ssr: false })` from a
`"use client"` wrapper — the identical pattern the PixiJS prototype used. `@react-three/drei`
optional and imported per-component only.

The **Entity** population is one `InstancedMesh` per distinct geometry (Size Tier ladder + churn
states + optional second species), all sharing one `MeshStandardMaterial({ vertexColors: true,
flatShading: true })`, allocated once at "every Subscriber that ever appears" and never
reallocated. Entity health state is a per-instance `setColorAt` multiply over `COLOR_0`, not extra
geometry. Scenery and effects get one `InstancedMesh` per type. An `OrthographicCamera` plus
`OrbitControls` replaces the hand-written `isoToScreen()`, the `zIndex` painter sort, and the
hand-rolled pan/zoom. GLBs ship plain and self-hosted — **no Draco** (its decoder is 75 KB gzip
against a 125 KB whole-Theme payload). `BatchedMesh` is held in reserve: it is one draw call, but
three.js falls back to a per-instance draw loop on Firefox, which has no `WEBGL_multi_draw`.

**Scale ceiling it buys:**

- **~16–22 draw calls for the whole World, independent of the Entity count**, against React Three
  Fiber's stated ceiling of ~1,000. 10 Entities and 10,000 Entities cost the same in draw calls.
- 1,000 Entities ≈ 370 k triangles / 1.11 M vertices per frame — lighter than the default
  configuration of three.js's own shipped `webgl_instancing_performance` benchmark.
- Measured renderer CPU cost: **0.400 ms/frame** to rewrite *all* 1,583 instance matrices and
  colours; **0.577 ms** per hover raycast over 1,583 real 457-triangle Polyfork oaks, and R3F only
  raycasts on user interaction.
- Asset download is **125 KB gzipped for a whole Theme (16 GLBs) and flat in the Entity count** —
  smaller than the three.js bundle.
- Bundle: three + r3f ≈ **232 KB gzip** versus PixiJS's ~246 KB. The pivot is bundle-neutral.

**The real ceiling is not the renderer — it is `foldWorldState`.** Measured: 127.8 ms per fold at
1,583 Entities (~8 fps) because `lastMrrBeforeChurn` rescans the whole Timeline per churned
Entity. Carrying `lastMrr` through the single pass the fold already makes takes it to **0.98 ms**
(130×), and under 10 ms out to ~8,000 Entities. Engine-independent — it would bite PixiJS
identically. Data-layer work, not Theme work.

**Not certified here:** real frame rates. This ran on a headless GPU-less container. Ticket 08's
gate must measure a mid-range laptop and a phone; mobile vertex throughput (~67 M verts/s at
60 fps) is the one plausible limit, and `frameloop="demand"` is its first mitigation.

**Research 01 is answered on its own terms.** Of its six criteria, two go moot (pixel-art
filtering, sprite-sheet animation), three flip to three.js (scene management, performance, bundle),
and the sixth — the "3D concept tax" — is now the product. Decisive independent evidence: four of
its headline PixiJS reasons (`AnimatedSprite`, GSAP `PixiPlugin`, `@pixi/tilemap`,
`ParticleContainer`) have **zero uses** in `prototypes/forest-world/`.
