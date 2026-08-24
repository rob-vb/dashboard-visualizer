# Prototype: the authored Worlds — the light gate

Type: prototype
Status: open
Blocked by: 09, 10

## Question

Do the **authored** City and RTS Worlds look good enough to write into the spec?

> **Widened 2026-08-24 by [ticket 10](10-grilling-rts-theme-3d.md).** This ticket
> was written to gate the City alone. The RTS Theme then also chose to author its
> Entities, so it carries the same unproven-look risk. The user chose **one gate
> for both** over a second gate ticket, to keep the map short. The two Themes
> carry **different** risks and this ticket must ask both — see *The verdict to
> ask for* below.

## Part 1 — the City

[Ticket 09](09-grilling-city-theme-3d.md) decided the City is not bought from a
kit — we generate its geometry in code. Every other Theme decision on this map
rests on a look that somebody had already made: Kenney's trees earned the
Forest gate on their own merits. **Nobody has seen this one.** That is the whole
reason this ticket exists, and it is the same argument that created
[ticket 08](08-prototype-3d-forest-gate.md).

This gate is **light**. Ticket 08 gated the entire pivot and had to certify
draw calls, fold cost, tier ladders and ADR-0001. All of that is already
certified. This ticket gates one Theme's look, on a harness that exists.

### What to build — the City

Reuse `prototypes/forest-world-3d/` — the same mock Signals from
`prototypes/signals/mock-signals.js`, the same camera from
[ticket 13](13-grilling-camera-redecided.md), the same page and HUD. **Swap only
the Theme.** Do not rebuild the harness, and do not touch the Signal layer:
driving a second and third Theme off the unchanged generator is ADR-0001 proving
itself twice more, which is worth having for free. Add a Theme switch to the HUD
so the two authored Worlds can be compared against the Forest without a reload.

Build from ticket 09's definition:

- One storey, one roof (a few types), one ground floor, one road tile, one
  street light — generated in code as `BufferGeometry`, flat-shaded, untextured.
- A building is a **stack of storey instances**. Size Tier 1/2/4/8 storeys.
- Dusk lighting. Neutral facades, warm-lit window strips.
- Flat street grid on the existing cell grid, on a raised slab with a hard edge.
- Risk on the facade (`#d1913c` / `#c2612f`), window strips as the second channel.
- Ticket 06's three FX pools, unchanged.

### Knobs to expose — the City

Ticket 08's lesson was that the first look was only *"it's fine"* and three
knobs turned it. Expose the equivalents rather than committing to numbers:

- storey height, and the slab edge height
- road spacing (every Nth cell line)
- dusk sky and light colour, window glow strength
- facade neutral, and the roof colour palette
- cloud/spark pool caps, and the rain-on-city toggle from verdict C4

## Part 2 — the RTS

Same harness again, third Theme. Build from
[ticket 10](10-grilling-rts-theme-3d.md)'s definition:

- **Four authored Entity meshes — tent, cottage, keep, castle** — generated in
  code as `BufferGeometry`, flat-shaded, untextured. A tier change is a swap,
  not a stack. Target a height span near the City's 8×, not the Quaternius
  pack's measured 2.14×.
- **Author against the pack's palette** so authored and bought geometry match:
  `Stone #86877f`, `Stone_Light #b2b3a8`, `Walls #afafa5`, `Wood #876a44`,
  `Wood_Light #a38658`, `Metal #4f4332`, `Fabric #b39456`, `Gold #a58142`,
  `Green #577522`, `Snow #afafa5`. All `metallicFactor: 0`, roughness 0.5, no
  textures.
