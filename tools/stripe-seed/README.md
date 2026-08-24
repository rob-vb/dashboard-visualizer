# Stripe test-data seeding (ticket 07)

Seeds a Stripe **test-mode** account with a simulated multi-month subscription
history — signups, an upgrade, cancellations, a failed-payment churn — using
**test clocks**, so the history-reconstruction rules from
[research 03](../../.scratch/isometric-dashboard/research/03-stripe-history.md)
can be validated against real API responses.

Deviation from the ticket: the scripts call the Stripe REST API directly from
Node (≥18, no dependencies) instead of the Stripe CLI — the CLI is not
installed here, and a script is the more reproducible record anyway.

## Run it

```
bash tools/stripe-seed/setup-wizard.sh
```

The wizard walks through the only steps a human can do (grabbing keys from the
Stripe Dashboard), stores them in `tools/stripe-seed/.env` (gitignored), then
offers to run the seed and the validation.

To re-run pieces by hand afterwards:

```
node tools/stripe-seed/seed.js       # needs STRIPE_TEST_SECRET_KEY (sk_test_...)
node tools/stripe-seed/validate.js   # needs STRIPE_TEST_READONLY_KEY (rk_test_...)
```

`seed.js` is **not idempotent** — each run creates a fresh set of objects
(names are prefixed `[seed]`). Run it against an empty sandbox, or accept
duplicates.

## What gets seeded

Defined in the `SCENARIO` table at the top of `seed.js`; the run writes the
created object ids to `tools/stripe-seed/seed-manifest.json`:

- 3 products/prices: Seedling €9/mo, Sapling €29/mo, Evergreen €99/mo
- 4 test clocks (cohorts starting 6, 6, 4, and 1 months ago; 3 customers each,
  advanced month by month to today)
- 12 customers / subscriptions in total, covering: plain payers on every plan,
  one upgrade at month 3 (→ `subscription_update` invoice + prorations), one
  `cancel_at_period_end` cancellation, one immediate cancellation, one
  failed-payment churn (`pm_card_chargeCustomerFail` → `past_due` → canceled),
  one 14-day trial that converts, and two fresh month-old signups

## What validate.js checks

Reads with the **restricted read-only key** only (the same shape of key the
MVP app will get) and rebuilds Moment Signals per ticket 04:

- `subscriptions?status=all` → `subscriber_appeared` / `subscriber_churned`
- paid invoices (`status_transitions.paid_at`) → `payment_received`
- open/uncollectible invoices with attempts → `payment_failed`
- `billing_reason=subscription_update` invoices → `subscriber_grew/shrank`

It prints the reconstructed timeline and asserts the scenario coverage
(a canceled subscription, a failed payment, an update invoice are all found).

## Where things live (fill in after the first successful run)

- Test account / sandbox: _(record the sandbox name here)_
- Keys: `tools/stripe-seed/.env` (`STRIPE_TEST_SECRET_KEY` for seeding,
  `STRIPE_TEST_READONLY_KEY` for the app/validation) — never committed
- Seeded objects: `tools/stripe-seed/seed-manifest.json`
