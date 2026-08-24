# Prototype: the 3D Forest World — the gate

Type: prototype
Status: resolved
Blocked by: 01, 02, 04, 05, 06, 12

## Question

Does a low-poly 3D Forest World earn the same verdict the pixel-art Forest World got?

**This ticket is the gate for the whole map** (user decision, 2026-08-18). The user already approved the 2D Forest look on 2026-08-18: *"forest look lands"*. The pivot is only worth its cost if the 3D version beats that, or at least matches it while opening doors the sprites cannot.

Build a throwaway 3D Forest World beside the existing one at `prototypes/forest-world-3d/`. Do **not** touch or delete `prototypes/forest-world/` — it is the fallback and the thing being compared against.

Requirements:

- Drive it from the **same mock generator**, `prototypes/forest-world/mock-signals.js`. The Signal layer does not change (ADR-0001), so reusing it unchanged is the proof.
- Render the full **Entity** mapping decided in ticket 06: the four **Size Tiers**, payment rain, the **Risk Overlay**, churned trees and the 90-day mourning window.
- Use the camera model from ticket 04 and the tier mechanic from ticket 05, on the asset source from ticket 01, with the stack from ticket 02.
- Include the **Timeline** slider and replay. Scrubbing is where 3D is most likely to break — [ticket 06 of the closed map](../../isometric-dashboard/issues/06-prototype-timeline.md) proved the 2D version smooth, and deterministic placement must stay prefix-stable.
- Run it at a realistic Entity count, not five trees. Ticket 02 gives the target.

Then put it in front of the user, side by side with `prototypes/forest-world/`, and ask plainly:

1. Does the 3D World land as well as, or better than, the pixel-art World?
2. Does scrubbing still feel good?
3. Is anything lost that the sprites did well?

Consult `mattpocock-skills:prototype` and `frontend-design`.

## Update — what research 02 hands this ticket (2026-08-19)

- **Build it as instanced, not as 1,000 meshes.** One `InstancedMesh` per distinct geometry (the Size Tier ladder + churn states), all sharing one `MeshStandardMaterial({ vertexColors: true, flatShading: true })`, allocated once for "every Subscriber that ever appears" and never reallocated. Entity health state is a per-instance `setColorAt` multiply over `COLOR_0` — the same semantics as the PixiJS `tint` the prototype already uses. An `OrthographicCamera` plus `OrbitControls` replaces the hand-written `isoToScreen()`, the `zIndex` painter sort and the hand-rolled pan/zoom.
- **This ticket now owns the one thing research 02 could not certify: real frame rates.** The research machine had no GPU. Measure a mid-range laptop and a phone, and record the numbers in the answer. Mobile vertex throughput is the one plausible limit; `frameloop="demand"` is the first mitigation to try.
- **[Ticket 12](12-task-fix-fold-performance.md) must land first** — it is now a blocker. At 1,583 Entities the unfixed fold runs at ~8 fps, which would make the human verdict a verdict on a bug rather than on 3D.

**On a "no" verdict the map stops.** Record the verdict, close the map, keep PixiJS, and leave the spec untouched. That is a successful outcome, not a failure — it cost one prototype instead of a rewritten M1.

## Build log — 2026-08-24

The prototype is built; **the verdict is outstanding** and is the user's to give.
Source in `prototypes/forest-world-3d/` (see its `README.md`), served locally with
`node prototypes/forest-world-3d/serve.mjs`.

**Hosted, single-file:** https://claude.ai/code/artifact/0fdf9d44-f1ff-49f2-ade5-be0300dd5e45
— the whole World inlined (three.js, the Kenney geometry, the unchanged 2D mock
generator) so the gate can be judged from a phone and from behind a firewall. Built
by `build-artifact.mjs`; the 2D original it is compared against is already hosted at
https://claude.ai/code/artifact/27f15c28-493b-4470-9186-3889ff59b8df

### What it implements

- **Ticket 01** — Kenney Nature Kit, CC0. `extract-assets.mjs` reads the shipped GLBs
  once and writes `assets/geometry.json` (23 models, 348 KB), so no GLTFLoader ships.
  The extractor drops the two `_defaultMat` triangles and never imports the kit's
  materials, which sidesteps the `metallicFactor: 1` quirk entirely.
- **Ticket 02** — one `InstancedMesh` per geometry, allocated once for every
  Subscriber that ever appears. **Measured 41 draw calls at 1,583 Entities and 41 at
  3,167** — flat in the Entity count, as predicted, and within ticket 06's ~38 budget.
- **Ticket 04** — `OrthographicCamera`, fixed pitch (a knob: 26.565° vs 35.264°),
  four yaw stands with a 400 ms snap, free clamped zoom, 400 ms translate-only
  `centerOn` with the raycast occlusion fallback, two on-screen turn buttons.
- **Ticket 05** — the measured ladder, verbatim. Extraction reproduced ticket 05's
  height table to the millimetre (`pineGroundA` 0.915 … `pineTallD` 2.075), which
  independently confirms it. Variant is `floor(u × count)` and held for life; tier 3's
  `pineTallA` does hand tier 4 `pineTallB`.
