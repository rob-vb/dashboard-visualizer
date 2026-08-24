# Research: reconstructing business history from the Stripe API

Type: research
Status: resolved

## Question

How do we reconstruct a full business history (subscribers appearing, growing, at churn risk, churned; payments landing) from the Stripe API using a pasted **restricted read-only key**, given that Stripe event objects are only retained ~30 days?

- Which objects carry history: subscriptions (start/canceled/ended dates), invoices, charges, customers? How far back can each be listed?
- Which churn-risk signals exist on live data: `cancel_at_period_end`, `past_due`, failed payment retries, others?
- What minimum permissions must the restricted key have, and what should the app tell the user to enable when creating it?
- Rate limits and realistic sync volume: for a business with e.g. 1,000 subscribers and 3 years of history, roughly how many API calls and how long does a full pull take?
- Any hard limits that make "full history since the first customer" infeasible — if so, what is the practical ceiling?

## Answer

Full findings: [research/03-stripe-history.md](../research/03-stripe-history.md) (all claims cite docs.stripe.com; researched 2026-08-18).

**Verdict: feasible.** Full history since the first customer is reconstructable from persisted objects, not events. Events are retained only 30 days, so never build history on the event stream.

**Reconstruction approach.** The core list endpoints — Customers, Subscriptions, Invoices, Charges, PaymentIntents — have no documented age limit and paginate back to the account's first object. `GET /v1/subscriptions?status=all` returns every subscription ever, including canceled ones and those of deleted customers. Lifecycle timestamps live on the objects: subscriber appearance = `start_date`/`created`; churn = `status=canceled` + `ended_at` (use `ended_at`, not `canceled_at`, for churn dating) + `cancellation_details`; payments landing = invoice `status_transitions.paid_at` + `amount_paid` (charges add `failure_code` for failed payments). Growth (upgrades/downgrades) is not stored directly — infer it from invoices with `billing_reason=subscription_update`, proration line items (`period.start` timestamps the change), and per-line price/quantity on `subscription_cycle` invoices, which rebuild period-by-period MRR per subscription.

**Churn-risk signals (all live fields, no history needed):** `cancel_at_period_end` / `cancel_at` (scheduled cancellation), subscription `status=past_due` / `unpaid` (payment failing / collection given up), invoice `attempt_count` + `next_payment_attempt` (retry pressure), customer `delinquent` (unreliable — does not reset; prefer `subscription.status`), `trial_end` with `trial_settings.end_behavior.missing_payment_method` (trial ending without a card), `pause_collection`.

**Restricted key — minimum permissions (Read; everything else None):** Customers, Subscriptions, Invoices, Charges and/or PaymentIntents, Products/Plans/Prices. Optional: Balance (payout reconciliation), Events (trailing 30-day window only). The app should tell the user: Dashboard → API keys → Create restricted key → set those resources to Read → Create; the `rk_live_...` key is shown once.

**Rate limits / volume.** Live mode: 100 req/s global, 25 req/s per endpoint, page size max 100; plus a read allocation of 500 reads per transaction over a rolling 30 days (min 10,000/month) — a constraint on polling cadence, not on the backfill. A 1,000-subscriber, 3-year full sync is roughly 750–1,100 list calls: about 30–45 s of request budget at 25 req/s, and only 3–5 minutes even fully sequential. Incremental syncs use `created` date filters.

**Hard limits (the ceiling, load-bearing for ticket 04):** (1) anything that lived only in events and is older than 30 days is gone — exact timestamps of invoice-less subscription updates, historical status flaps (`active` → `past_due` → `active`), and rescued near-churns (`cancel_at_period_end` set then unset) leave no trace; (2) plan changes with prorations disabled and no update invoice are only bracketed between two cycle invoices; (3) deleted customers keep a frozen retrievable shell but lose profile/card data. Everything else — appear, grow (invoice-inferred), churn, pay, and all at-risk states as of "now" — Stripe provides in full.