- **Bought Scenery, a fixed cast of ~9 instanced meshes** from Quaternius
  Ultimate Fantasy RTS (CC0, glTF, embedded buffers — no `.bin` sidecar):
  `Mountain_Single`, `Mountain_Group_2`, `Rock`, `Rock_Group`,
  `Resource_PineTree`, `Resource_Tree1`, `Resource_Gold_2`, `Windmill_FirstAge`,
  plus `Wall_FirstAge` and `WallTowers_FirstAge` for the edge. Do **not** buy
  `Resource_Tree_Group` or `Resource_PineTree_Group` — group meshes are the
  pack's expensive form and instancing makes them pointless.
- **Terrain is anchored to the World's edges, never scattered per cell.** A
  per-cell scatter would thin out as Subscribers arrive, which is Scenery
  varying with the data.
- **The wall is the World's edge treatment** — one instanced tile run fitted to
  the grid, not a count of props that grows with the Subscriber count.
- Bright, slightly cool midday, hard shadows.
- Risk on the walls (`#d1913c` / `#c2612f`); roof and banner colour carry
  `hash(subscriberId)` variety; the banner **falls** at churn; day 90 swaps the
  whole structure to a rubble mound plus `Rock_Group`.
- Ambient: banner sway and a turning windmill sail, desktop-only.
- Ticket 06's three FX pools, unchanged. **No flame** — fire is not the critical
  risk signal and must not be added back here.

### Knobs to expose — the RTS

- the four tier heights, and the overall ladder span
- terrain cast size and edge inset
- sun angle and warmth, shadow hardness
- wall height, and the wall-tower spacing
- banner and roof palettes

## The verdict to ask for

The same question ticket 08 asked, and it must come from the user, not from the
agent. **Ask both sets** — the two Themes fail in different ways.

**City:**

1. **C1 — Does it land?** Against the 3D Forest, which is the bar now — not
   against the pixel world, which is deleted.
2. **C2 — Does a storey appearing read as growth?** This is the whole reason the
   map walked away from a kit. If `grew` does not read, the authoring argument
   collapses and Kenney City Kit comes back on the table at 13.3× the triangles.
3. **C3 — Is a churn wave bearable?** Ticket 09 predicted a dusk city of dark
   buildings is grimmer than a forest of stumps, and answered it on paper with
   always-lit street lights and a redevelopment fence. Show a bad quarter and
   find out.
4. **C4 — Does rain at dusk over a grey city read as gloom?** Ticket 09's one
   deliberately unresolved risk. The warm-white cloud is the mitigation already
   in place; if it is not enough, this is where the City earns its own FX form.

**RTS:**

5. **R1 — Do four distinct shapes read as one ladder?** The City's viewer counts
   floors; the RTS viewer must read a shape. If tent / cottage / keep / castle
   do not order themselves at full zoom-out, the shape ladder fails and the
   Theme falls back to the City's stacking mechanic.
6. **R2 — Does authored medieval look convincing, or does it look like a toy?**
   The City authors boxes, which is forgiving. A keep is not, and this is the
   RTS's own version of the risk that created this ticket.
7. **R3 — Does the land carry the Theme?** [Ticket
   10](10-grilling-rts-theme-3d.md) kept the RTS alive on the argument that a
   Subscriber sits in a landscape it did not build. Show a **tiny** World — one
   keep — and a crowded one. If the terrain does not make the difference
   visible, the Theme's whole reason to exist is thin.
8. **R4 — Do authored keeps and bought Quaternius props sit together?** The
   palette match says they should. Only looking proves it.

## Not in scope

Frame rates on real hardware. **[Ticket
15](15-task-measure-device-fps.md) has since closed** — 60 fps on an iPhone 16 at
3,167 Entities with shadows on — so the mobile ceiling question is answered and
this gate must not re-open it. This gate is about the look. Say so in the
write-up rather than implying a number was taken.

Both authored Themes are cheaper than the Forest that was measured (~6 draw
calls for the City, ~27 for the RTS, against the Forest's 41), so there is no
reason to expect a performance surprise. Report the draw-call count for each
Theme anyway, as ticket 08 did — it is free and it keeps the record honest.
