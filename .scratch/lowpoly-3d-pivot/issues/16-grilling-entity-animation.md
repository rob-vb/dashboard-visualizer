# Grilling: does an Entity move?

Type: grilling
Status: resolved
Blocked by: —

## Question

Whether a Subscriber's **Entity** animates at all. The map has answered this once, by
accident, and only for one Theme.

The Forest shipped **ambient sway** — desktop only, off under `prefers-reduced-motion`
([ticket 06](06-grilling-signal-vocabulary-3d.md) Q12) — plus a ~600 ms scale tween on
a Size Tier change ([ticket 05](05-grilling-size-tier-geometry.md) Q3). Both are vertex
maths inside the instance write; neither is animation in the sense that matters here.
Trees do not have skeletons.

**RTS does.** [Research 01](research/01-lowpoly-sources.md) picked **Quaternius Ultimate
Fantasy RTS** precisely because it ships *rigged units* — the gap neither pixel art nor
Polyfork could close. A rigged unit that never moves is a strange thing to have chosen.
And a rigged unit that *does* move breaks the one architectural promise the whole render
stack rests on: [research 02](02-research-threejs-nextjs-scale.md)'s **one
`InstancedMesh` per geometry**, which is why the World costs 41 draw calls at any Entity
count. Skinned meshes do not instance the same way.

Settle:

1. **Does an Entity move at all**, beyond sway and the tier tween? What would it even
   mean for a Subscriber to move — is there a Signal that says "walk", or is motion
   pure decoration?
2. **What motion costs at 1,583 Entities.** If skinned animation breaks instancing, the
   options are: no rigs; a small animated cast against a static majority; vertex-shader
   fakery (bob, bank, phase per instance) that stays inside the instance write; or
   baked vertex-animation textures. Price them, do not just list them.
3. **Whether the answer is the same for all three Themes.** A swaying tree, a city that
   holds still, and a marching soldier may be three different answers — but the map has
   preferred one mechanism per question so far ([ticket 05](05-grilling-size-tier-geometry.md)
   chose swap-not-rebuild *because* it was universal). Say which this is.
4. **What it does to `prefers-reduced-motion` and to mobile.** Sway is already
   desktop-only; motion that carries meaning cannot be.
5. **Whether motion should say something.** The Forest's FX pools already carry every
   Signal ([ticket 06](06-grilling-signal-vocabulary-3d.md)). If a unit's animation is
   decorative while its colour is semantic, a viewer will read the moving thing first.

This blocks [ticket 10](10-grilling-rts-theme-3d.md), which cannot define the RTS Theme
without knowing whether its units are rigs or statues. [Ticket 09](09-grilling-city-theme-3d.md)
should follow whatever this decides rather than deciding it again.

Consult `mattpocock-skills:grilling` and `mattpocock-skills:domain-modeling`.

## Update — the City has answered a piece of this (2026-08-24, from ticket 09)

[Ticket 09](09-grilling-city-theme-3d.md) gave the City an ambient loop that is
a **slow window-light twinkle on lit windows only** — a `setColorAt` brightness
variation, one instance per storey. Desktop-only and off under
`prefers-reduced-motion`, the same rule the Forest sway follows, and for the
same reason: a permanently animating World defeats `frameloop="demand"`.

So two Themes now animate **inside the instance write** and neither needs a rig.
That sharpens this ticket rather than settling it: the open question is entirely
about the RTS Theme's rigged units, since a skinned mesh is the one form that
does not fit the instancing budget the whole World depends on.

## Answer (2026-08-24)

**No skeleton, anywhere, ever. All motion lives inside the instance write, and it
splits into two kinds that obey opposite rules.**

### The premise was wrong, and correcting it made the ticket easy

This ticket opens by saying research 01 chose Quaternius Ultimate Fantasy RTS
"precisely because it ships *rigged units*". [Research 01](../research/01-lowpoly-sources.md)
does not say that. The pack is **128 static meshes — buildings in evolution stages
plus nature assets** — and the research is explicit that Quaternius ships "static
meshes, no parameters, same limitation as Kenney". Rigged figures live in *other*
Quaternius packs (Modular Men/Women, RPG/Animated Characters), and the same
research warns that Quaternius packs "vary in style more than Kenney's do", with
coherence guaranteed only *within* a pack.

So the rig was never a delivered asset of the chosen pack. It was always a second
download, in a second art style, feeding a `SkinnedMesh` code path the renderer
does not have. The ticket's framing — *"a rigged unit that never moves is a strange
thing to have chosen"* — dissolves: nothing rigged was ever chosen.

### Q1 — An RTS unit is Scenery, not an Entity

An **Entity** represents exactly one Subscriber. In the RTS Theme the **building**
is the Entity, and the pack's evolution stages are its Size Tier ladder — that is
the whole reason research 01 ranked it first. A soldier or a villager represents
nobody. It is **Scenery**, the same category as the Forest's grass and rocks and
the City's street lights.

This reframing is what makes the cost question disappear. Scenery is a **fixed
cast**: it does not scale with the Subscriber count, so it cannot threaten a
draw-call budget that is defined by being independent of Entity count. A moving
cast of ten costs ten draw calls at 237 Entities and ten at 3,167.

**`CONTEXT.md` gained a `Scenery` entry in this session** — the glossary had no
word for a thing in a World that represents no Subscriber, and Q1 made that
category load-bearing.

### Q2, Q5 — Two kinds of motion, opposite rules

