# Rendering technology for the isometric pixel-art "World"

- **Date:** 2026-08-18
- **Question:** Which rendering technology should the MVP use for an isometric, pixelated, animated "World" (pixel-art, forest/city/RTS themes, driven by data signals) inside a Next.js app deployed on Vercel? Candidates: Three.js, PixiJS, plain Canvas 2D.
- **Method:** Primary sources only — official docs, official API references, npm registry metadata, bundlephobia API, and one self-measured dist file. No blog posts.

---

## 1. Pixel-art fidelity (crisp integer scaling, no smoothing)

### PixiJS
- Textures are sampled through a `TextureStyle`: "A texture style describes how a texture should be sampled by a shader." Its `scaleMode` accessor: "setting this will set magFilter, minFilter and mipmapFilter all at once!" ([TextureStyle API](https://pixijs.download/release/docs/rendering.TextureStyle.html))
- Valid scale modes are string values; the v8 migration guide documents `SCALE_MODES.NEAREST` → `'nearest'` and `SCALE_MODES.LINEAR` → `'linear'` ([v8 migration guide](https://pixijs.com/8.x/guides/migrations/v8)).
- Both `TextureStyle` and `TextureSource` expose a `static defaultOptions`, so `'nearest'` can be set **globally once** for every texture in the app ([TextureStyle API](https://pixijs.download/release/docs/rendering.TextureStyle.html), [TextureSource API](https://pixijs.download/release/docs/rendering.TextureSource.html)).
- Per-texture form shown in the guides: `texture.source.scaleMode = '...'` ([Textures guide](https://pixijs.com/8.x/guides/components/textures)).

### Three.js
- The official manual: "For setting the filter when the texture is drawn larger than its original size you set `texture.magFilter` property to either `THREE.NearestFilter` or `THREE.LinearFilter`. `NearestFilter` means just pick the closest single pixel from the original texture. With a low resolution texture this gives you a very pixelated look like Minecraft." Set `texture.magFilter = THREE.NearestFilter; texture.minFilter = THREE.NearestFilter;` for the retro look ([three.js manual: Textures](https://threejs.org/manual/en/textures.html)).
- Fully supported, but it is per-texture configuration on a 3D-first API (six `minFilter` mipmap variants to understand).

### Canvas 2D
- `CanvasRenderingContext2D.imageSmoothingEnabled` "determines whether scaled images are smoothed (`true`, default) or not (`false`)". MDN: "This property is useful for games and other apps that use pixel art. When enlarging images, the default resizing algorithm will blur the pixels. Set this property to `false` to retain the pixels' sharpness." ([MDN: imageSmoothingEnabled](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/imageSmoothingEnabled))
- Simplest possible pixel-art story; note the flag is per-context state and must be re-asserted if the context resets (e.g. canvas resize).

**Verdict:** All three can do crisp nearest-neighbor. PixiJS is the only one with a documented *global default* switch (`TextureSource.defaultOptions` / `TextureStyle.defaultOptions`).

---

## 2. Isometric scene management (depth sorting, tile grids, plugins)

### PixiJS
- Built-in painter's-algorithm sorting: `Container.zIndex` ("A higher value will mean it will be moved towards the front of the rendering order", default `0`) plus `sortableChildren` ("If set to true, the container will sort its children by `zIndex` value when the next render is called", default `false`) and a manual `sortChildren()` that "only sorts if container is marked as dirty" ([Container API](https://pixijs.download/release/docs/scene.Container.html)). This maps 1:1 onto isometric depth sorting (`zIndex = tileX + tileY`).
- Official tilemap plugin: `@pixi/tilemap` is "a low-level rectangular tilemap implementation, optimized for high performance rendering and a out-of-the-box canvas fallback"; Tilemap Kit v5.x targets PixiJS v8.x, with `CompositeTilemap`, WebGL and WebGPU support ([github.com/pixijs/tilemap](https://github.com/pixijs/tilemap)).
- Render groups let you split static world vs. HUD: for static structures they "can significantly reduce the computational load on the CPU", with the caveat "the majority of the time you won't need to use them at all!" ([Render groups guide](https://pixijs.com/8.x/guides/concepts/render-groups)).

### Three.js
- No tile/2D-scene concept. Ordering is 3D depth-buffer based; the escape hatch is `Object3D.renderOrder`: "This value allows the default rendering order of scene graph objects to be overridden although opaque and transparent objects remain sorted independently. … Sorting is from lowest to highest render order." Default `0` ([Object3D docs](https://threejs.org/docs/pages/Object3D.html)).
- `Sprite` objects exist (camera-facing planes with `SpriteMaterial`) ([three.js docs index](https://threejs.org/docs/)), but an isometric 2D world means either fighting the transparent-object sort order with `renderOrder`, or modeling the world in true 3D with an orthographic camera — more machinery than the MVP needs. No official tilemap tooling.

### Canvas 2D
- Nothing built in. Depth sorting = sort your own draw list every frame; tile grids = your own loops. MDN's scene-management advice is limited to "use multiple layered canvases for complex scenes" split by update frequency ([MDN: Optimizing canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)). All achievable, all hand-rolled.

**Verdict:** PixiJS. `zIndex`/`sortableChildren` is exactly the isometric sorting primitive, and `@pixi/tilemap` is an official, v8-compatible tile layer.

---

## 3. Animation and tweening

### PixiJS
- `AnimatedSprite`: "An AnimatedSprite is a simple way to display an animation depicted by a list of textures", with `animationSpeed` (negative = reverse), `loop`, `gotoAndPlay()` / `gotoAndStop()` (frame-accurate scrubbing), `onFrameChange` callback, and `autoUpdate` driven by the shared Ticker ([AnimatedSprite API](https://pixijs.download/release/docs/scene.AnimatedSprite.html)).
- `Ticker` provides "a powerful and flexible mechanism for executing callbacks on every animation frame", with `deltaTime`, `minFPS` ("Caps how slow frames are allowed to be. Used to clamp deltaTime") and `maxFPS` ("Limits how fast the ticker runs. Useful for conserving CPU/GPU") ([Ticker guide](https://pixijs.com/8.x/guides/components/ticker)).
- GSAP ships an **official first-party PixiPlugin**: it improves "developer ergonomics for anyone animating in PixiJS" and tweens nested Pixi properties (`position.x`, `scale.y`, `skew.x`), colors, ColorMatrixFilter/BlurFilter effects, and directional rotation; registered via `PixiPlugin.registerPIXI(PIXI)` ([GSAP PixiPlugin docs](https://gsap.com/docs/v3/Plugins/PixiPlugin/)).
- Weather particles: `ParticleContainer` (see criterion 4).

### Three.js
- Has a full 3D animation system (`AnimationMixer`, clips) but no flipbook/sprite-sheet animation primitive; sprite-sheet animation means UV-offset code you write yourself. GSAP can tween any JS object property, but there is no Pixi-style dedicated plugin for three.js scene objects.

### Canvas 2D
- No animation objects at all: frame stepping, tickers, tweening, and particles are all hand-written on `requestAnimationFrame`. GSAP can tween plain values you then draw.

**Verdict:** PixiJS — the only candidate where sprite-sheet animation (`AnimatedSprite`), a delta-time ticker, and a first-party GSAP plugin are all documented, off-the-shelf pieces.

---

## 4. Performance (hundreds to a few thousand sprites)

### PixiJS
- Renderers: `WebGLRenderer` ("Default renderer using WebGL/WebGL2. Well supported and stable.") and `WebGPURenderer` ("Modern GPU renderer using WebGPU. More performant, still maturing."), selected via `autoDetectRenderer()`; the guide recommends WebGL for production today ([Renderers guide](https://pixijs.com/8.x/guides/components/renderers)).
- Automatic sprite batching: "Sprites can be batched with up to 16 different textures (dependent on hardware)"; "Use Spritesheets where possible to minimize total textures"; different blend modes break batches ([Performance tips](https://pixijs.com/8.x/guides/concepts/performance-tips)).
- `ParticleContainer` is "a highly optimized container that can render 1000s of particles at great speed"; particles are limited to "position, scale, rotation, and color", must share one texture source, and by default "only the `position` property is set to dynamic, which makes rendering very fast!" ([ParticleContainer API](https://pixijs.download/release/docs/scene.ParticleContainer.html)). Ideal for rain/snow/leaves weather layers.

### Three.js
- Equally GPU-capable. `InstancedMesh`: "Use this class if you have to render a large number of objects with the same geometry and material(s) but with different world transformations. The usage of 'InstancedMesh' will help you to reduce the number of draw calls and thus improve the overall rendering performance" ([InstancedMesh docs](https://threejs.org/docs/pages/InstancedMesh.html)). Raw power is not the problem — you would be re-building a 2D batcher on top of a 3D engine.

### Canvas 2D
- CPU-bound immediate mode; no batching concept. MDN's own optimization list is workarounds: offscreen pre-rendering, integer coordinates ("Sub-pixel rendering … forces the browser to do extra calculations"), avoiding scaling in `drawImage()`, layered canvases, `alpha: false` ([MDN: Optimizing canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)). Feasible for hundreds of static tiles; the riskiest candidate for "a few thousand animated sprites plus weather particles".

**Verdict:** PixiJS and Three.js are both GPU-class; PixiJS's batching and `ParticleContainer` target exactly this workload. Canvas 2D is the ceiling risk.

---

## 5. Bundle size and Next.js/SSR fit

Bundlephobia API measurements (fetched 2026-08-18):

| Package | Version | Minified | Min+gzip | Deps | Source |
|---|---|---|---|---|---|
| `pixi.js` | 8.19.0 | 879,857 B (~859 KB) | 251,852 B (~246 KB) | 10 | [bundlephobia API](https://bundlephobia.com/api/size?package=pixi.js) |
| `three` | 0.185.1 | 723,851 B (~707 KB) | 182,763 B (~178 KB) | 0 | [bundlephobia API](https://bundlephobia.com/api/size?package=three) |
| Canvas 2D | — | 0 | 0 | 0 | browser built-in |
| `phaser` (comparison) | 4.2.1 | 1,375,976 B | 352,227 B | — | self-measured: official `dist/phaser.min.js` from npm via [jsdelivr](https://cdn.jsdelivr.net/npm/phaser/dist/phaser.min.js), gzip -9 (bundlephobia API was rate-limited) |

Next.js fit (docs v16.3.1, [Lazy loading guide](https://nextjs.org/docs/app/guides/lazy-loading)):
- `next/dynamic` with `{ ssr: false }` loads a component "only on the client side".
- "`ssr: false` option will only work for Client Components, move it into Client Components ensure the client code-splitting working properly."
- "`ssr: false` option is not supported in Server Components. You will see an error if you try to use it. … Please move it into a Client Component."
- So the pattern for **any** of the three candidates is identical: a `"use client"` wrapper component that does `dynamic(() => import('./World'), { ssr: false })`. All three libraries touch `window`/canvas and need this; no candidate wins or loses here, but none has a blocker on Vercel (pure client-side rendering; no server runtime needed).
- Three.js-specific caveat: r3f docs instruct Next.js 13.1+ users to "add three to `transpilePackages` property in `next.config.js`" because untranspiled three-ecosystem add-ons may need it ([r3f installation](https://r3f.docs.pmnd.rs/getting-started/installation)).

**Verdict:** Canvas 2D wins on bytes (0 KB). Between the engines: three is ~178 KB gzip, pixi.js ~246 KB gzip — a ~68 KB difference, mitigated for all candidates by `ssr: false` lazy loading so it never blocks first paint of the dashboard shell. Phaser is the heaviest option (~352 KB gzip).

---

## 6. Learning curve and ecosystem (React integrations)

### PixiJS — `@pixi/react`
- "A thin wrapper around Pixi.js, allowing it to be expressed via JSX"; components like `<pixiSprite>` map directly to Pixi classes ([react.pixijs.io](https://react.pixijs.io/getting-started/)).
- Current version **8.0.5**; peer deps `react >=19.0.0`, `pixi.js ^8.2.6` ([npm registry](https://registry.npmjs.org/@pixi/react/latest)). React 19 supported (required).
- v8 is a recent rewrite — smaller ecosystem and less battle-testing than r3f. Mitigation: PixiJS's imperative API is simple enough that the World can also be a plain `useEffect`-mounted Pixi `Application` inside one client component, with React only pushing data signals in. `@pixi/react` is optional, not load-bearing.
- Conceptual model is 2D and small: containers, sprites, textures, ticker.

### Three.js — `@react-three/fiber`
- "React-three-fiber is a React renderer for three.js" — "There is no overhead. Components render outside of React." ([r3f introduction](https://r3f.docs.pmnd.rs/getting-started/introduction))
- Current version **9.7.0**; peer deps `react >=19 <19.3`, `three >=0.156` ([npm registry](https://registry.npmjs.org/@react-three/fiber/latest)); docs state "@react-three/fiber@8 pairs with react@18, @react-three/fiber@9 pairs with react@19" ([r3f installation](https://r3f.docs.pmnd.rs/getting-started/installation)).
- The most mature React-renderer ecosystem of the three (drei, postprocessing, rapier, etc.) — but it is a 3D ecosystem; you still pay the 3D concept tax (cameras, materials, lights, transparency sorting) for a 2D isometric world.

### Canvas 2D
- No integration needed and none exists; you write the React↔canvas bridge, the loop, and every abstraction yourself. Lowest API surface, highest amount of bespoke engine code to own.

**Verdict:** r3f has the deepest React ecosystem, but for a 2D world the PixiJS mental model is the smallest. Both React integrations are current and React-19 compatible.

---

## Side check: does a tilemap/game framework clearly beat both?

- **Phaser** (official site: [phaser.io](https://phaser.io)) is a full game framework (scenes, physics, input, loader). It is the heaviest candidate (~352 KB gzip, measured above), owns its own scene/game-loop architecture rather than slotting into a React data-driven dashboard, and has no first-party React renderer comparable to `@pixi/react`/r3f. It does not clearly beat PixiJS for a data-driven visualization; it adds game-framework weight the MVP does not need.
- **`@pixi/tilemap` alone** is not an alternative — it is a PixiJS plugin ("a low-level rectangular tilemap implementation" for PixiJS, [README](https://github.com/pixijs/tilemap)) and therefore an argument *for* PixiJS, not against it.

No third option clearly beats the candidates.

---

## Comparison summary

| Criterion | PixiJS 8 | Three.js | Canvas 2D |
|---|---|---|---|
| 1. Pixel-art fidelity | `scaleMode: 'nearest'`, settable globally via `defaultOptions` | `NearestFilter` per texture | `imageSmoothingEnabled = false` |
| 2. Isometric scene mgmt | `zIndex` + `sortableChildren` built in; official `@pixi/tilemap` v5 for v8 | `renderOrder` escape hatch; no tile tooling; 3D sorting model | fully hand-rolled |
| 3. Animation/tweening | `AnimatedSprite` (gotoAndPlay/Stop), Ticker (deltaTime, maxFPS), official GSAP PixiPlugin, ParticleContainer | 3D animation system; no flipbook primitive; generic GSAP | all hand-rolled on rAF |
| 4. Perf @ 100s–1000s sprites | auto-batching (≤16 textures/batch), ParticleContainer "1000s of particles", WebGL + WebGPU | GPU-class via InstancedMesh, but 3D machinery | CPU-bound; riskiest |
| 5. Bundle / Next.js | ~246 KB gzip; `ssr:false` client-only | ~178 KB gzip; needs `transpilePackages: ['three']`; `ssr:false` | 0 KB; `ssr:false` still needed |
| 6. React / learning curve | `@pixi/react` 8.0.5 (React 19); small 2D mental model; wrapper optional | r3f 9.7.0 (React 19); biggest ecosystem; 3D concept tax | no library to learn, everything to build |

---

## Recommendation: **PixiJS 8** (loaded client-only via `next/dynamic` + `ssr: false`, optionally with `@pixi/react`)

1. **Pixel-art fidelity:** one global `TextureSource.defaultOptions.scaleMode = 'nearest'` gives crisp pixels everywhere; Three.js and Canvas 2D need per-texture/per-context handling.
2. **Isometric scene management:** `zIndex` + `sortableChildren` is precisely the isometric depth-sort primitive, and the official `@pixi/tilemap` v5 plugin covers tile layers; Three.js would mean fighting a 3D transparency sorter, Canvas 2D means building it all.
3. **Animation:** `AnimatedSprite` + Ticker + the **first-party GSAP PixiPlugin** cover sprite animation, scrubbing (`gotoAndStop`), and signal-driven tweens out of the box — the strongest documented animation stack of the three.
4. **Performance:** automatic sprite batching and `ParticleContainer` ("1000s of particles at great speed") target exactly the hundreds-to-thousands-of-sprites-plus-weather workload, on WebGL today with a WebGPU path already shipping.
5. **Bundle/Next.js:** ~246 KB gzip is ~68 KB more than three, but behind `dynamic(..., { ssr: false })` in a client component it never blocks the dashboard's first paint, and PixiJS needs no `transpilePackages` config. Canvas 2D's 0 KB does not compensate for owning a bespoke engine.
6. **Learning curve:** the 2D container/sprite/ticker model is the smallest fit for the job; `@pixi/react` 8.0.5 (React ≥19) provides JSX when wanted, and the plain-`useEffect` mount pattern is a safe fallback if the young wrapper misbehaves.

Runner-up: Three.js + r3f — choose it only if the World is expected to evolve into true 3D (camera rotation, real lighting). Canvas 2D: acceptable only if the sprite count stays in the low hundreds and bundle size is paramount.
