# Isometric Stripe Dashboard

An app that renders a business's Stripe data as a living, isometric pixel-art world. One context: data comes in as Signals, themes render them as Worlds.

## Language

**Signal**:
A semantic fact about the business that the data layer emits. Two kinds exist: Moment Signals and the Risk Overlay. Themes consume Signals; they never read Stripe data directly.
_Avoid_: event (collides with Stripe's `Event` object), metric

**Moment Signal**:
A timestamped Signal that records something that happened: appeared, grew, shrank, churned, returned, payment received, payment failed. The Timeline is made of these.
_Avoid_: event, activity

**Timeline**:
The ordered list of all Moment Signals of one business. A fold of the Timeline up to a time T yields the World state at T.
_Avoid_: history, event stream, log

**Risk Overlay**:
The present-only set of churn-risk states (reasons and severity per Subscriber). It applies only when the World shows "now", never at a past time.
_Avoid_: risk history, alerts

**Subscriber**:
The paying customer of the business that one Entity represents — one Stripe customer that has ever had a subscription, with MRR aggregated across its subscriptions.
_Avoid_: customer (collides with Stripe's `Customer` object), user, account

**Size Tier**:
One of four buckets of a Subscriber's MRR. The Size Tier decides how large its Entity renders.
_Avoid_: level, stage, rank

**World**:
The rendered three-dimensional scene that represents one business at one point in time. The viewer sees it from a raised angle and can turn and tilt it.
_Avoid_: scene, map, dashboard canvas, isometric view

**Entity**:
The visual object inside a World that represents exactly one subscriber — a tree in the forest, a building in the city.
_Avoid_: sprite, avatar, unit

**Scenery**:
Everything inside a World that represents no Subscriber — grass, rocks, roads, street lights, townsfolk. Scenery reads no Signal and its amount never varies with the data.
_Avoid_: prop, decoration, background, set dressing

**Mourning Window**:
The period after a Subscriber churns during which its Entity keeps a dramatic form, before it decays to a quiet residue form (forest: 90 days, then a stump). Every Theme must define one — without it an old business renders as a graveyard.
_Avoid_: grace period (collides with Stripe's dunning grace period), decay time

**Theme**:
One of the fixed visual styles (Forest, City, RTS). A Theme is a skin over the Signal set: it defines how a World looks, never what the data means.
_Avoid_: template, skin, style
