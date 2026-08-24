# Reconstructing full business history from the Stripe API (restricted read-only key)

Research date: 2026-08-18. All claims verified against docs.stripe.com (Stripe API reference and guides) on this date.

## Verdict

**Full business history is reconstructable without events — with one bounded exception.** Stripe's core list endpoints (Customers, Subscriptions, Invoices, Charges, PaymentIntents) have **no documented age limit**: they paginate back to the first object ever created, and `status=all` on List Subscriptions returns canceled/churned subscriptions from any era. Event objects are only available for **30 days**, so the *event stream* is not the source of truth — the **objects themselves are**. Lifecycle history comes from timestamps persisted on the objects (`created`, `start_date`, `canceled_at`, `ended_at`, invoice `status_transitions.paid_at`, etc.). The exception: **intra-subscription change history** (upgrades/downgrades, quantity changes older than 30 days) is not stored as a first-class record; it must be *inferred* from invoices (`billing_reason=subscription_update`, proration line items, line periods). Changes that never produced an invoice line are permanently invisible. Churn-*risk* signals are all live fields on current objects and need no history at all. A restricted read-only key covers everything; a full 3-year/1,000-subscriber sync is ~750–1,100 list calls, i.e. well under a minute of API time at conservative rates.

---

## 1. Event retention: 30 days, confirmed

- The Events API page states: **"You can access events through the Retrieve Event API for 30 days."**
  Source: https://docs.stripe.com/api/events
- The List Events endpoint description states: **"List events, going back up to 30 days."** Each event renders per the API version at its creation time.
  Source: https://docs.stripe.com/api/events/list

Consequence: any history older than 30 days must come from the persisted objects, not from `customer.subscription.updated` / `invoice.paid` / etc. events.

## 2. Objects that carry reconstructable history

### 2.1 Subscriptions — full lifecycle, including churned, no age limit

List endpoint: `GET /v1/subscriptions`.

- Default behavior: "By default, returns a list of subscriptions that have not been canceled. In order to list canceled subscriptions, specify `status=canceled`."
- `status` parameter: "Passing in a value of `canceled` will return all canceled subscriptions, **including those belonging to deleted customers**. Pass `ended` to find subscriptions that are canceled and subscriptions that are expired due to incomplete payment. Passing in a value of `all` will return subscriptions of all statuses."
- Filters: `created` (date interval), `current_period_start`/`current_period_end`, `customer`, `price`, `collection_method`. `limit` ranges 1–100, default 10.
- **No age limit or "data before date X excluded" statement appears anywhere on the page.**
  Source: https://docs.stripe.com/api/subscriptions/list

Lifecycle fields on the Subscription object (all confirmed present with these semantics):

| Field | Documented semantics |
|---|---|
| `created` | Time at which the object was created (Unix epoch). |
| `start_date` | "Date when the subscription was first created. The date might differ from the `created` date due to backdating." |
| `canceled_at` | "If the subscription has been canceled, the date of that cancellation. If the subscription was canceled with `cancel_at_period_end`, `canceled_at` will reflect the time of the most recent update request, not the end of the subscription period." |
| `ended_at` | "If the subscription has ended, the date the subscription ended." |
| `cancel_at_period_end` | "Whether this subscription will (if `status=active`) or did (if `status=canceled`) cancel at the end of the current billing period." |
| `cancel_at` | "A date in the future at which the subscription will automatically get canceled." |
| `trial_start` / `trial_end` | Beginning / end of the trial, if any. |
| `cancellation_details` | "Details about why this subscription was cancelled" (comment, feedback, reason). |
| `status` | Enum: `incomplete`, `incomplete_expired`, `trialing`, `active`, `past_due`, `canceled`, `unpaid`, `paused`. `incomplete_expired` is terminal (first invoice unpaid within 23 hours). `paused` occurs only when a trial ends without a payment method, and "is different from pausing collection, which still generates invoices and leaves the subscription's status unchanged." With `charge_automatically`, failed payment → `past_due`; after retries are exhausted → `canceled` or `unpaid` per account settings. |

Source: https://docs.stripe.com/api/subscriptions/object

So: **subscriber appearance** = `start_date`/`created`; **churn** = `status=canceled` + `canceled_at`/`ended_at` + `cancellation_details`; both are retrievable for the account's entire lifetime via `status=all`.

