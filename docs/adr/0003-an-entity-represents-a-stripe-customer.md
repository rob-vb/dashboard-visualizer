# An Entity represents a Stripe customer, not a subscription

A Stripe customer can hold several subscriptions, so "one Entity per subscriber" was ambiguous. We decided one Entity = one **Subscriber** = one Stripe customer that has ever had a subscription, with MRR aggregated across its subscriptions. The alternative (one Entity per subscription) was rejected: one paying company would render as several trees, growth by adding a subscription would spawn a new Entity instead of growing an existing one, and deterministic placement would churn whenever subscriptions are replaced.

## Consequences

- `subscriberId` (the Stripe customer id) is the stable identity for deterministic World placement.
- A churned Subscriber that returns revives the same Entity at the same spot.
- Adding or removing a subscription shows as the existing Entity growing or shrinking, never as a new Entity.
