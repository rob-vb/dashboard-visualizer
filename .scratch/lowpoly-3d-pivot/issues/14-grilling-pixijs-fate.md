# Grilling: what happens to the PixiJS prototype

Type: grilling
Status: resolved
Blocked by: —

## Question

The gate passed, so `prototypes/forest-world/` is no longer the fallback. What is it now?

The map's Notes kept it alive on purpose: *"the pixel-art work stays as the fallback
until the gate passes (user, Q6). Do not delete `prototypes/forest-world/`, its sprite
generator, or the approved look."* [Ticket 08](08-prototype-3d-forest-gate.md) has now
discharged that condition with **"it lands 100× better"**, and the map's **Out of
scope** already rules out shipping two render modes side by side — so "keep both" is
not one of the answers.

Three things are tangled together and they do not have the same fate:

1. **The 2D World renderer** (`prototypes/forest-world/`, the sprite generator, the
   approved pixel look). Archive it, delete it, or keep it as something the product
   uses?
2. **`prototypes/forest-world/mock-signals.js`** — the mock generator. The 3D World
   drives off it unchanged, which is what proved ADR-0001. It is not 2D; it lives in a
   2D directory. Where does it belong once the 2D renderer goes?
3. **`prototypes/forest-world/test.mjs`** — the harness [ticket 12](12-task-fix-fold-performance.md)
   committed. It tests determinism, prefix-stable placement, a fold snapshot and the
   benchmark. All four are render-independent and all four are worth keeping.

Settle:

1. **The `/demo` idea.** The closed map's [ticket 10](../../isometric-dashboard/issues/10-grilling-onboarding-demo-customization.md)
   fixed a demo mode. Is the pixel World a plausible `/demo`, a second Theme, an
   easter egg — or is that just "two render modes" wearing a hat? If it survives in
   any product-visible form, **[ticket 11](11-task-update-spec-and-adr.md) owes the
   spec a section**, so this must be decided before the spec is rewritten.
2. **Where the reusable parts move**, and whether moving them breaks the 3D prototype
   (which imports the generator by path).
3. **What the record keeps.** The pixel look was approved by the user on 2026-08-18 and
   then beaten. Screenshots and the ADR trail are cheap; the code is not. What is worth
   holding onto so the decision stays legible in a year?
4. ~~**Whether "delete" is even reversible here.** This repo is **not** a git repository —
   the local-markdown tracker in `.scratch/` is canonical and there is no history to
   recover a deleted directory from. Weigh that before choosing.~~
   **Void as of 2026-08-24** — the repo became git that day and is pushed to
   `rob-vb/dashboard-visualizer` (private, branch `main`), with the whole 2D prototype
   in the first commit. Deleting `prototypes/forest-world/` is now recoverable, so this
   question is decided on what the *working tree* should hold, not on what is safe to
   lose. That argues against "archive it in a folder called `archive/`": git is the
   archive. What it does not settle is whether the pixel World survives as something
   the product uses — that is Q1, and it is the real question.

Consult `mattpocock-skills:grilling` and `mattpocock-skills:domain-modeling`.

## Answer

**The pixel World is gone. The Signal layer it was built on is not.** Settled with the
user 2026-08-24, in one line: *"pixelwereld nee zeker niet."*

### Q1 — the 2D renderer does not survive in any product-visible form

No `/demo`, no second Theme, no easter egg. The map already ruled out shipping two
render modes; a `/demo` on the pixel renderer would have been that rule wearing a hat,
and it would have committed [ticket 11](11-task-update-spec-and-adr.md) to writing a
spec section for a stack the gate just retired.

`prototypes/forest-world/` is deleted: `index.html`, `main.js`, `world.js`,
`sprites.js`, `pixi.min.js`, `README.md` and `screenshots/`.

### Q2 — the render-independent parts moved to `prototypes/signals/`

Three files were never 2D; they only lived in a 2D directory:

| File | Why it survives |
|---|---|
| `mock-signals.js` | the mock generator **and** `foldWorldState`. Both Worlds drove off it unchanged — that is the proof of ADR-0001, not a 2D artefact. |
| `test.mjs` | ticket 12's harness: determinism, ticket 06's prefix-placement assertion, the fold snapshot, the benchmark. All four are render-independent. |
| `test-snapshot.json` | the fold snapshot recorded *before* ticket 12's fix. It is the thing that proves the 269× speed-up changed no output. |

The name is the point: **`signals/`, not `mock/` or `tools/`**. `CONTEXT.md` makes
**Signal** the layer Themes consume and never bypass, so the directory now says what
ADR-0001 says. Putting these inside `forest-world-3d/` would have implied the generator
belongs to the 3D Theme, which is exactly the coupling the ADR forbids.

Three live references were repointed and verified:

- `prototypes/forest-world-3d/index.html:169` — the `<script src>`.
- `prototypes/forest-world-3d/build-artifact.mjs` — the read and the strip regex.
- `prototypes/signals/test.mjs` — its own run instruction.

`node prototypes/signals/test.mjs` passes, all four checks. The single-file artifact
rebuilds and still inlines the generator (no external script tag, 1.11 MB), so the
hosted gate build at
https://claude.ai/code/artifact/0fdf9d44-f1ff-49f2-ade5-be0300dd5e45 is unaffected.

### Q3 — git is the record

The repo became git earlier the same day, so the whole pixel World — code, sprite
generator and the four approved screenshots — is in commit `ed8b8a9` and stays
reachable. Nothing is archived into a folder called `archive/`: that is what a
repository without history has to do, and this one has history now.

**Consequence: closed tickets keep their old paths on purpose.** The links in
[ticket 05 of the closed map](../../isometric-dashboard/issues/05-prototype-forest-world.md),
[ticket 12](12-task-fix-fold-performance.md) and
[research 02](../research/02-threejs-nextjs-scale.md) point at
`prototypes/forest-world/`. They are records of a state that was true when they were
written, and rewriting them would falsify the trail. Only **open** documents were
repointed: [ticket 11](11-task-update-spec-and-adr.md) and the spec's reference to the
generator.

### What this hands ticket 11

- The spec's §7 milestones lose their fallback branch entirely — there is no 2D path to
  fall back to.
- The reference implementation for the `lastMrr` rule is now
  `prototypes/signals/mock-signals.js`, tested by `prototypes/signals/test.mjs`.