### 2.2 Invoices — the payment/billing ledger, no age limit

List endpoint: `GET /v1/invoices`. "You can list all invoices, or list the invoices for a specific customer. The invoices are returned sorted by creation date, with the most recently created invoices appearing first." Filters: `created` (date interval), `status` (`draft`, `open`, `paid`, `uncollectible`, `void`), `customer`, `subscription`, `collection_method`. `limit` 1–100. **No age limit documented.**
Source: https://docs.stripe.com/api/invoices/list

Invoice object fields (all confirmed):

- `created` (timestamp), `status` (`draft`, `open`, `paid`, `uncollectible`, `void`).
- `status_transitions` — "The timestamps at which the invoice status was updated": `finalized_at`, `paid_at`, `marked_uncollectible_at`, `voided_at`. **`paid_at` gives the exact historical payment date for every invoice ever paid.**
- `amount_paid` — "The amount, in the smallest currency unit, that was paid." Plus `amount_due`, `amount_remaining`, `amount_overpaid`.
- `attempt_count` — "Number of payment attempts made for this invoice, from the perspective of the payment retry schedule. Any payment attempt counts as the first attempt, and subsequently only automatic retries increment the attempt count."
- `attempted`, `next_payment_attempt` — "The time at which payment will next be attempted. This value will be `null` for invoices where `collection_method=send_invoice`."
- `billing_reason` — why the invoice was created: `subscription_create` ("A new subscription was created"), `subscription_cycle` ("A subscription advanced into a new period"), `subscription_update` ("A subscription was updated"), `subscription_threshold`, `manual`, etc.
- Subscription linkage: the `parent` object carries the details of what generated the invoice (subscription details); the List Invoices `subscription` filter confirms invoices are queryable per subscription.
- `period_start` / `period_end`, `lines` (line items, embedded list with `has_more`).

Source: https://docs.stripe.com/api/invoices/object

**Invoices are the primary reconstruction substrate for "payments landing" and for MRR-over-time**: every historical payment has `status=paid` + `status_transitions.paid_at` + `amount_paid` + a subscription linkage.

### 2.3 Charges / PaymentIntents — no documented age limit

- List Charges: "Returns a list of charges you've previously created. The charges are returned in sorted order, with the most recent charges appearing first." Filters: `created` (date interval), `customer`, `payment_intent`. `limit` 1–100. **The page contains no "last N charges" restriction and no statement that data before a certain date is excluded.** (The suspicion about a restricted charges list is not supported by the current List Charges reference page.)
  Source: https://docs.stripe.com/api/charges/list
- Charge fields visible in the reference response: `created`, `status` (e.g. `succeeded`), `paid` (boolean), `failure_code`, `failure_message`, `outcome`, `amount`, `amount_refunded`, `refunded`, `disputed`.
  Source: https://docs.stripe.com/api/charges/list (response schema; object detail at https://docs.stripe.com/api/charges/object)
- List PaymentIntents: "Returns a list of PaymentIntents." Filters: `created`, `customer`. `limit` 1–100. **No age limit documented.**
  Source: https://docs.stripe.com/api/payment_intents/list
- One caveat that exists but does not apply to live data: list APIs omit **test-clock-generated** results in "list all" requests unless scoped to a parent (`customer`, `subscription`, `test_clock`).
  Source: https://docs.stripe.com/search (Limitations, "Test clock objects omitted in list all results")
- Note: the *Search* API (`/v1/.../search`) is a separate, cached index (data searchable "in under 1 minute", 20 reads/s). For a full sync use the list APIs, which "aren't subject to the availability delays." The Search page documents no historical cutoff either.
  Source: https://docs.stripe.com/search

### 2.4 Customers — no age limit; deleted customers are the one data loss

- List Customers: "Returns a list of your customers. The customers are returned sorted by creation date, with the most recent customers appearing first." Filters: `created` (date interval), `email` (exact). `limit` 1–100. **No age limit documented.**
  Source: https://docs.stripe.com/api/customers/list
- Fields: `created` (timestamp); `currency` ("the currency the customer can be charged in for recurring billing purposes"); `delinquent` (see §3); `balance`; `invoice_credit_balance`.
  Source: https://docs.stripe.com/api/customers/object
