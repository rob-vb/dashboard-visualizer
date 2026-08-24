# Grilling: onboarding flow, demo mode, and customization surface

Type: grilling
Status: resolved

## Question

Design the product surface around the World: the exact onboarding steps (sign-up → connect Stripe → pick theme → customize → world), the demo mode for visitors without a Stripe key, and where the cosmetic knobs live.

## Answer

> Resolved autonomously with recommended defaults — veto freely.

**Onboarding flow (decided order — sync before theme pick, so previews use real data):**

1. **Landing** — the pitch plus a **live demo World** rendered inline from the mock generator (the landing page *is* the demo; no separate signup needed to watch it rain).
2. **Sign up** — Better Auth, email magic link + Google OAuth. No passwords in MVP.
3. **Connect Stripe** — paste a restricted read-only key (`rk_live_...`). The screen shows the exact permission checklist from research 03 §4 with a link to the Stripe create-key page, validates the key with one ping call, and states plainly: read-only, encrypted, revocable in Stripe at any time. Wrong-shaped key (`sk_`) is rejected with an explanation — never accept a full secret key.
4. **First sync** — progress rendered as the World literally growing from bare ground while history backfills (the sync progress screen is the first wow moment, not a spinner). Research 03: a full sync is minutes at worst.
5. **Pick a theme** — three live previews (forest / city / RTS) rendered from the user's own just-synced Signals.
6. **Customize** — the chosen theme's 2–3 cosmetic knobs, skippable.
7. **The World** — with the timeline bar and a "share your world" affordance.

**Demo mode (decided):** route `/demo`, driven by the mock Signal generator with the fixed seed and the `sCurve` default preset, theme switchable, timeline enabled — it doubles as the theme-preview gallery for logged-out visitors. No accounts, no persistence. (The prototype's preset/seed controls stay dev-only.)

**Customization surface (decided):** knobs live in a small "paintbrush" popover on the World screen, not in onboarding-only settings; changes apply instantly and persist per user per theme. Global settings stay minimal: theme choice, knobs, share-link toggle, disconnect key.

**Assumptions to veto:** magic link + Google only; sync-before-theme-pick order; landing page doubles as demo.