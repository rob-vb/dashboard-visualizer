# Task: write the pivot into the spec, the ADRs and the glossary

Type: task
Status: open
Blocked by: 04, 05, 06, 07, 08, 09, 10, 13, 14, 15, 16

## Question

The destination deliverable. Make every document say what was decided, so nothing still describes a pixel-art app.

Only run this after the gate (ticket 08) passes. On a "no" verdict this ticket is closed unused.

Do:

1. **Write a new ADR** on the render stack: low-poly 3D over 2D pixel art, and the stack from ticket 02. It meets all three ADR tests — hard to reverse, surprising without context (it overturns [research 01](../../isometric-dashboard/research/01-rendering-tech.md)), and a real trade-off against an already-approved look. State what was given up.
2. **Update [`spec.md`](../../isometric-dashboard/spec.md)**:
   - §1 Vision — "isometric pixel-art World" is now wrong.
   - §4 Frontend — replace the PixiJS 8 stack line, the "self-made pixel sprites" decision, the Forest asset paragraph, and the City and RTS entries with the outcomes of tickets 09 and 10.
   - §7 Milestones — M1 says "forest theme with real Evergrow sprites". Re-plan M1 and M5 for the 3D pipeline.
   - §8 Open items — retire the resolved purchase question; add the plan decision from ticket 07.
3. **Rewrite [`docs/theme-definition-template.md`](../../../docs/theme-definition-template.md)** for 3D, from ticket 06's vocabulary. The current template is written for sprites.
4. **Check `CONTEXT.md`.** **World** is defined as "the rendered isometric scene". If ticket 04 freed the camera, that word is now wrong — fix it, and check that **Entity**, **Size Tier** and **Theme** still read true.
5. **Check ADR-0001, ADR-0002 and ADR-0003.** They should all survive untouched — that is the point of the Signal layer. If any one does not, say so loudly, because it means the pivot reached further than planned.
6. **Close the map**: append the decisions to [`map.md`](../map.md), and decide the fate of `prototypes/forest-world/` (fog on the map).

Consult `mattpocock-skills:domain-modeling` for the ADR and glossary work.

## Comments

**2026-08-20 — from [ticket 12](12-task-fix-fold-performance.md).** Spec §2 names `foldWorldState` as the contract production re-implements 1:1. That contract now includes a performance rule, not just a shape:

> A churned Entity's **Size Tier** comes from `lastMrr`, carried forward through the fold's single pass — never from a rescan of the **Timeline** per churned **Subscriber**.

The rescan cost 201.5 ms per fold at 1,583 Entities (5 fps); carrying `lastMrr` forward costs 0.75 ms. It is invisible at demo scale and fatal at customer scale, so the spec should state the rule rather than leave the port to rediscover it. Reference implementation: `prototypes/forest-world/mock-signals.js`, with `prototypes/forest-world/test.mjs` as the regression test.

**2026-08-24 — from [ticket 13](13-grilling-camera-redecided.md), the camera.** Three
changes to the work above:

- **Item 4 is done.** `CONTEXT.md`'s **World** entry was rewritten in ticket 13's
  session — the camera detail ticket 04 put there is gone, and "isometric" with it.
  What remains for this ticket is the rest of item 4: check that **Entity**, **Size
  Tier**, **Mourning Window** and **Theme** still read true.
- **A second ADR is now owed** (ticket 13 Q10), beside the render-stack one in item 1:
  the camera model. Hard to reverse (the interaction model and the share link hang off
  it), surprising without context (every older document in this repo says "isometric"),
  and a real trade-off. It must say that the gate itself proved a constrained camera
  undersells volume, that we chose reachability plus recovery over guarantee, and that
  **we accept some reachable frames look bad**.
- **§4 gains a camera section.** Take it from [ticket 13](13-grilling-camera-redecided.md)'s
  table, never from ticket 04's — ticket 04 is history now. §1's "isometric" is wrong
  for the same reason "pixel-art" is.
