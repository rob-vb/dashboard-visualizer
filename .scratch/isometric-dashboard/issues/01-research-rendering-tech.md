# Research: rendering technology for the isometric World

Type: research
Status: resolved

## Question

Which rendering technology should the MVP use for an isometric, pixelated, animated World inside a Next.js app on Vercel: **Three.js**, **PixiJS**, or plain Canvas 2D? Judge the candidates on:

- Pixel-art fidelity (crisp integer scaling, no texture smoothing)
- Isometric scene management (depth sorting, tile grids)
- Animation and tweening (growth stages, weather effects, timeline scrubbing)
- Performance with hundreds to a few thousand Entities on screen
- Bundle size and Next.js/SSR fit (client-only canvas is acceptable)
- Learning curve and ecosystem (React integrations such as react-three-fiber / @pixi/react)

Recommend one, with a short justification against each criterion. Note any relevant alternative (e.g. WebGL tilemap libraries) only if it clearly beats both.

## Answer

**Recommendation: PixiJS 8**, mounted client-only via `next/dynamic` with `ssr: false`. Use `@pixi/react` (a thin wrapper) or a plain `useEffect`-mounted Pixi `Application` — both are fine.

Per criterion:

- **Pixel-art fidelity** — all three candidates pass, but PixiJS makes it a one-liner set globally: `scaleMode: 'nearest'` via `TextureStyle`/`TextureSource.defaultOptions`. Three.js needs per-texture `NearestFilter` on mag/min filters; Canvas 2D needs `imageSmoothingEnabled = false` per context.
- **Isometric scene management** — PixiJS wins outright: built-in `zIndex` + `sortableChildren` depth sorting, plus the official `@pixi/tilemap` v5 plugin (WebGL and WebGPU) for tile grids. Three.js only offers `renderOrder` over a 3D transparency sorter; Canvas 2D is fully hand-rolled.
- **Animation and tweening** — PixiJS ships `AnimatedSprite` with `gotoAndPlay`/`gotoAndStop` (natural fit for timeline scrubbing), a `Ticker` with `deltaTime`, and a first-party GSAP PixiPlugin. Three.js has no flipbook-sprite primitive; Canvas 2D has nothing built in.
- **Performance** — PixiJS auto-batches sprites (up to 16 textures per batch) and `ParticleContainer` renders "1000s of particles at great speed" (weather effects). Comfortable at the hundreds-to-thousands scale. Three.js is GPU-class too but with 3D machinery overhead; Canvas 2D is CPU-bound and the ceiling risk at that entity count.
- **Bundle size and Next.js fit** — `pixi.js` 8.19.0 is ~246 KB min+gzip vs `three` ~178 KB, but Three.js would also need react-three-fiber plus `transpilePackages: ['three']`. All candidates need the same client-only pattern (`ssr: false` inside a Client Component); no Vercel blocker for any.
- **Learning curve and ecosystem** — PixiJS's 2D scene-graph mental model matches the job exactly; no camera/lighting/projection concepts to learn. `@pixi/react` 8.x supports React 19. react-three-fiber has the deeper ecosystem, but that depth buys 3D features this MVP does not need.

Runner-up: Three.js + react-three-fiber, only worth it if true 3D (camera rotation, lighting) enters the roadmap. Side check: Phaser does not clearly beat either candidate — heaviest bundle (~352 KB gzip), full game-framework architecture, no first-party React renderer.

Findings with primary-source citations: [research/01-rendering-tech.md](../research/01-rendering-tech.md)
