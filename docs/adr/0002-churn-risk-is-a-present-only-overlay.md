# Churn risk is a present-only overlay, never part of the Timeline

Stripe retains Event objects for only 30 days, so business history must be rebuilt from persisted objects (subscriptions, invoices, charges). Those objects carry timestamps for *moments* (appeared, grew, churned, paid) but only *live* values for risk fields (`cancel_at_period_end`, `status=past_due`, `trial_end`, `pause_collection`). We decided the Signal layer therefore splits in two: a **Timeline of Moment Signals** that supports scrubbing to any past time, and a **Risk Overlay** that applies only when the World shows "now". The alternative — snapshotting risk state on every sync to accumulate our own risk history — was deferred: it only helps after months of running and complicates the MVP data model.

## Consequences

- Scrubbing to the past never shows at-risk (orange) Entities; a rescued near-churn leaves no trace. Themes and the timeline UX must not promise otherwise.
- If risk history is ever wanted, sync-time snapshots can be added later without changing the Theme contract.
