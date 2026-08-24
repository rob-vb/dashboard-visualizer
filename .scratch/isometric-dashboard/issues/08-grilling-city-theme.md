# Grilling: the City Theme definition

Type: grilling
Status: resolved

## Question

Fill in the theme-definition template (`docs/theme-definition-template.md`) for the **City** theme: what is an Entity here, how do the four Size Tiers and every state render, what are the Signal effects and ambient loop, on which asset pack, with which cosmetic knobs?

## Answer

> Resolved autonomously with recommended defaults — veto freely; nothing below is built yet.

**1. Identity.** "Your block of town" — a cozy low-rise pixel town that densifies as the business grows. Base pack: **Isometric Tiles – Town Pack** (Screaming Brain Studios, free, **CC0** — the zero-risk license for a SaaS serving sprites to browsers), 128×64 building tiles + roof sheets, stackable into multi-story buildings.

**2. Entity mapping.** One Subscriber = one **building on its lot**.

| State | City rendering |
|---|---|
| Size Tier 1–4 | building height: kiosk → 1-story shop → 2–3-story townhouse → corner tower (Town Pack tiles stack — this is the pack's native growth mechanic) |
| `active` | tidy building, warm lit windows |
| `at_risk` warning | orange "FOR SALE" board + half the windows dark |
| `at_risk` critical | boarded ground floor, flickering sign |
| `churned`, recent | dark, abandoned building |
| `churned`, after the 90-day mourning window | empty lot with rubble + weeds |

Variety via `hash(subscriberId)`: facade tile pick and lighting direction (the pack ships two).

**3. Moment Signal effects.** appeared/returned: construction dust + crane sparkle; grew/shrank: a story is added/removed with a dust pop (tier crossings only); churned: windows go dark; payment_received: the door's OPEN sign flashes and coins sparkle above the roof; payment_failed: a grey smog puff from the chimney.

**4. Ambient loop.** Window lights twinkle, neon signs blink, occasional pigeon. Day/night cycle follows the viewer's clock. Reduced-motion: static lit windows.

**5. Terrain.** Sidewalk/asphalt lot grid drawn procedurally (the Town Pack has no roads/terrain — CC0 allows drawing matching filler tiles; same 2:1 iso grid as the forest at a different tile size).

**6. Degenerate worlds.** Single-plan → uniform rowhouses (reads as a planned street, fine); tiny → a hamlet of 5 lots; crowded → denser lot grid; churn wave → a visibly darkening district.

**7. Cosmetic knobs.** Time-of-day (auto / always-day / always-night), district palette (brick / pastel / slate), seasonal dressing (none / winter lights / autumn trees).

**8. Out of scope.** Same page chrome as the forest; the Theme ends at the canvas edge.

**Open risk (for the spec):** Town Pack has no construction/growth *stages* beyond stacking, and mixing in Kelano's 64×64 buildings needs a scale decision — prototype the stacking before committing to the second pack.