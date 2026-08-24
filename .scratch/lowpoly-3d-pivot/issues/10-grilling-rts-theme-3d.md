# Grilling: the RTS Theme in 3D

Type: grilling
Status: open
Blocked by: 08, 16

## Question

What is the RTS **World** in low-poly 3D — and does 3D finally give it units?

This Theme is the strongest argument for the whole pivot. The 2D research concluded flatly: *"no off-the-shelf Warcraft-like units exist"* in isometric pixel art ([research 02](../../isometric-dashboard/research/02-asset-packs.md)). That forced the closed effort into **buildings-only medieval** on CC-BY assets, with units pushed post-MVP and a credits page required ([ticket 09](../../isometric-dashboard/issues/09-grilling-rts-theme.md), never vetoed).

Low-poly 3D has characters. Settle:

1. **Do units come back into the MVP?** If yes, what does a unit *mean*? An **Entity** is one subscriber (ADR-0003). A unit that walks around is not obviously the same idea as a building that grows. Do not add units because they are available — add them only if they say something a building cannot.
2. **Setting.** The closed effort chose medieval ("your kingdom": tent → castle tiers, fire = critical risk, burnt ruin → rubble). If Polyfork wins ticket 01, Medieval Village is 18 of 50 free while Space Base is 27 of 61 — so a sci-fi pivot is cheaper on the free tier. Does the medieval setting still win?
3. **Rigging and animation.** Some low-poly assets ship pivots and inverse kinematics. Whether an Entity animates is fog on the map — this ticket may graduate it.
4. **Attribution.** The 2D plan required a credits page for CC-BY. Does the 3D source remove that burden (Polyfork: no attribution) or keep it (Kenney and Quaternius CC0: none either)?

Consult `mattpocock-skills:grilling` and `mattpocock-skills:domain-modeling`.

## Update — the gap is closed, and not by Polyfork (2026-08-19)

[Research 01](../research/01-lowpoly-sources.md) answers question 1 in the affirmative and names the source.

**Polyfork does not field units.** Catalogue search returns 0 results for soldier, warrior, orc, archer, spearman, troop, army, banner, catapult and barracks; "knight" returns a free *sword* prop. All 41 characters are Pro, and none is a combat unit. Its Medieval Village Kit is 18 free of 50, with every building and every villager behind Pro. So a Polyfork RTS Theme would be *a medieval village that grows walls and towers*, not an army — the same buildings-only compromise the 2D effort made, at a price.

**Quaternius Ultimate Fantasy RTS closes it.** CC0, 128 models, FBX/OBJ/glTF/Blend, August 2022. The pack description, verbatim: *"a collection of buildings in different evolution stages, along with nature assets."* **"Evolution stages" is a Size Tier ladder, shipped and free.** Alongside it in the same catalogue: Medieval Village MegaKit (304), Ultimate Modular Ruins Pack (90 — a decay state for churned Entities, in a matching style), Ultimate Modular Men / Women (soldier, farmer, adventurer outfits), and rigged, animated character packs.

Two consequences for this ticket:

- **Question 4 (attribution) is answered: none.** CC0 needs no credits page. The 2D plan's CC-BY credits requirement disappears.
- **Question 2 (setting) tilts back to medieval.** The free-tier arithmetic that made sci-fi cheaper was a Polyfork constraint; under CC0 it does not apply.

**Do first, before deciding:** download Ultimate Fantasy RTS and count the evolution stages per building. The stage count is not published, and this Theme's whole Size Tier story rests on it. Four stages maps to four **Size Tiers** exactly; three or five needs a mapping rule.

Question 1 still stands on its merits: units being *available* is not a reason to add them. An **Entity** is one subscriber (ADR-0003), and a unit that walks around is not obviously the same idea as a building that grows.

## Update — authoring is now on the table (2026-08-24, from ticket 09)

[Ticket 09](09-grilling-city-theme-3d.md) decided the City is **not** bought from
a kit: its geometry is generated in code, one storey / roof / ground floor, with
a building built as a stack of storey instances. That redrew the map's
"Making our own 3D models" scope line, so this ticket may no longer assume the
answer is a zip.

Read that before running this one. Three points bear directly on the RTS Theme:

1. **It collides with why Quaternius Ultimate Fantasy RTS was chosen.** That
   pack won on its **rigged units** — the gap neither pixel art nor Polyfork
   could close. Authored geometry does not rig cheaply. See
   [ticket 16](16-grilling-entity-animation.md), which blocks this ticket.
2. **The measured cost argument.** Kenney's city buildings run 1,986 triangles
   on average against the Forest's 150 — 13.3× — and no device frame rate has
   been taken yet ([ticket 15](15-task-measure-device-fps.md)). Measure the
   Quaternius pack before trusting it, the way ticket 09 measured Kenney and
   caught it.
3. **Per-Theme sourcing costs nothing.** Forest buys CC0, City authors. The RTS
   Theme is free to pick either — research 01 established coherence is required
   inside a Theme and is irrelevant across Themes. Do not treat one Theme's
   choice as a precedent for this one.

One correction to carry: research 01 ranked **Quaternius Downtown City MegaKit**
first for City without seeing it. Its preview is photoreal PBR, entirely the
wrong art style. The same ranking may not be trustworthy for Ultimate Fantasy
RTS either — look at the pack.

## Update — ticket 16 is resolved; this ticket is unblocked (2026-08-24)

[Ticket 16](16-grilling-entity-animation.md) settled motion for the whole map, and
**point 1 above is void**. Its premise — "that pack won on its rigged units" — is
not what [research 01](../research/01-lowpoly-sources.md) says. Ultimate Fantasy RTS
is **128 static meshes**, "no parameters, same limitation as Kenney". The rigged
figures are in *different* Quaternius packs, in styles the same research warns do
not match. So authored geometry costs this Theme nothing in rigging, because
nothing here was ever going to rig.

What this ticket inherits, and must not re-open:

- **The building is the Entity.** The pack's "buildings in different evolution
  stages" are the Size Tier ladder — the reason it was ranked first.
- **A soldier or villager is Scenery**, a term now in `CONTEXT.md`: it represents
  no Subscriber and reads no Signal.
- **No skeleton, anywhere.** Motion lives inside the instance write.
- **Budget: Scenery costs at most ~10 draw calls**, a fixed cast that never scales
  with the Subscriber count. This ticket chooses *what* the cast is.
- **Ambient motion carries no Signal** and is desktop-only. **Transition motion** is
  a tweened geometry swap — a Size Tier change, and the day-90 residue swap.
- Point 2 above is partly spent: [ticket 15](15-task-measure-device-fps.md) has since
  measured a real device (60 fps on an iPhone 16 at 3,167 Entities). The instruction
  to measure this pack's triangles per Entity before trusting it still stands.
