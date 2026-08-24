# Prototype: the 3D City World — the light gate

Type: prototype
Status: open
Blocked by: —

## Question

Does the **authored** City World look good enough to write into the spec?

[Ticket 09](09-grilling-city-theme-3d.md) decided the City is not bought from a
kit — we generate its geometry in code. Every other Theme decision on this map
rests on a look that somebody had already made: Kenney's trees earned the
Forest gate on their own merits. **Nobody has seen this one.** That is the whole
reason this ticket exists, and it is the same argument that created
[ticket 08](08-prototype-3d-forest-gate.md).

This gate is **light**. Ticket 08 gated the entire pivot and had to certify
draw calls, fold cost, tier ladders and ADR-0001. All of that is already
certified. This ticket gates one Theme's look, on a harness that exists.

## What to build

Reuse `prototypes/forest-world-3d/` — the same mock Signals from
`prototypes/signals/mock-signals.js`, the same camera from
[ticket 13](13-grilling-camera-redecided.md), the same page and HUD. **Swap only
the Theme.** Do not rebuild the harness, and do not touch the Signal layer:
driving a second Theme off the unchanged generator is ADR-0001 proving itself a
second time, which is worth having for free.

Build from ticket 09's definition:

- One storey, one roof (a few types), one ground floor, one road tile, one
  street light — generated in code as `BufferGeometry`, flat-shaded, untextured.
- A building is a **stack of storey instances**. Size Tier 1/2/4/8 storeys.
- Dusk lighting. Neutral facades, warm-lit window strips.
- Flat street grid on the existing cell grid, on a raised slab with a hard edge.
- Risk on the facade (`#d1913c` / `#c2612f`), window strips as the second channel.
- Ticket 06's three FX pools, unchanged.

## The verdict to ask for

The same question ticket 08 asked, and it must come from the user, not from the
agent:

1. **Does it land?** Against the 3D Forest, which is the bar now — not against
   the pixel world, which is deleted.
2. **Does a storey appearing read as growth?** This is the whole reason the map
   walked away from a kit. If `grew` does not read, the authoring argument
   collapses and Kenney City Kit comes back on the table at 13.3× the triangles.
3. **Is a churn wave bearable?** Ticket 09 predicted a dusk city of dark
   buildings is grimmer than a forest of stumps, and answered it on paper with
   always-lit street lights and a redevelopment fence. Show a bad quarter and
   find out.
4. **Does rain at dusk over a grey city read as gloom?** Ticket 09's one
   deliberately unresolved risk. The warm-white cloud is the mitigation already
   in place; if it is not enough, this is where the City earns its own FX form.

## Knobs to expose

Ticket 08's lesson was that the first look was only *"it's fine"* and three
knobs turned it. Expose the equivalents rather than committing to numbers:

- storey height, and the slab edge height
- road spacing (every Nth cell line)
- dusk sky and light colour, window glow strength
- facade neutral, and the roof colour palette
- cloud/spark pool caps, and the rain-on-city toggle from verdict 4

## Not in scope

Frame rates on real hardware — that is
[ticket 15](15-task-measure-device-fps.md), which is still open for the Forest
too. This gate is about the look. Say so in the write-up rather than implying a
number was taken.
