# Grilling: the canonical Signal set and the mock generator

Type: grilling
Status: resolved
Blocked by: 03

## Question

Define the canonical **Signal** set precisely enough that (a) every Theme can be built against it and (b) a mock Signal generator can produce it. To decide:

- The exact Signals and states: new subscriber, size/growth (MRR-based?), churn risk, churned, payment received — and their fields (timestamps, magnitudes, identities).
- What "size" means for an Entity (MRR tier? lifetime value?) and how growth transitions work.
- How churn-risk maps from the Stripe findings in [Research: Stripe history](03-research-stripe-history.md).
- Requirements for the mock Signal generator: seeded/deterministic output, adjustable business size and growth curve, a timeline of Signals long enough to test scrubbing.

Record resolved terms in `CONTEXT.md`. The generator design here unblocks all frontend prototypes.

## Answer

> **Session note.** This ticket was resolved in an autonomous session. The grilling format is kept: each question shows the recommendation, and the recommendation was adopted as the decision. Every decision is open for veto — see "Assumptions to veto" at the end. The decisions are grounded in [Research: Stripe history](03-research-stripe-history.md) and ADR-0001.

### Q1 — What shape does the Signal layer have?

❓ One stream of events, a state snapshot, or both?

➡️ **Decision: two kinds of Signals.**

- **Moment Signals** — timestamped facts that form the **Timeline**. The World state at any time T is a pure fold of all Moment Signals up to T. This is what makes scrubbing possible.
- **Risk Overlay** — the present-only churn-risk states. Stripe keeps events for 30 days only; risk lives in live fields on current objects (research §3). So risk history cannot be reconstructed, and the Risk Overlay applies **only when the World shows "now"**, never at a past T. Recorded as ADR-0002.

Themes never fold Signals themselves. A single shared `foldWorldState(timeline, t)` function (one implementation, used by mock and real data alike) produces the derived per-Entity state; Themes render that state plus the Moment Signals that fall inside the animation window.

### Q2 — What does one Entity represent?

❓ A Stripe customer or a Stripe subscription? A customer can hold several subscriptions.

➡️ **Decision: one Entity = one Subscriber = one Stripe customer that has ever had a subscription.** MRR aggregates across all of that customer's subscriptions. One paying company = one tree. `subscriberId` is an opaque stable string (the Stripe customer id in the real adapter; a generated stable id in the mock). Deterministic placement (ticket 06) hashes this id. Recorded as ADR-0003.

### Q3 — The canonical Signal set

➡️ **Decision — Moment Signals** (all carry `at` as Unix epoch seconds and `subscriberId`; money is integer minor units plus an ISO currency code):

| Signal | Extra fields | Source in Stripe | Forest meaning |
|---|---|---|---|
| `subscriber_appeared` | `mrr` | earliest subscription `start_date` (trials count, MRR 0) | a tree sprouts |
| `subscriber_grew` | `mrr: {from, to}`, `tier: {from, to}` | aggregate MRR moved up (upgrade, quantity, extra subscription; from cycle/update invoices and proration lines) | tree grows a stage |
| `subscriber_shrank` | `mrr: {from, to}`, `tier: {from, to}` | aggregate MRR moved down | tree shrinks a stage |
| `subscriber_churned` | — | last active subscription `ended_at` | tree dies |
| `subscriber_returned` | `mrr` | new subscription after churn | the same tree revives, same spot |
| `payment_received` | `amount`, `currency` | subscription invoice `status_transitions.paid_at`, `amount_paid > 0` | rain falls on that tree |
| `payment_failed` | `amount`, `currency` | failed charge on a subscription invoice | dark cloud flickers |

Emission rule for grew/shrank: emit on **every** aggregate MRR change; `tier.from == tier.to` when no tier boundary is crossed. Themes animate only on tier changes; world totals stay exact.

Ordering: ascending by `(at, subscriberId, signal kind)` so the fold is fully deterministic.

**Risk Overlay** (present only): per at-risk Subscriber `{ subscriberId, reasons[], severity }`.

### Q4 — What does "size" mean, and how do growth transitions work?

❓ MRR tier or lifetime value? Absolute or relative thresholds?

