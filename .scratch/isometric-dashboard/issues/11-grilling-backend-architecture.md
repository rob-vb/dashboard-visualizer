# Grilling: backend architecture, share link, refresh cadence

Type: grilling
Status: resolved

## Question

Spec-level design (the frontend-first build order stands — this decides shape, not build sequence): Convex data model, Stripe→Convex sync, encrypted key storage, Better Auth integration, the share-link mechanism, and the refresh cadence + sync UX.

## Answer

> Resolved autonomously with recommended defaults — veto freely. Spec-level only; backend build still starts after the frontend is proven (standing preference).

**What Convex stores (decided): derived Signals, not raw Stripe mirrors.** The sync adapter runs server-side, converts Stripe objects straight into the ticket-04 shapes, and persists those:

- `connections`: userId, encrypted key, accountLabel, status (`ok | syncing | error`), lastSyncAt, tierBounds
- `signals`: connectionId, kind, at, subscriberId, payload (mrr/tier/amount) — the Timeline, append-only, indexed on (connectionId, at)
- `riskOverlay`: connectionId, subscriberId, reasons, severity — replaced wholesale each sync (present-only, ADR-0002)
- `subscriberMeta`: connectionId, subscriberId, display name — kept separate so share links can exclude it
- `shares`: connectionId, slug, enabled, createdAt

Raw Stripe responses are **not** persisted: they are re-derivable from Stripe at any time, and storing less Stripe data is the better privacy posture. Trade-off recorded: a future Signal-set change requires a full re-sync (minutes, per research 03 §6) instead of a local re-derive — acceptable.

**Key storage (decided):** AES-256-GCM at the application layer with a master key in a Convex environment variable; ciphertext in `connections`. The plaintext key exists only inside Convex actions during a sync; it is never returned by any query and never reaches the client. MVP accepts the single-master-key model; per-user KMS is a SaaS-hardening upgrade.

**Sync (decided):** Convex action, two modes sharing one adapter: **backfill** on connect (subscriptions `status=all` → invoices → charges, per research 03; ~750–1,100 calls for a 1k-subscriber account) and **incremental** on schedule (`created`-filtered lists + a live-fields sweep for the Risk Overlay). Cadence: **cron every 6 hours** plus a manual "Refresh now" button throttled to one per 15 minutes — comfortably inside Stripe's read allocation (research 03 §5). Sync UX: "last synced X ago" chip on the World; during a sync the chip animates and new Signals pop in when the fold refreshes.

**Better Auth (decided):** Better Auth with the Convex adapter; sessions via its Next.js middleware; `userId` is the tenant key on every table. Email magic link + Google (ticket 10).

**Share link (decided):** `worlds.app/w/<slug>` (slug = 10-char random id, regenerable), owner-toggleable, off by default. A viewer gets: the World, theme + knobs, aggregates (MRR total optional — **owner chooses** whether revenue numbers show), and the timeline. A viewer never gets: subscriber names/roster or per-Entity MRR values (tooltips show tier + status only). Implemented as a public Convex query keyed by slug reading `signals` but never `subscriberMeta`; renders in the same client renderer. Viewing needs no account; the page is `noindex`.

**Assumptions to veto:** derived-signals-only storage; 6-hour cadence; revenue-visibility as an owner toggle defaulting to hidden; slug-based public links (no password option in MVP).