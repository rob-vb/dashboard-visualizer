# Task: measure real frame rates on a laptop and a phone

Type: task (HITL — the agent has no GPU and no phone)
Status: resolved
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

## Answer

**There is no mobile ceiling to write into the spec. 60 fps on an iPhone 16, at
3,167 Entities, with shadows on.** Read by the user on 2026-08-24 from the hosted
bundle, on a laptop (model not recorded) and an **iPhone 16**, in the two worst
cases the ticket named: `?preset=scale3000` idle, and `?preset=scale1583` during
replay while dragging. Verdict in the user's words: *"het gaat allemaal heel
vloeiend"* — 60 fps everywhere. The map has finally measured a real frame rate,
and the last debt left by [ticket 08](08-prototype-3d-forest-gate.md) is paid.

**60 is the display cap, not the engine's limit.** The iPhone 16 (non-Pro) runs a
60 Hz panel, so a reading of 60 means *"at or under a 16.7 ms budget"* and says
nothing about how much headroom is left above it. That is exactly the fact the
spec needs — the app meets the budget on the hardware it was doubted on — but it
means **the headroom is still unquantified**, and no one should quote a multiple.
Whoever wants the margin should read `frame ms (write / gl)` rather than `fps`;
the HUD prints it. On iOS the browser is not a variable: every iOS browser is
WebKit, so a Safari reading and a Chrome-on-iOS reading are the same reading.

**What the CPU prediction bought.** The GPU half was the open risk precisely
because the CPU half was already safe — 41 draw calls flat in the Entity count
([research 02](02-research-threejs-nextjs-scale.md), certified by ticket 08 at
~3.3 ms per replay frame), and the fold's O(n²) rescan removed by
[ticket 12](12-task-fix-fold-performance.md). The suspicion was that
**268k–516k triangles with shadows would find a mobile vertex limit anyway**.
It did not. Instancing paid on the GPU side too, and the two halves now agree.

**Rule for [ticket 11](11-task-update-spec-and-adr.md):**

1. **Ship every knob on.** Shadows, FX, sway and density 1.3 all stay at their
   decided values on mobile. Ticket 08 called shadows *"the first thing to cut on
   mobile"* — that instinct is now **unfalsified but unneeded**. Do not build an
   automatic downgrade ladder on the strength of a fear no measurement supports;
   a device-sniffing branch is a permanent cost paid against a hypothetical.
2. **Keep the cut order written down, unused.** If a device ever misses the
   budget, drop in this order: **shadows → FX pools → sway → density**. Shadows
   first because they are a whole extra pass over the same 41 draw calls; density
   last because [ticket 13](13-grilling-camera-redecided.md) chose 1.3 for the
   *woodland feel*, so cutting it is a visual regression, not a tuning knob.
3. **If it is ever built, trigger it on a measured frame time, not on a device
   string.** The app already measures its own frame; a rolling average that
   crosses 16.7 ms is the honest trigger. A user-agent test would have degraded
   this iPhone for nothing.
4. **`prefers-reduced-motion` is unrelated and already honoured** — an
   accessibility rule, not a performance rule. It must not become the fallback
   path for a slow device.

**What is still uncertified, and deliberately not ticketed.** Android was not
tested, and neither was any low-end or several-year-old phone; an iPhone 16 is
close to the top of the mobile GPU range. Sustained thermal behaviour was not
measured either — the readings are short, and a phone that throttles after ten
minutes would show it nowhere in this data. None of that blocks the spec: the
destination of this map is the render decision, and the decision is now backed by
a real device. **A broader device sweep belongs to the build effort**, against a
real app on a real host, not to a throwaway prototype on an artifact URL.

Housekeeping done in the same session: `README.md` and `serve.mjs` in
`prototypes/forest-world-3d/` still pointed at `prototypes/forest-world/` and told
the reader not to delete it. [Ticket 14](14-grilling-pixijs-fate.md) deleted it.
Both files now point at `prototypes/signals/` and at commit `ed8b8a9`.
