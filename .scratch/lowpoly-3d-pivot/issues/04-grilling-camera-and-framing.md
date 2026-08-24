# Grilling: camera and framing

Type: grilling
Status: resolved
Blocked by: —

## Question

Does the World keep a fixed isometric camera, or does the viewer get to orbit and zoom?

This is the decision that says what the pivot is *for*. If the camera stays locked, real 3D buys better assets and real lighting, and nothing else — a case that ticket 08 must then win on looks alone. If the camera moves, the World becomes a place the user explores, and that is a product change, not a render change.

Settle:

1. **Camera model.** Locked orthographic isometric (the 2D look, rendered in 3D); orthographic with snap-rotation to four or eight angles; or free orbit with a perspective camera.
2. **Zoom.** Fixed frame, or free zoom from whole-World down to one **Entity**?
3. **What "isometric" still means.** `CONTEXT.md` defines **World** as "the rendered isometric scene". If the camera orbits freely, that word is wrong and the glossary needs an edit.
4. **The Ranger station layout.** Spec §4 fixes page layout variant B — framed world, stats header, subscriber roster with hover-highlight and click-to-center. A moving camera changes what click-to-center means. Does the layout survive intact?
5. **Camera state and the Timeline.** Scrubbing already moves the World through time. Does the camera position persist across a scrub, across a reload, into a share link?

Consult `mattpocock-skills:grilling` and `mattpocock-skills:domain-modeling`. If this changes the meaning of **World**, update `CONTEXT.md` in the same session.

> **Superseded in part, 2026-08-24.** The user drove the gate prototype and asked for a
> free camera turn, which removes the constraint most of this answer rests on. Q1, Q6,
> Q9 and Q11 are re-opened by [ticket 13](13-grilling-camera-redecided.md); read that
> ticket before treating anything below as settled. Q3, Q5, Q8, Q10 and Q12 are not
> known to be affected, but ticket 13 confirms them rather than assuming them.

## Answer