- **Ticket 06** — canopy and trunk as separate meshes with their own colour channels,
  the two-level risk multiply, the 90-day churn ramp, three FX pools, per-Entity
  failure-cloud phase, desktop-only sway, `prefers-reduced-motion` honoured.

### Measured, in a browser (see the caveat below)

| | |
|---|---|
| Draw calls | **41** at 237 / 1,583 / 3,167 Entities |
| Triangles | 38k / 268k / 516k |
| Instance write (CPU) | **0.70 ms median, 0.40 ms min** at 1,583 — research 02 predicted 0.400 ms |
| `foldWorldState` | 2.6 ms median, 3.3 ms max at 1,583 during replay |
| Total CPU per replay frame | **~3.3 ms** at 1,583, against a 16.7 ms budget |

**Real frame rates are still not certified.** This machine has no GPU; Chrome ran on
SwiftShader, so its fps is meaningless and only the CPU-side numbers above transfer.
The HUD in the page prints `fps · frame ms (write / gl) · calls · tris · entities ·
fold ms` — the laptop and phone readings this ticket owes the map must be taken by
hand from a real device.

### First look — 2026-08-24, and what it changed

The user's first pass answered the three questions: **"it's fine"** on the look —
not the "this lands" the pixel-art Forest earned — **yes** on scrubbing, and
**nothing lost** from the sprites. Two specific objections, both acted on:

1. *"It doesn't really feel 3D because you have to turn manually."* The volume was
   there but nothing read it back without the viewer working for it. **The ground is
   now rolling, not flat** (seeded value noise, `KNOBS.relief`, one draw call
   unchanged): trees stand at different heights and cast across each other, so depth
   reads while the camera stands still. It also adds `KNOBS.lensDeg` — a long-lens
   perspective camera framed to match the ortho view. **That knob re-opens ticket 04
   Q1**, and is in the panel as a comparison, not as a decision.
2. *"It doesn't feel like a forest — the trees are too far apart."* Ticket 04 Q9's
   3.0 cells per Entity is too sparse to read as woodland. Default is now **1.3**
   (1.9 and 3.0 stay in the panel), Entities take a sub-cell offset so the grid stops
   reading as a grid, undergrowth rose from 11% to 42% of free cells, and the default
   framing moved from zoom 1.3 to 1.9 — standing in the forest rather than above the
   whole plot.

**Ticket 04 Q9 needs revisiting whatever the verdict**: the occlusion arithmetic that
chose 3.0 assumed a flat plane and did not weigh how sparse it looks.

### Second look — 2026-08-24

**"Feels more 3D."** The forest now reads. Two further items:

1. **The user asked for a free camera turn** — "not just by clicking turn buttons and
   have just 4 camera positions". Built: right-drag (or shift-drag, or shift+wheel)
   turns freely on desktop, two fingers turn on touch, and free look also tilts the
   pitch unless `KNOBS.freePitch` is off. The four stands survive as the turn buttons,
   Q/E and the share link's snap. **This is a user decision against ticket 04 Q1**,
   which chose snap-rotate precisely to avoid framings nobody can guarantee, and
   against Q6's fixed pitch. Ticket 04 has to be re-decided before the map closes —
   the open question is no longer *whether* the camera turns freely but what that
   costs the share link and the word "isometric" in `CONTEXT.md`.
2. **Panning shook.** Real bug, introduced with the lens. Panning re-intersected the
   ground plane under the cursor on every move; under a perspective camera that
   intersection depends on where the camera *is*, so each move fed its own result
   back and the target oscillated. Under the orthographic camera the mapping is
   independent of eye position, which is why it only appeared with the lens. Panning
   is now pure screen space: **three equal 40 px drags move the camera 0.5562 units
   each, identical under both projections.**

### Two things the build decided that the map did not

1. **The kit's palette is unusable.** Kenney's GLTF export carries no colormap, and
   its `baseColorFactor` values read as teal whichever colour space you assume
   (`leafsDark` → `#2ba6aa`). Ticket 06 already made the canopy ours; the trunk,
   stump and scenery colours are now hand-authored in `PALETTE`. This retires ticket
   05's note that "the whole forest can share one material".
2. **The World sits on a slab of soil.** The 2D World was also a bounded diamond of
   tiles, so a bounded plot is faithful — but 3D can show its depth, which turns the
   World into an object rather than a cut-out. One draw call. It is the one
   deliberate aesthetic risk in the build, and it is what makes the share-link
   framing work.

### Ticket 13's camera is now the default — 2026-08-24

[Ticket 13](13-grilling-camera-redecided.md) closed the camera question the second
look re-opened. What it decided is no longer a knob in this prototype; it is what the
World does on load:

- **A ~20° long lens ships** (`KNOBS.lensDeg: 20`). Orthographic stays in the panel as
  history so the two can still be put side by side — it is not an option the app offers.
- **Free yaw and free pitch**, pitch clamped 10°–78°, the wide clamp the user chose
  after driving both extremes.