| | **Ambient motion** | **Transition motion** |
|---|---|---|
| shape | a loop, runs forever | plays once, at a state change |
| meaning | **none, ever** | the change it plays, and nothing else |
| may be switched off? | **yes, with nothing lost** | **no — runs on every device** |
| members | Forest sway, City window twinkle, any Scenery loop | Size Tier change; the day-90 residue swap |

Ticket 06 gave every Signal a colour channel and an FX pool. If a walk cycle were
decorative while colour was semantic, the viewer would read the moving thing first
and learn the wrong lesson. Hence: **ambient motion never carries a Signal.**

The split was forced by the code, not invented for tidiness. `world3d.js:547` gates
sway behind `motion()`; the tier tween at `world3d.js:541` is **not** gated and plays
regardless. The prototype has treated these as two classes since the gate. The map
had never said so.

### Q9, Q13 — Transition motion has exactly two members, and one mechanism

My first recommendation here was **wrong and is withdrawn**: I proposed that a churn
should play a fall or a collapse. [Ticket 06](06-grilling-signal-vocabulary-3d.md) Q7
had already decided otherwise, deliberately and better. At the moment of churn the
Entity **keeps its geometry and its Size Tier and stands there**, sway stopped, its
canopy tint ramping green → `#7d6f5f` across the 90-day Mourning Window. That says
*that tree died*; a felled pine would say *logging*. The geometry changes only at
day 90, when it swaps to a stump with the same 600 ms tween a tier change uses.

So transition motion is not two effects but **one mechanism used twice: a geometry
swap, covered by a tween.** The moment of churn plays nothing — it starts a colour
ramp. Payment Signals get no transition at all; they are frequent, and a World that
twitches on every payment reads as noise. `appeared` and `returned` keep ticket 06's
FX pools, which are transition enough.

### Q10 — Transition motion follows the scrub rule, generalised

Ticket 05 wrote the rule for one tween. It now covers the class: **transition motion
plays live and in replay, and hard-cuts on a scrub.** A scrub is the viewer reading
a state, not watching a moment.

### Q6 — When ambient motion switches off, and why the reason matters

Off under `prefers-reduced-motion`. Off on a coarse pointer. Both unchanged from
ticket 06 Q12 — but **the recorded reason changes**, and that is the point.

[Ticket 15](15-task-measure-device-fps.md) found no mobile ceiling and forbade any
device-sniffing downgrade ladder. "Sway off on mobile" now looks exactly like the
thing that ticket banned. It is not. The reason is **battery and the demand loop**:
a permanently animating World defeats `frameloop="demand"` and holds the GPU awake.
It is not a frame-budget fear, and it must never be written down as one.

Worth recording honestly: **ticket 15's iPhone reading never included a
continuously animating World**, because `world3d.js:173` gates sway off on
`pointer: coarse`. The peak per-frame cost *was* measured (replay-while-dragging
rewrites every instance), so the unmeasured quantity is sustained battery drain,
not peak frame time.

One tightening: under `prefers-reduced-motion`, the tier and residue tweens
**hard-cut** rather than ramp. Ticket 06 Q12 already said this; the prototype does
not do it yet, since `world3d.js:541` ignores `motion()`. That is a build note, not
a new decision.

### Q14 — Stopped sway is redundancy, never a cue

Ticket 06 stops the sway on a churned Entity. Under the new rule that is a Signal
riding on ambient motion, which is forbidden — and on mobile, where there is no
sway at all, a World of living trees would read as dead.

Resolved: **stopped sway may repeat what colour already says, and may never be the
only cue.** Colour carries churn on every device. This limit is what keeps "ambient
motion is optional" true, so it belongs in the ADR rather than in a comment.

### Q3, Q4, Q8 — The universal rules

- **One rule for all three Themes**, in the spirit of ticket 05's swap-not-rebuild:
  **motion lives inside the instance write; no Entity and no Scenery uses a
  skeleton.** Each Theme expresses it differently — sway, twinkle, a cart that
  slides — but no Theme rigs anything.
- **No rigs are bought.** Even as Scenery, a rig costs a second pack, a style
  mismatch, a `SkinnedMesh` path the renderer lacks, and clips the pack may not
  ship. Motion is bought with instance writes only.
- **Scenery is Signal-blind and fixed.** More villagers when MRR grows would be
  readable and tempting, and it would make Scenery semantic — contradicting both
  its definition and ADR-0001's line that Themes never read data. Its count never
  varies with the Subscriber count, which is exactly what makes a moving cast
  affordable at all.

### What this hands downstream

- **[Ticket 10](10-grilling-rts-theme-3d.md) is unblocked** and inherits a rule plus
  a budget: no skeleton; the cast is fixed and Signal-blind; **Scenery costs at most
  ~10 draw calls** on top of the Entity meshes. Ticket 10 chooses what the cast is,
  and must not re-open rigs. It also inherits the correction above — Ultimate Fantasy
  RTS ships no rig, so "buildings are the Entities" is not a fallback but the design.
- **[Ticket 11](11-task-update-spec-and-adr.md) gains a third ADR**: *motion lives in
  the instance write; nothing is rigged*, carrying the ambient/transition table, the
  scrub rule, the battery-not-performance reason, and the redundancy limit on stopped
  sway. Plus the `CONTEXT.md` **Scenery** entry, already written.
- **Build note for the prototype**: gate the tier tween on `prefers-reduced-motion`
  so it hard-cuts. Currently it always ramps.