> ⚠️ **Superseded 2026-08-24 by [Grilling: the camera, re-decided](13-grilling-camera-redecided.md).**
> Read that ticket for the camera the app ships. What died here: the orthographic
> projection (Q1), the four-stand rule (Q1, Q7), the fixed pitch and its occlusion
> arithmetic (Q6), the 3.0 grid density (Q9), the share link's snap-on-touch (Q11),
> and the claim that "isometric" survives in `CONTEXT.md`. What survives, restated
> there: free clamped zoom (Q2), the 400 ms translate-only `centerOn` with its raycast
> fallback (Q3, Q8), camera state across scrub / reload / share link (Q5), the camera
> held still during replay (Q12), and the Ranger station layout (§ "Does the Ranger
> station layout survive?"). The text below is kept as the record of why the
> constraint looked right before the gate was built.

**Orthographic, fixed pitch at true isometric (35.264°), snap-rotating between four diagonal yaw stands, with free clamped zoom.** Settled with the user 2026-08-20 across twelve questions in three rounds.

The ticket framed this as "the decision that says what the pivot is for". The answer is a deliberate middle: the camera moves, but only between four known states. That buys the one thing a locked camera cannot give — **a way out of occlusion** — without buying the thing free orbit costs, which is a look nobody can guarantee.

### The camera

| | |
|---|---|
| **Projection** | `OrthographicCamera` |
| **Pitch** | 35.264° (true isometric), fixed |
| **Yaw** | four stands at 45° / 135° / 225° / 315° in grid space — the four grid diagonals |
| **Default stand** | the one that reproduces the approved 2D view |
| **Zoom** | free, clamped: fully out = the whole World fits; fully in = one Entity fills ~⅓ of the frame |
| **Roll** | none |

**Q1 — snap-rotate, not locked and not free orbit.** Three reasons. It keeps `CONTEXT.md`'s word "isometric" honest — same projection, same pitch, four canonical views. It solves occlusion, which a locked camera cannot. And it protects the share link: four known framings that can each be made to look good, against infinitely many of which most look bad. Free orbit turns the World into a place to explore — a genuine product change this ticket does not need to buy, paid for with a look that can no longer be guaranteed.

**Q7 — the stands are the grid diagonals** because `isoToScreen()` (`world.js:21`) already computes `(gx - gy)`: the 2D camera looks down a diagonal. Defaulting to the stand that reproduces today's view means the first frame anyone sees is the frame the user already approved on 2026-08-18, and the other three are pure gain.

### The pitch angle, and the occlusion arithmetic that chose it

**Measured from the prototype:** `sprites.js:11-12` sets `TILE_W = 32`, `TILE_H = 16`. That 2:1 ratio is a pitch of `atan(0.5)` = **26.565°** — the classic game "isometric", which is dimetric, not isometric.

An object of height `h` hides `h / tan(θ)` of ground depth behind it, in a column about one tree wide. With ticket 05's tier-4 effective height of 2.51 units against a 1.0-unit tile:

| pitch | hidden depth | vs 2D |
|---|---|---|
| 26.565° (the 2D angle) | **5.02 tiles** | — |
| **35.264° (chosen)** | **3.55 tiles** | −29% |
| 45° | 2.51 tiles | −50% |

**Q6 — 35.264°.** The 29% is free, and it makes the glossary word literally true rather than loosely true. The argument for keeping 26.565° ("preserve the approved look") is weaker than it appears: that angle was chosen for flat sprites that had nothing to occlude with. Ticket 05's 3.07× height span is what makes it expensive, and that span did not exist when the angle was picked. 45° was rejected as too near top-down — it flattens the volume that is the whole point of the pivot.

**Build the pitch as a knob in the prototype** so ticket 08 shows both angles side by side. The user should see this, not take it on arithmetic.

**Q9 — the grid opens up from 1.9 to 3.0 cells per Entity.** `world.js:37` currently sets `gridN = ceil(sqrt(entities × 1.9))`, about 53% occupancy. At 3.0 it is about 33%. Rough combined effect with the pitch change: the expected number of Entities standing in that hidden column falls from ~2.7 to ~1.2, call it a 2.3× improvement. Also a knob for ticket 08 — the World may look too sparse and want a value between.

**Q4 — occlusion is solved by rotation plus spacing, and explicitly not by transparency.** Making occluded Entities translucent fights instanced rendering exactly as the cross-fade did in ticket 05: `InstancedMesh` has no per-instance opacity. The hard constraint that rules out the obvious fix — sorting tall Entities to the back — is ticket 06's prefix-stable placement: an Entity keeps its spot forever, so it cannot be re-sorted the moment it grows.

### Interaction

**Q2 — free zoom, with meaningful clamps.** Beyond "one Entity fills a third of the frame" the viewer cannot tell where they are; that is not a feature, it is a lost user.

**Q3 — `centerOn` flies, ~400 ms with easing, and translates only.** Zoom and yaw hold. Changing three things at once destroys the sense of where the Entity sits relative to everything else. Research 02 (`research/02-threejs-nextjs-scale.md`, the API-migration table) notes the 3D version is *cheaper* than the 2D one — moving a camera beats translating a scene container.

**Q8 — one exception to Q3.** Centering on a hidden Entity centers on nothing. So: cast one ray from camera to target; only if it is blocked, rotate to the nearest stand that clears it. Four raycasts cost ~2.3 ms at research 02's measured 0.577 ms each, and the check only fires when it matters, so the common case stays still.

**Q10 — touch: one finger pans, pinch zooms, two on-screen buttons step the yaw.** `OrbitControls` maps one-finger drag to rotate by default, which is wrong here — there are only four stands. Do not hide rotation in a gesture: buttons are unambiguous and they advertise that rotation exists. Research 02 already requires ticket 08 to measure a phone.

### Camera state

**Q5**, three cases:

- **Across a Timeline scrub — persists, always.** Resetting the camera while the user drags the slider makes scrubbing unusable. This includes the Today button.
- **Across a reload — resets to the default stand.** The owner and a first-time visitor should meet the same confident first frame.
- **Into the share link — a curated framing, never the owner's last position.**

**Q11 — the share link gets its own hand-tuned position**: lower and tighter than the four stands, with variant C's night lighting. It deliberately breaks the four-stand rule, because that rule exists to protect the *working* view and a single curated opening frame does not need it. **It is interactive**: the moment the viewer pans or zooms, the camera snaps to the nearest of the four stands and behaves normally from then on. A beautiful first frame and a usable tool afterwards. Research 02 notes the parked "diorama" framing is now just a camera position, so this costs one tuned transform.

**Q12 — the camera holds still during replay.** The replay already compresses 36 months into ~6 seconds; moving the camera on top of that makes it impossible to read *what* changed, because the fixed frame is the reference growth is measured against. Secondary: `frameloop="demand"` renders only on change, and a permanently drifting camera spends that saving for nothing.

### Does the Ranger station layout survive? Yes.

Spec §4 fixes page layout variant B. Nothing in it breaks:

- roster hover → highlight the Entity: a per-instance `setColorAt` write, per research 02
- roster click → centre: now a 400 ms fly, with the Q8 occlusion fallback
- framed world, stats header: untouched

One addition: the layout needs a home for the two yaw buttons. That is a placement decision for ticket 08 and `frontend-design`, not a structural change.

### `CONTEXT.md`

The word **isometric** survives and becomes more accurate, not less — at 35.264° the projection is literally isometric, where the 2D prototype's 26.565° never was. The **World** entry gains one sentence recording the four fixed camera positions. Edited in this session.

### Deleted code

Confirming research 02's list, now that the camera model is fixed: `isoToScreen()` (`world.js:21`), the `zIndex = spot.x + spot.y` painter sort (`world.js:78`), and the hand-rolled pointer/wheel pan-zoom (`world.js:247-263`) all go. An `OrthographicCamera`, the depth buffer, and `MapControls` replace them.

### Consequences for other tickets

- **[Ticket 06](06-grilling-signal-vocabulary-3d.md) is unblocked** — it waited on 01 and 04, and both are now resolved. It is the last thing between here and the gate.
- **[Ticket 08](08-prototype-3d-forest-gate.md)** — build the pitch (26.565° vs 35.264°) and the grid density (1.9 vs 3.0) as knobs and put both in front of the user. Add the two yaw buttons. Measure a phone with the touch scheme above.
- **[Ticket 11](11-task-update-spec-and-adr.md)** — spec §4's "variant B, Ranger station" survives intact and needs the camera model added beside it. The share-link framing decided here retires the closed effort's parked "variant C" as a separate layout: it is a camera position now.
- **The map's fog item "the share-link view under a 3D camera" graduates** — Q11 answers it.
