# Task: measure real frame rates on a laptop and a phone

Type: task (HITL — the agent has no GPU and no phone)
Status: open
Blocked by: —

## Question

The map has never once measured a real frame rate. Take the numbers.

[Research 02](02-research-threejs-nextjs-scale.md) could not: no GPU on the research
machine. [Ticket 08](08-prototype-3d-forest-gate.md) inherited the job, built the
prototype, and could not either — Chrome fell back to SwiftShader, so its fps reading
is meaningless. The gate verdict was given on the **look**, which is what a gate is
for. Nothing in the map yet says the thing runs.

Everything the CPU side predicts is good: **41 draw calls flat in the Entity count**,
~3.3 ms total CPU per replay frame at 1,583 Entities against a 16.7 ms budget. The
open risk is the half no one has touched — **GPU vertex throughput on mobile**, at
268k–516k triangles with shadows on.

The prototype prints what is needed. The HUD reads
`fps · frame ms (write / gl) · calls · tris · entities · fold ms`.

**How to take the reading.** Open the hosted build —
https://claude.ai/code/artifact/0fdf9d44-f1ff-49f2-ade5-be0300dd5e45 — on each device.
Record, per device:

1. **Idle at "now"**, default framing, ~237 Entities.
2. **Idle at 1,583 Entities** and at **3,167** (the seed box and the Entity count
   control the population).
3. **During replay** (press play) at 1,583 — this is the worst case, because the fold,
   the instance write and the FX pools all run every frame.
4. **While turning** — a drag holds the renderer at full rate and is where a mobile GPU
   should show its limit first.
5. **Shadows off** at 1,583 during replay. Ticket 08 called shadows *"the first thing
   to cut on mobile"*; this is the measurement that says whether cutting them is
   needed and whether it is enough.

Also record what each device **is** — a phone fps means nothing without the model and
the browser.

**What the answer must say**, because [ticket 11](11-task-update-spec-and-adr.md) has
to put it in the spec: the Entity count the app can honestly carry on a phone, and
which of the knobs (shadows, FX, sway, density) the product should drop automatically
below it. If a number comes back bad, say so plainly — a mobile ceiling is a spec fact,
not a failure of the pivot, and the gate verdict does not depend on it.