- Deleted customers: "Permanently deletes a customer. It cannot be undone. Also immediately cancels any active subscriptions on the customer. … **Unlike other objects, deleted customers can still be retrieved through the API in order to be able to track their history.** Deleting customers removes all credit card details and prevents any further operations to be performed."
  Source: https://docs.stripe.com/api/customers/delete
  The docs guarantee *retrieval by ID* of deleted customers; they do not state that deleted customers appear in List Customers results. Their canceled subscriptions DO still appear in `GET /v1/subscriptions?status=canceled` ("including those belonging to deleted customers" — https://docs.stripe.com/api/subscriptions/list).

### 2.5 Plan-change history (upgrades/downgrades) — inferable from invoices, not stored directly

The Subscription object's `items` list reflects only the **current** plan/price/quantity. There is no documented per-subscription change log outside the 30-day event window. What invoices reveal:

- Invoice `billing_reason=subscription_update` — "A subscription was updated" — flags every past plan change that generated an invoice.
  Source: https://docs.stripe.com/api/invoices/object
- Invoice line items carry, per line:
  - `parent.invoice_item_details.proration` (boolean) and `proration_details` (with `credited_items`) — proration lines are marked as such ("Always false for prorations" under `discountable` confirms prorations are a distinct line class).
  - `period` — "For prorations, this starts when the proration was calculated, and ends at the period end of the subscription." The proration `period.start` therefore timestamps the plan change.
  - `pricing.price_details.price` and `.product`, plus `quantity`/`quantity_decimal` — "If the line item is a proration or subscription, the quantity of the subscription that the proration was computed for."
  Source: https://docs.stripe.com/api/invoices/line_item
- Regular `subscription_cycle` invoice lines carry the price and quantity billed each period, so **period-by-period MRR per subscription can be rebuilt from cycle invoices alone**, with prorations refining the intra-period change dates.

**Limit (inference from the above, stated as such):** a subscription update that produces no invoice and no proration line (e.g. proration disabled and no immediate invoicing) leaves no retrievable trace after its events expire at 30 days. Exact old change timestamps are then only bracketed between two cycle invoices.

## 3. Churn-risk signals on live data (no event history required)

All confirmed as current-state fields:

| Signal | Field(s) | Documented semantics | Source |
|---|---|---|---|
| Scheduled cancellation | `cancel_at_period_end`, `cancel_at` | Will cancel at period end / "date in the future at which the subscription will automatically get canceled" | https://docs.stripe.com/api/subscriptions/object |
| Payment failing | `status=past_due` | "becomes `past_due` when payment is required but cannot be paid"; after retries exhausted → `canceled` or `unpaid` | https://docs.stripe.com/api/subscriptions/object |
| Collection given up | `status=unpaid` | "no subsequent invoices will be attempted (invoices will be created, but then immediately automatically closed)" | https://docs.stripe.com/api/subscriptions/object |
| Retry pressure | invoice `attempt_count`, `next_payment_attempt` | attempts made per retry schedule; time of next attempt (null for `send_invoice`) | https://docs.stripe.com/api/invoices/object |
| Customer-level delinquency | customer `delinquent` | "An automatic payment failure or passing the `invoice.due_date` will set this field to `true`." Caution in docs: it does not reset to false after dunning marks an invoice uncollectible; "If you care whether the customer has paid their most recent subscription invoice, use `subscription.status` instead." | https://docs.stripe.com/api/customers/object |
| Trial ending soon | `trial_end` (with `trial_start`, `status=trialing`) | end of trial, if any; `trial_settings.end_behavior.missing_payment_method` shows what happens without a payment method | https://docs.stripe.com/api/subscriptions/object |
| Paused collection | `pause_collection` (object) | "If specified, payment collection for this subscription will be paused. Note that the subscription status will be unchanged." Distinct from `status=paused` (trial ended without payment method). | https://docs.stripe.com/api/subscriptions/object |

## 4. Restricted API keys — what to ask the user to enable

From the API keys and Restricted API keys guides:

- A restricted API key (RAK, `rk_live_...` / `rk_test_...`) "can do only what you give it permission to do. When you create a RAK in the Stripe Dashboard, you select which Stripe resources the key can access and the permissions for each resource: **Read**, **Write**, or **None**. All Stripe APIs support restricted API keys." Default for every permission is **None**. "Write permissions imply read permissions."
  Source: https://docs.stripe.com/keys/restricted-api-keys
- Permission mapping is documented as: `GET` → read, `POST`/`DELETE` → write. Example mappings given in the docs: "`Customer.retrieve(...)` → **Customers: Read**", "`PaymentIntent.create(...)` → **PaymentIntents: Write**". Permissions are "grouped into categories" (e.g. Stripe Billing) in the Dashboard UI; the docs do not publish an exhaustive permission catalog on this page.
  Source: https://docs.stripe.com/keys/restricted-api-keys
- Dashboard creation steps (documented): Dashboard → **API keys** tab → **Create restricted key** (or Duplicate key) → optionally pick "a preconfigured set of permissions or start from zero permissions" → name the key → per resource select None/Read/Write → **Create key** → two-factor verification → copy the key (it cannot be revealed again for self-created live keys).
  Sources: https://docs.stripe.com/keys/restricted-api-keys , https://docs.stripe.com/keys
- Live restricted keys start with `rk_live_`; sandbox with `rk_test_`. Stripe explicitly recommends RAKs over secret keys, "especially when giving a key to an AI agent."
  Sources: https://docs.stripe.com/keys , https://docs.stripe.com/keys/restricted-api-keys

**What the app should tell the user to enable (Read, everything else None):**

- **Customers — Read** (customers list, `delinquent`)
- **Subscriptions — Read** (Billing category; subscriptions + subscription items)
- **Invoices — Read** (Billing category; invoices + line items)
- **Charges — Read** and/or **PaymentIntents — Read** (payments landing/failing)
- **Products / Plans / Prices — Read** (naming the plans behind line items)
- **Balance — Read** only if balance transactions / payout reconciliation is needed
- **Events — Read** optional: only useful for the trailing 30-day window (§1)

(The exact checkbox labels come from the Dashboard's category grouping; the docs confirm the None/Read/Write model and the GET→Read mapping rather than listing every label. A key with only these Read grants cannot create charges, access payment methods, or trigger payouts — the docs' own example of RAK damage limitation: https://docs.stripe.com/keys/restricted-api-keys)

## 5. Rate limits and pagination

From https://docs.stripe.com/rate-limits :

- **Global API rate limit: live mode 100 requests per second; sandbox 25 requests per second** (per Stripe account).
- **Individual API endpoints (unless otherwise noted): 25 requests per second.** This is the binding limit for a paginated sync hammering one list endpoint.
- Search API: 20 read requests per second (also https://docs.stripe.com/search).
- Exceeding limits returns `429 Too Many Requests` with a `Stripe-Rate-Limited-Reason` header (`global-rate`, `endpoint-rate`, `global-concurrency`, `endpoint-concurrency`, `resource-specific`). Recommended handling: exponential backoff with jitter; client-side token bucket. Concurrency limits are separate and are most often hit by "long-lived or resource-intensive API requests such as list requests or those that include expansions."
- **Read request allocation (important for a sync product):** "Your account's read API requests must not exceed an average of 500 per transaction" over a rolling 30-day period, with "a minimum allocation of 10,000 read requests per month" for every account. Write requests are unlimited. Stripe suggests Data Pipeline/Sigma for data-intensive analytics.
- Pagination: cursor-based via `starting_after`/`ending_before`; **`limit` ranges between 1 and 100, default 10** (https://docs.stripe.com/api/pagination). Reverse-chronological order.

## 6. Volume estimate: ~1,000 subscribers, 3 years of history

Assumptions: 1,000 customers; 1,200 subscriptions including churned; ~36,000 invoices (monthly billing); ~36,000 charges; page size 100.

| Resource | Objects | List calls (@100/page) |
|---|---|---|
| Customers | 1,000 | 10 |
| Subscriptions (`status=all`) | 1,200 | 12 |
| Invoices (lines embedded; typical subscription invoices have 1–2 lines, so extra `lines` pagination calls are negligible) | 36,000 | 360 |
| Charges | 36,000 | 360 |
| Products + Prices | ~10–200 | 2 |
| **Total (charges only)** | | **≈ 744** |
| **Total (+ PaymentIntents too)** | | **≈ 1,104** |

Wall-clock time:

- At 25 req/s (the documented per-endpoint ceiling, and a safe global pace): **744 calls ≈ 30 s; 1,104 calls ≈ 45 s** of pure request budget. Real time is dominated by latency; even fully sequential at ~4 req/s (250 ms/call) it is **≈ 3–5 minutes**. Interleaving endpoints (invoices + charges in parallel) stays under both the 25 req/s endpoint limit and the 100 req/s live global limit.
- Read allocation check: ~1,000 paid invoices/month ≈ 1,000 transactions per rolling 30 days → allocation ≈ 500,000 reads/30 days (minimum floor is 10,000/month regardless). A ~1,100-call full sync plus daily incremental syncs is orders of magnitude below the allocation. (https://docs.stripe.com/rate-limits, "API read request allocations")

Incremental syncs afterwards: use `created` date-interval filters (documented on every list endpoint used here) plus live status polling; the docs explicitly advise "Apply filters when possible to narrow your list results" (https://docs.stripe.com/rate-limits).

## 7. Hard feasibility limits — the practical ceiling

**CAN be fully reconstructed (unlimited lookback, per the list/API reference pages above):**

- Every customer, with signup date (`created`) — https://docs.stripe.com/api/customers/list
- Every subscription ever, including churned, with start (`start_date`, backdating-aware), cancellation request time (`canceled_at`), end (`ended_at`), cancel reason (`cancellation_details`) — https://docs.stripe.com/api/subscriptions/list , /object
- Every invoice ever, with exact paid time (`status_transitions.paid_at`), amount (`amount_paid`), outcome (`paid`/`open`/`uncollectible`/`void`), and per-line price/quantity/period — https://docs.stripe.com/api/invoices/list , /object , /line_item
- Every charge/PaymentIntent ever, with success/failure and `failure_code` — https://docs.stripe.com/api/charges/list , /api/payment_intents/list
- Period-by-period MRR per subscription from cycle invoices; plan-change points from `billing_reason=subscription_update` invoices and proration lines.

**CANNOT be reconstructed (the ceiling):**

1. **Anything that lives only in events, older than 30 days** (https://docs.stripe.com/api/events/list). Concretely: exact timestamps of subscription updates that generated no invoice; the precise sequence of status flaps (`active` → `past_due` → `active`) — only the current status and invoice `attempt_count`/`status_transitions` evidence remain; historical values of `cancel_at_period_end` that were later un-set (a rescued near-churn leaves no trace).
2. **Invoice-less subscription changes** — plan/quantity changes with prorations disabled and no update invoice leave no line items to infer from; only the before/after cycle invoices bracket them (inference; the object model documented above simply has nowhere to store them).
3. **Deleted customers' profile data** — the customer shell is retrievable "to track their history" but card details are removed and the record is frozen (https://docs.stripe.com/api/customers/delete). Their canceled subscriptions remain listable (https://docs.stripe.com/api/subscriptions/list).
4. **`canceled_at` precision caveat** — for `cancel_at_period_end` cancellations, `canceled_at` is the time of the update request, not the service end; use `ended_at` for churn dating (https://docs.stripe.com/api/subscriptions/object).
5. **`delinquent` is not a reliable historical flag** — it is a latest-state-change tracker with documented non-reset behavior; the docs themselves redirect to `subscription.status` (https://docs.stripe.com/api/customers/object).
6. **Sustained heavy re-reading** is bounded by the 500-reads-per-transaction/30-day allocation (min 10,000/month) — a design constraint for polling frequency, not for the one-time backfill (https://docs.stripe.com/rate-limits).

**Bottom line for Signal-set design:** build signals on objects, not events. Historical signals (appeared, grew, churned, paid) come from subscriptions + invoices with unlimited lookback; risk signals (at-risk) come from live fields (`cancel_at_period_end`, `status`, `attempt_count`, `next_payment_attempt`, `delinquent`, `trial_end`, `pause_collection`). The only irrecoverable gap is fine-grained intra-period change history older than 30 days, which degrades gracefully to invoice-line inference.
