# Grilling: the RTS Theme — asset strategy, then definition

Type: grilling
Status: resolved

## Question

Two decisions: (a) the asset strategy — no off-the-shelf Warcraft-like units exist in isometric pixel art ([asset research](02-research-asset-packs.md)): commission, pivot to sci-fi, or go buildings-only; (b) the theme definition per `docs/theme-definition-template.md`.

## Answer

> Resolved autonomously with recommended defaults — veto freely; nothing below is built yet.

**(a) Asset strategy: buildings-only medieval for the MVP; commission units post-MVP if the theme earns it.**

- **Buildings-only medieval (chosen):** crabcrabcrabs' *Isometric Strategy – Medieval Pixel Art Tiles* (CC-BY 4.0, credits page suffices) for terrain + fortifications, optionally *Pixometric Medieval World* (CC-BY 4.0, has day/night + winter variants) for village buildings. Keeps the Warcraft *feeling* (banners, keeps, castles) without the unit gap; a settlement growing from tent to castle is a natural growth ladder; zero legal risk.
- **Sci-fi pivot (rejected for MVP):** the CC0 OGA mech pack is the only complete RTS set (construction stages, units, destruction) — but it abandons the "Warcraft-like" ask. Keep as the fallback if the medieval buildings-only version feels dead without units.
- **Commission now (rejected):** money and weeks before the theme is even validated.

**(b) Theme definition — "Your kingdom".**

**2. Entity mapping.** One Subscriber = one **settlement structure** flying the player's banner.

| State | RTS rendering |
|---|---|
| Size Tier 1–4 | tent → cottage → stone keep → castle with banner towers |
| `active` | intact structure, banner up (the pack's flags are animated) |
| `at_risk` warning | smoke wisps from the roof |
| `at_risk` critical | **on fire** — the RTS-native "under attack" signal |
| `churned`, recent | burnt ruin |
| `churned`, after the 90-day mourning window | overgrown rubble mound |

**3. Moment Signal effects.** appeared/returned: construction scaffold rises; grew/shrank: structure upgrades/downgrades with a build-dust pop; churned: the banner falls; payment_received: a glittering gold pile appears at the door (tribute); payment_failed: a raven circles + dark smoke puff.

**4. Ambient loop.** Banner/flag sway (shipped animated), chimney smoke, campfires at night. Reduced-motion: static frames.

**5. Terrain.** The crabcrabcrabs natural-terrain tiles (64×64, 2:1 iso); placement rule shared with all themes.

**6. Degenerate worlds.** Single-plan → a uniform garrison of keeps; tiny → a lone homestead; crowded → a sprawling kingdom; churn wave → a scorched borderland (fire + ruins must stay legible, not apocalyptic — cap simultaneous flame effects).

**7. Cosmetic knobs.** Faction banner color (4 palettes), biome (green / autumn / winter — winter ships in Pixometric), day/night.

**8. Out of scope.** Page chrome; units and battles (post-MVP; commission decision returns only if this theme is popular).

**Attribution obligation (for the spec):** CC-BY requires a credits page naming crabcrabcrabs (and Pixometric if used).