# Theme definition template

Extracted from the forest prototype (ticket 05). Every Theme is a skin over the
canonical Signal set (ADR-0001): to define a new Theme, fill in every section
below. A Theme that cannot fill a section without new data is asking for a
Signal-set change — that is a cross-theme decision, not a theme decision.

## 1. Identity

- **Name** and one-line mood (forest: "a quiet cottage-core forest that is your business").
- **Base asset pack(s)** with license and grid size (forest: self-made pixel sprites on a 32×16 iso tile — no third-party license).

## 2. Entity mapping

What renders one **Subscriber**, and how it shows each derived state:

| State | Forest reference |
|---|---|
| Size Tier 1–4 | 4 tree growth stages |
| `active` | healthy green tree |
| `at_risk` warning | autumn-orange canopy |
| `at_risk` critical | deep orange-red canopy |
| `churned`, recent | standing dead tree |
| `churned`, after the mourning window | stump |

- **Mourning window**: how long a churned Entity keeps its dramatic form before
  decaying to a residue marker (forest: 90 days → stump). Without this rule an
  old business drowns in corpses — every Theme needs a decay answer.
- Optional per-Entity variety keyed on `hash(subscriberId)` (forest: pine/oak).

## 3. Moment Signal effects

A transient effect per Moment Signal (window: last ~10 days when showing "now";
during timeline playback, effects fire as signals pass):

| Signal | Forest reference |
|---|---|
| `subscriber_appeared` / `subscriber_returned` | sparkles over the young tree |
| `subscriber_grew` / `subscriber_shrank` | stage-change pop (tier crossings only) |
| `subscriber_churned` | tree turns grey |
| `payment_received` | rain cloud + shower on that tree |
| `payment_failed` | dark flickering cloud, no rain |

## 4. Ambient loop

What keeps the World alive with zero Signals in the window (forest: canopy
sway, cloud drift). Must respect `prefers-reduced-motion`.

## 5. Terrain and placement

- Ground tile set and world shape (forest: grass diamond, seamless 2:1 iso).
- Placement uses the shared deterministic rule (center-out cells, probe from
  `hash(subscriberId)`, assign in order of first appearance) — Themes style the
  ground but never move Entities.

## 6. Degenerate worlds (must look good, not just work)

- **Single-plan business** — every Entity the same tier (all trees "mature").
- **Tiny business** — 5 Entities on a small field.
- **Crowded** — 500+ Entities; performance and readability.
- **Churn wave** — a visibly bad quarter without turning into a horror scene.

## 7. Cosmetic knobs

The light customization this Theme exposes (palette, season, day/night,
terrain flavor). Cosmetic only — knobs never change what a Signal means.

## 8. Out of Theme scope

Page chrome (HUD boxes, roster, share framing) is app-level, not Theme-level.
The prototype's three page variants demonstrate the same Theme under different
chrome. A Theme ends at the canvas edge.
