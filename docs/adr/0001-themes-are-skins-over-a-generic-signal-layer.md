# Themes are skins over a generic Signal layer

The app ships multiple visual themes (forest, city, RTS) on top of one data layer. We decided that the data layer emits a single canonical set of semantic Signals (new subscriber, growth, churn risk, churned, payment), and every Theme renders exactly that set — no theme-specific data rules or mechanics. The alternative (each theme with its own rules) was rejected because it multiplies the data layer per theme and makes new themes expensive; with a generic Signal layer a new theme is pure visuals.

## Consequences

- Adding a theme never touches the Stripe/data code.
- A theme cannot demand data the Signal set does not carry; extending the set is a deliberate, cross-theme decision.
