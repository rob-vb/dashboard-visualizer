# Grilling: does an Entity move?

Type: grilling
Status: open
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
