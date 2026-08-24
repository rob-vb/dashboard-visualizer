# Grilling: the camera, re-decided

Type: grilling
Status: resolved
Blocked by: —

## Question

[Ticket 04](04-grilling-camera-and-framing.md) chose a camera that cannot turn freely.
The user has now asked for one that can, after driving the gate prototype on
2026-08-24: *"we should make turning available not just by clicking turn buttons and
have just 4 camera positions, but a free camera turn would be nice."*

That is a decision, not a preference to be argued away — it is already built in
[ticket 08](08-prototype-3d-forest-gate.md) (right-drag / shift-drag / shift+wheel on
desktop, two fingers on touch, free pitch behind a knob). What is *not* decided is
everything ticket 04 bought with the constraint it just lost. This ticket re-decides
the camera as a whole, so the map holds one camera model rather than two.

**If ticket 08 ends in a "no" verdict, close this ticket unused** — PixiJS stands and
there is no 3D camera to decide.

### What ticket 04 bought with "four stands", and now has to buy again

- **Q1 — the share link.** Ticket 04 Q1's stated reason for snapping was *"four known
  framings that can each be made to look good, against infinitely many of which most
  look bad"*, and Q11 built the share link on exactly that: a hand-tuned opening frame
  that snaps to the nearest stand the moment the viewer touches it. With free turn,
  what does the share link open at, and what does it snap to — anything?
- **Q2 — free pitch, or free yaw only.** The prototype tilts as well as turns, behind
  `KNOBS.freePitch`. `CONTEXT.md`'s **World** entry currently says the camera *"is
  orthographic at a fixed isometric pitch and snaps between four fixed positions"*.
  Both halves of that sentence are now in question. If the pitch is free, is the
  Theme still isometric in any sense worth the word?
- **Q3 — orthographic, or the lens.** Ticket 08 added `KNOBS.lensDeg`, an 18°/30°
  perspective camera framed to match the ortho view, and the user's read was *"feels
  more 3D"*. Ticket 04 Q1 fixed the projection as orthographic. Which ships? A lens
  and a free camera are the same argument twice; decide them together.
- **Q4 — what the four stands are for now.** They survive in the prototype as the turn
  buttons, Q/E and the share-link snap. Are they a convenience (a "straighten up"
  affordance), the reset state, or dead weight?
- **Q5 — ticket 04 Q6's pitch arithmetic is void.** 35.264° was chosen because it hides
  3.55 tiles of depth behind a tier-4 Entity against 26.565°'s 5.02. That arithmetic
  assumed the viewer *cannot* change the angle. If they can, occlusion is theirs to
  solve, and the pitch default becomes a question of first impression, not of hidden
  Entities. What is the opening pitch, and why?
- **Q6 — ticket 04 Q9's grid density is void for the same reason**, and the gate
  already found it wanting: 3.0 cells per Entity was picked to reduce occlusion and
  reads as *"it really doesn't feel like a forest, the trees are too far apart"*. The
  prototype now runs at 1.3. Pick the number deliberately rather than inheriting it.
- **Q7 — camera state.** Ticket 04 Q5 fixed three cases: persists across a scrub,
  resets across a reload, curated into the share link. Does a free camera change any
  of them — in particular, is a reset still *"the same confident first frame"* when
  the viewer may have left the camera anywhere?
- **Q8 — Q12 held the camera still during replay.** That reasoning (a fixed frame is
  the reference growth is measured against) does not depend on snapping, so it
  probably survives — confirm rather than assume.

### What this ticket must hand on

- A single camera model, written so [ticket 11](11-task-update-spec-and-adr.md) can put
  it in the spec and rewrite `CONTEXT.md`'s **World** entry, which ticket 04 edited on
  the assumption of four fixed positions.
- Whichever of ticket 04's answers survive, restated — the reader of this map should
  not have to diff two tickets to learn what the camera does.

Consult `mattpocock-skills:grilling` and `mattpocock-skills:domain-modeling`.

## Answer

**A free camera behind a long lens, with one button that straightens it up.** Settled
with the user 2026-08-24 across ten questions in three rounds. This answer replaces
[ticket 04](04-grilling-camera-and-framing.md) as the map's single camera model —
ticket 04 is now history, not reference.

The shape of the reversal: ticket 04 bought a guaranteed-good look by taking the camera
away from the viewer (four stands, fixed pitch, orthographic). The gate prototype showed
that price is too high — a camera the viewer cannot move does not read as 3D, and the
user asked for free turn while driving it. So the guarantee moves from *constraint* to
*recovery*: every frame is reachable, and one control brings the viewer back to a frame
we authored.

### The camera

