# Grilling: what happens to the PixiJS prototype

Type: grilling
Status: open
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
