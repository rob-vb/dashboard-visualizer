# Task: seed a Stripe test-mode account with simulated history

Type: task
Status: claimed

## Question

The user's Stripe account is nearly empty. Seed a Stripe **test-mode** account with a simulated multi-month subscription history — signups, upgrades, cancellations, failed payments — via the Stripe CLI and test clocks, so the history-reconstruction approach from [Research: Stripe history](03-research-stripe-history.md) can later be validated against real API responses.

On resolution, record: where the test account and restricted key live, what was seeded (customer count, date range, scenario mix), and the exact commands/scripts used so the seed is reproducible.

## Comments

**2026-08-18 (autonomous session):** everything scriptable is ready at `tools/stripe-seed/`; what remains is the one step only a human can do — pasting Stripe keys.

- `setup-wizard.sh` — run `bash tools/stripe-seed/setup-wizard.sh`: walks you through grabbing the sandbox's `sk_test_` key and creating the restricted read-only `rk_test_` key (the same key shape the app will ask users for, per research 03 §4), stores both in `tools/stripe-seed/.env` (gitignored), then runs the seed and validation for you.
- `seed.js` — dependency-free Node script (deviates from the ticket's "Stripe CLI" — the CLI is not installed and a script is the better reproducible record): 3 products/prices (€9/€29/€99), 4 test clocks advanced month by month, 12 customers over 6 months covering plain payers, an upgrade (proration invoice), `cancel_at_period_end`, an immediate cancel, a failed-payment churn (`pm_card_chargeCustomerFail`), and two trials. Writes `seed-manifest.json`.
- `validate.js` — reads with the read-only key only and rebuilds the Moment Signals per ticket 04 (`status=all` subscriptions, invoice `paid_at`, `billing_reason=subscription_update`), then PASS/FAILs the coverage checks from research 03. Scopes every list call by customer because test-clock objects are omitted from unscoped list calls.

**Still open (human step):** run the wizard, then fill in "Where things live" in `tools/stripe-seed/README.md`. The ticket resolves when `validate.js` passes against the seeded account.