| | |
|---|---|
| **Projection** | perspective, long lens, **~20° FOV** (`KNOBS.lensDeg`), framed to match the ortho view it replaces |
| **Yaw** | free — right-drag, shift-drag or shift+wheel on desktop, two fingers on touch |
| **Pitch** | free, clamped **10°–78°** (the prototype's existing clamp, kept as-is) |
| **Zoom** | free, clamped: fully out = the whole World fits (`fitZoom × 0.85`); fully in = one Entity fills ~⅓ of the frame. Zooms to frame centre, not to the cursor — under a lens the ground point under the cursor depends on eye position |
| **Roll** | none |
| **Opening frame** | pitch **35.264°**, zoom **1.9**, yaw on the grid diagonal that reproduces the approved 2D view |
| **Grid density** | **1.3 cells per Entity** |
| **Four stands** | demoted to a **recover control** — see Q5 |

**Q1 — the long lens ships, orthographic does not.** The user's read on the gate was
*"feels more 3D"* with `KNOBS.lensDeg` on. The pivot exists to show volume; the
projection that shows it most is the one that ships. Two costs accepted explicitly:
the word **isometric** leaves the glossary (Q9), and **zoom-at-cursor is lost** —
under a lens the cursor→ground mapping moves with the camera, which is the same
feedback loop that caused the panning shake ticket 08 fixed. Zoom goes to centre.
`KNOBS.pitchDeg`'s 26.565° comparison value dies with this: it existed to match a 2D
projection this camera no longer imitates.

**Q2 — pitch is free, clamped 10°–78°, exactly as the prototype already has it.** The
user was offered a tighter 18°–60° clamp and chose the wide one after seeing both
extremes. The reasoning that survives: a viewer who can turn will try to tilt, so
blocking tilt reads as broken. The reasoning that was overruled: that we should only
allow frames we can defend. **We can no longer promise every reachable frame looks
good.** That is a deliberate trade, and it is what makes Q5 and Q7 load-bearing —
the wide clamp is affordable *because* there are two cheap ways back (the recover
button and a reload).

**Q3 — grid density is 1.3 cells per Entity.** Ticket 04 Q9's 3.0 was occlusion
arithmetic, and the gate answered it in a sentence: *"the trees are too far apart"*.
With a free camera, occlusion is the viewer's to solve by turning. **Density now
serves the look alone** — it is a woodland-feel number, not a visibility number.
1.9 and 3.0 stay in the prototype's panel as history, not as options.

**Q4 — the camera holds still during replay** (ticket 04 Q12 confirmed, not assumed).
The fixed frame is the reference growth is measured against, and that reason never
depended on snapping. One clarification the free camera forces: **held, not locked** —
the viewer may turn during a replay; the app simply does not move the camera itself.

**Q5 — the four stands become the recover control.** They are neither a rule nor dead
weight. One press of a turn button (or Q/E) steps the yaw to the next 90° stand **and
eases the pitch back to the 35.264° default**, over the existing 400 ms. This is the
answer to the wide pitch clamp: any viewer who tilts into a hedge or a top-down map is
one button from a frame we authored. The buttons keep their second job — they advertise
that the World turns at all, which a drag gesture alone never does.

**Q6 — the opening frame is the frame that earned the verdict**: 35.264°, zoom 1.9,
the approved diagonal, density 1.3. Ticket 04 Q6 chose 35.264° on occlusion arithmetic
(3.55 hidden tiles vs 26.565°'s 5.02); **that arithmetic is void** — the viewer solves
occlusion now. The angle survives on different grounds: it is the angle the user saw
when they said the forest reads, and first impressions are decided by looking, not by
computing.

**Q7 — camera state, unchanged from ticket 04 Q5.** Persists across a Timeline scrub
including the Today button (resetting mid-drag makes scrubbing unusable); resets to the
Q6 opening frame on reload. The free camera makes the reset *stronger* than it was: it
is the second way out of a bad angle.

**Q8 — the share link keeps its curated frame and loses the snap.** The hand-tuned
night diorama position (lower and tighter than any stand) opens the link, because a
stranger's first impression is worth authoring. But **the first touch no longer snaps
to the nearest stand** — that snap existed only to enforce the four-stand rule, and a
camera that jumps away the instant you touch it reads as a bug. The viewer takes over
from the diorama frame and turns freely; the recover button is their way back. One
camera behaviour everywhere, with one authored entry point per surface.

**Q9 — `CONTEXT.md`'s World entry drops "isometric" and drops the camera detail.**
Every clause of the current sentence is now false, and a glossary should not carry
build detail anyway. The new entry, written in this session:

> **World**: The rendered three-dimensional scene that represents one business at one
> point in time. The viewer sees it from a raised angle and can turn and tilt it.

The lens angle, the clamps and the opening frame belong in the spec. Ticket 04's
claim that *"isometric survives and becomes more accurate"* is retired.

**Q10 — this gets an ADR**, written by [ticket 11](11-task-update-spec-and-adr.md).
It meets all three tests: hard to reverse (the whole interaction model and the
share-link design hang off it), surprising without context (every older document in
this repo says "isometric"), and the result of a real trade-off (a guaranteed look
versus a camera that reads as 3D). What the ADR must say: the pivot's own gate proved
that a constrained camera undersells volume; we chose reachability plus recovery over
guarantee, and we accept that some reachable frames look bad.

### Decided by the build, recorded here

Free look on touch is **two fingers** — pinch zooms, sliding the pair turns and tilts.
Ticket 04 Q10 gave one finger to pan and reserved rotation for buttons; the prototype
already changed this and it stands. The buttons remain, now as the recover control.

### Consequences for other tickets

- **[Ticket 11](11-task-update-spec-and-adr.md)** — `CONTEXT.md` is already updated in
  this session, so ticket 11 owes the spec §4 camera section and the new camera ADR.
  Ticket 04's camera table must not be copied into the spec; this one supersedes it.
- **[Tickets 09](09-grilling-city-theme-3d.md) and [10](10-grilling-rts-theme-3d.md)** —
  both inherit a free camera. City is the Theme most exposed to it: a dense grid of
  buildings occludes far worse than trees, and the viewer, not the layout, now fixes
  that.
- **[Ticket 08](08-prototype-3d-forest-gate.md)** — unaffected; the verdict is still
  outstanding and still the user's to give. If it is "no", this answer dies with the map.