- **The four stands are the recover control.** One press of ↺ / ↻ (or Q / E) steps the
  yaw a quarter turn *and* eases the pitch back to 35.264° over the same 400 ms. The
  turn buttons are relabelled "turn a quarter and straighten up".
- **The share link keeps its curated night diorama and loses the snap.**
  `snapToNearestStand()` is deleted.
- Opening frame 35.264° / zoom 1.9, density 1.3 — unchanged, now on ticket 13's grounds
  rather than ticket 04's void arithmetic. 1.9 and 3.0 stay in the panel as history.
- Zoom-to-cursor is gone under the lens (it is the same feedback loop that shook the
  pan); zoom goes to frame centre.

The hosted single-file build is republished at the same URL:
https://claude.ai/code/artifact/0fdf9d44-f1ff-49f2-ade5-be0300dd5e45

**The verdict is still outstanding and is still the user's to give.** Nothing else on
the map is takeable: [tickets 09](09-grilling-city-theme-3d.md) and
[10](10-grilling-rts-theme-3d.md) are blocked on this ticket, and
[ticket 11](11-task-update-spec-and-adr.md) on all three.

## Answer

**The gate passes.** Verdict given by the user 2026-08-24, on the build carrying
[ticket 13](13-grilling-camera-redecided.md)'s camera:

1. *Does the 3D World land as well as, or better than, the pixel-art World?* —
   **"it lands 100× better than the pixel world."** Not a tie the pivot has to argue
   its way out of: the 3D Forest beats the look the user approved on 2026-08-18.
2. *Does scrubbing still feel good?* — **yes.**
3. *Is anything lost that the sprites did well?* — **no.**

**The pivot is committed.** PixiJS 8 and the self-made pixel sprites are retired as the
render stack. [Research 01 of the closed map](../../isometric-dashboard/research/01-rendering-tech.md)
is superseded, and every ticket downstream of this gate is live.

### What earned the verdict, and in what order

The first look was **"it's fine"** — a pass, not a win, and not enough to spend a
rewrite on. Three changes turned it, and they are worth recording because each was a
user objection, not a designer's idea:

1. **Rolling ground, not a flat plane** (`KNOBS.relief: 0.9`). Volume was present but
   nothing read it back while the camera stood still. Trees at different heights cast
   across each other, so depth reads without the viewer working for it. One draw call.
2. **Density 1.3, not 3.0.** *"It doesn't feel like a forest — the trees are too far
   apart."* [Ticket 04](04-grilling-camera-and-framing.md) Q9's occlusion arithmetic
   had bought visibility at the cost of the thing being rendered.
3. **A camera the viewer can move, behind a long lens.** The second look — *"feels more
   3D"* — came from `KNOBS.lensDeg` plus free turn. This is the finding the map should
   carry forward: **a constrained camera undersells volume**, which is what sent the
   whole camera question back to [ticket 13](13-grilling-camera-redecided.md).

The order matters. Ground and density fixed *the World*; the camera fixed *the reading
of it*. Neither alone produced the verdict.

### What the build certified

| | |
|---|---|
| Draw calls | **41**, flat at 237 / 1,583 / 3,167 Entities |
| Triangles | 38k / 268k / 516k |
| Instance write (CPU) | 0.70 ms median at 1,583 (research 02 predicted 0.400 ms) |
| `foldWorldState` | 2.6 ms median, 3.3 ms max at 1,583 during replay |
| Total CPU per replay frame | **~3.3 ms** against a 16.7 ms budget |

ADR-0001 held: the Theme swap reused `prototypes/forest-world/mock-signals.js`
unchanged, which is the proof that the Signal layer does not care what renders it.
[Ticket 05](05-grilling-size-tier-geometry.md)'s measured height ladder reproduced to
the millimetre from the Kenney GLBs.

### The one thing this ticket owed and did not deliver

**Real frame rates are still uncertified.** This machine has no GPU; Chrome ran on
SwiftShader, so only the CPU-side numbers above transfer. The verdict was given on the
look, which is what the gate was for — but the map must not treat "the gate passed" as
"3D performs". That measurement graduates to **[ticket 15](15-task-measure-device-fps.md)**
rather than dying here.

### Consequences

- **[Tickets 09](09-grilling-city-theme-3d.md) and [10](10-grilling-rts-theme-3d.md)
  are unblocked** — the City and RTS Themes in 3D.
- **[Ticket 13](13-grilling-camera-redecided.md) survives.** It was written to die with
  a "no" verdict; it now stands as the map's camera model.
- **[Ticket 14](14-grilling-pixijs-fate.md)** graduates from the fog: what happens to
  `prototypes/forest-world/`, now that it is no longer the fallback.
- **[Ticket 16](16-grilling-entity-animation.md)** graduates: whether an Entity moves
  at all. The Forest answered it by accident (sway only, desktop-only); RTS ships
  rigged units and cannot.
- **[Ticket 11](11-task-update-spec-and-adr.md)** may now rewrite the spec — the "no
  production work until the gate passes" rule in the map's Notes is discharged.
