# Grilling: the City Theme in 3D

Type: grilling
Status: open
Blocked by: 08

## Question

What is the City **World** in low-poly 3D, and which kit builds it?

The closed effort decided City as *"your block of town"* on the CC0 Town Pack, with story-stacking as the growth mechanic and FOR SALE / boarded windows as risk ([ticket 08](../../isometric-dashboard/issues/08-grilling-city-theme.md), never vetoed). It also recorded a real weakness: **the pack lacks roads and terrain**, so filler tiles were DIY.

Re-decide on the 3D source picked in ticket 01. Settle:

1. **Kit choice.** If Polyfork wins, New York City (26 of 56 free) and Japanese Suburban Street (29 of 46 free) both exist, and they are different products — one is skyline, one is street. Which reads better as *a business you own*?
2. **Does story-stacking survive?** In 2D, stacking sprite storeys was the cheap growth trick. In 3D a taller building may need to be a different mesh or a parametric rebuild (ticket 05). Confirm the tier mechanic works here, not just in the forest.
3. **Roads and ground.** 3D kits often ship terrain and road pieces the pixel pack lacked. Does the gap close?
4. **The Signal vocabulary.** Apply ticket 06's answers. Rain over a city and a stump-equivalent for a churned building both need a form — the closed effort chose an abandoned building decaying to a rubble lot.

Consult `mattpocock-skills:grilling` and `mattpocock-skills:domain-modeling`. Fill in [`docs/theme-definition-template.md`](../../../docs/theme-definition-template.md) as rewritten by ticket 11.

## Update — candidates from ticket 01 (2026-08-19)

The kit question above is framed around Polyfork. Add the CC0 candidates, which [research 01](../research/01-lowpoly-sources.md) ranks first:

- **Quaternius Downtown City MegaKit** — CC0, 315 models, modular. Ranked first for this Theme.
- **Quaternius Ultimate Buildings Pack** — CC0, 76 models, modular, with *different atlas textures to change the palette*. That is a per-World palette knob for free, relevant to the customization fog.
- **Kenney City Kit (Commercial)** 50 + **(Suburban)** 40 + **(Roads)** + **(Industrial)** — CC0. Note that **the roads-and-terrain gap is closed**: the 2D pack lacked them and forced DIY filler tiles; Kenney ships roads as a pack of its own.
- **Polyfork New York City / Little Tokyo** — every City building is Pro. NYC has 13 buildings, exactly one free (a newsstand); Little Tokyo has 6, none free.

The trade is sharp here. Polyfork's `floors` knob is *"the number of 3.00 m storeys, REBUILT not stretched: each value adds or removes a whole window row plus its sills, lintels and spandrel brick"* — Brick Tenement 4–8 floors, Office Tower 6–12. That is the best growth mechanic found anywhere in the research, and it is exactly the story-stacking idea the 2D effort faked by hand. It costs Pro. The CC0 packs give more models, free, but a taller building is a different building.
