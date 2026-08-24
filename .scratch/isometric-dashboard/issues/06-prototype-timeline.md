# Prototype: timeline scrubbing and deterministic layout

Type: prototype
Status: resolved
Blocked by: 05

## Question

Extend the forest prototype with the timeline: scroll back in time and watch the business grow. To prove:

- Deterministic Entity placement — a subscriber keeps its spot in the World at every point in time (layout derived from stable ids, not insertion order).
- The scrub interaction itself (slider? drag? momentum?) and how the World animates between points in time.
- Whether replaying a long Signal history stays smooth.

Does scrolling through the business's history feel magical or mechanical?

## Answer

Extended `prototypes/forest-world/` in place — the timeline bar appears in all three page variants (slider + ▶ replay + Today button; space toggles playback; `?t=<epoch seconds>` opens at a past date). Screenshot of the world scrubbed to Aug 2024: `prototypes/forest-world/screenshots/variant-A-scrubbed-aug-2024.png`.

**Deterministic placement — proven, with the mechanism ticket 05 set up:** cells are ordered center-out with business-independent jitter; each subscriber probes from `hash(subscriberId)`; assignment happens in order of first appearance. Because appearance order is itself part of the Timeline, the layout at any past T is a prefix of the layout at now. Verified programmatically (node test): same seed → byte-identical Timeline; placements at 25%/50%/75% of history match today's spots exactly; the fold shows sane history (Aug 2024: 31 active subscribers, €725 MRR → today: 99 active of 237 ever, €2,790 MRR).

**Scrub interaction (decided in the prototype, open to taste):** a day-stepped slider with a date label; ▶ replays the full 3 years in ~6 s (6 months/sec) with growth-pop animations on tier changes and rain/sparkles firing as the signals pass; a Today button and a "churn risk shows only at today" note when in the past (ADR-0002 made visible). Momentum/drag-on-world scrubbing was skipped — the slider + replay covered the question; revisit only if scrubbing feels mechanical.

**Performance:** the World state at time t is a full fold of the Timeline (~3,100 signals for the default business, ~7k for `crowded`), recomputed every playback frame; tree sprites update in place (texture swap on change only) and effects rebuild once per simulated day. No incremental fold needed at MVP scale.

**HUD behaves under time travel:** counters follow the scrub in every variant; variant B veils its roster in the past ("the roster shows today"); variant C's date line follows the scrubbed month.

**Caveat:** "magical or mechanical" is a judgment only you can make — press ▶ on variant A. The mechanics (determinism, smoothness, effects during replay) are in place.

## Comments

**2026-08-18 (user):** verdict is in — scrubbing **feels good**. Ticket fully closed; the slider + replay interaction carries into the MVP as specced.