➡️ **Decision: size = current aggregate MRR, bucketed into 4 Size Tiers** (matches the 4 growth stages of the Evergrow forest pack). Boundaries are the 25/50/75th percentiles of the **distinct** post-change MRR values observed across the business's full Timeline, computed once per sync. Same MRR → same tier, always; a Subscriber's tier never changes because *other* subscribers change mid-session. MRR 0 (trialing) is always Tier 1. A single-plan business yields a single-tier forest — that is honest; Themes must look good in that case. Lifetime value was rejected: trees would only ever grow, and "size = MRR" was already fixed on the map.

> **Amended during ticket 05.** The prototype showed that raw (non-distinct) percentiles collapse when most subscribers share one plan price — everything lands in Tier 4. Two refinements: boundaries are computed over **distinct** MRR values, and a fully degenerate distribution (all boundaries equal) puts every paying Subscriber in **Tier 2** ("mature") rather than Tier 4.

### Q5 — How does churn-risk map from the Stripe findings?

➡️ **Decision** (from research §3):

| Reason | Stripe field | Severity |
|---|---|---|
| `cancel_scheduled` | `cancel_at_period_end` / `cancel_at` | warning |
| `trial_ending` | `status=trialing` and `trial_end` within 7 days | warning |
| `paused` | `pause_collection` set, or `status=paused` | warning |
| `past_due` | `status=past_due` | critical |
| `unpaid` | `status=unpaid` | critical |

The customer `delinquent` flag is **excluded** — Stripe's own docs call it unreliable and redirect to `subscription.status`. Themes render one at-risk look (orange tree); severity may deepen it. Severity of a Subscriber = max over reasons.

### Q6 — The derived World state (what a Theme actually receives)

➡️ **Decision.** `foldWorldState(timeline, t)` returns:

- per Subscriber that has appeared by `t`: `{ subscriberId, status: 'active' | 'churned', mrr, sizeTier, appearedAt, churnedAt? }`
- world aggregates: `{ totalMrr, activeCount, churnedCount }`
- only when `t` = now: the Risk Overlay merged in as `status: 'at_risk'` with `reasons` and `severity`.

One-off, non-subscription payments are ignored in the MVP: the World is about subscribers. Multi-currency: the MVP assumes a single-currency business; aggregates use that currency (limitation noted for the spec).

### Q7 — Mock Signal generator requirements

➡️ **Decision.** The generator is a pure function: same inputs → byte-identical Timeline. No hidden clock, no unseeded randomness.

Parameters (all with defaults): `seed` (string), `now` (injected epoch seconds), `historyMonths` (36), `targetSubscribers` (150), `growthCurve` (`linear | exponential | sCurve | plateau`), `monthlyChurnRate` (0.03), `planMix` (list of `{mrr, weight}`, default three plans: 900 / 2 900 / 9 900 minor units), `upgradeRate` (0.02/mo), `downgradeRate` (0.01/mo), `trialShare` (0.2), `trialDays` (14), `paymentFailureRate` (0.05), `returnRate` (0.05), `riskShare` (0.08 of currently active).

Behavior requirements:

1. Emits the full ordered Timeline from month 0 to `now`, plus a Risk Overlay for `now`.
2. Monthly `payment_received` per active paying Subscriber on its billing anniversary; failures per `paymentFailureRate` emit `payment_failed` (and can escalate to `past_due` risk or churn).
3. Applies the same fold and tier rules as the real adapter — the fold is shared code, not generator code.
4. Big enough to stress scrubbing: must remain deterministic and fast at 500+ subscribers × 36 months.
5. Stress presets: `singlePlan` (one price — single-tier forest), `tiny` (5 subscribers), `churnWave` (a bad quarter).

### Assumptions to veto

1. Entity = Stripe **customer** (aggregate), not one Entity per subscription (ADR-0003).
2. Churn-risk is **not scrubable** — present-only overlay (ADR-0002; forced by Stripe's 30-day event retention).
3. 4 Size Tiers with **quantile** boundaries over the business's own history.
4. One-off payments and multi-currency are out of the MVP.
5. A returned churned Subscriber **revives the same Entity** at the same spot.
6. `delinquent` is excluded from risk reasons.
