#!/usr/bin/env node
/* Seed a Stripe TEST-MODE account with simulated subscription history
 * (ticket 07). Node >= 18, no dependencies. Test clocks advance month by
 * month, so the account ends up with real historical invoices/cancellations.
 *
 * Usage: node tools/stripe-seed/seed.js
 * Key:   STRIPE_TEST_SECRET_KEY (sk_test_...) from env or tools/stripe-seed/.env
 */

'use strict';
const fs = require('fs');
const path = require('path');

// ---------- config ----------

const DAY = 86400;
const MONTH = 30 * DAY;
const NOW = Math.floor(Date.now() / 1000);

const PLANS = {
  seedling: { name: '[seed] Seedling', amount: 900 },
  sapling: { name: '[seed] Sapling', amount: 2900 },
  evergreen: { name: '[seed] Evergreen', amount: 9900 },
};

// One clock per cohort (3 customers each — stays well inside test-clock limits).
// months are offsets from the cohort start; actions run just before the
// advance INTO that month.
const SCENARIO = [
  {
    cohort: 'A', startMonthsAgo: 6, customers: [
      { name: '[seed] Fernwood Labs', plan: 'seedling' },
      { name: '[seed] Brambleforge Co', plan: 'sapling', actions: { 3: 'upgrade:evergreen' } },
      { name: '[seed] Cedarhaven HQ', plan: 'evergreen' },
    ],
  },
  {
    cohort: 'B', startMonthsAgo: 6, customers: [
      { name: '[seed] Mossgate Systems', plan: 'sapling', actions: { 4: 'cancel_at_period_end' } },
      { name: '[seed] Willowmill Studio', plan: 'seedling', actions: { 4: 'cancel_now' } },
      { name: '[seed] Thornfield App', plan: 'sapling', actions: { 2: 'fail_payments', 3: 'cancel_now' } },
    ],
  },
  {
    cohort: 'C', startMonthsAgo: 4, customers: [
      { name: '[seed] Otterbrook Digital', plan: 'seedling', trialDays: 14 },
      { name: '[seed] Hazelridge Ltd', plan: 'evergreen' },
      { name: '[seed] Rowanwell GmbH', plan: 'sapling' },
    ],
  },
  {
    cohort: 'D', startMonthsAgo: 1, customers: [
      { name: '[seed] Junipergate Software', plan: 'sapling' },
      { name: '[seed] Ivyloft Labs', plan: 'seedling', trialDays: 14 },
      { name: '[seed] Alderworks Co', plan: 'seedling' },
    ],
  },
];

// ---------- env + api helpers ----------

function loadEnv() {
  const file = process.env.ENV_FILE || path.join(__dirname, '.env');
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  }
}
loadEnv();
const KEY = process.env.STRIPE_TEST_SECRET_KEY;
if (!KEY || !KEY.startsWith('sk_test_')) {
  console.error('STRIPE_TEST_SECRET_KEY (sk_test_...) is required — run setup-wizard.sh first.');
  process.exit(1);
}

function formEncode(obj, prefix = '', out = []) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}[${k}]` : k;
    if (v === null || v === undefined) continue;
    if (typeof v === 'object') formEncode(v, key, out);
    else out.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
  }
  return out.join('&');
}

async function stripe(method, p, params) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch('https://api.stripe.com/v1' + p, {
      method,
      headers: {
        Authorization: 'Basic ' + Buffer.from(KEY + ':').toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: method === 'GET' ? undefined : formEncode(params || {}),
    });
    if (res.status === 429 && attempt < 5) {
      await sleep(1000 * (attempt + 1));
      continue;
    }
    const body = await res.json();
    if (!res.ok) throw new Error(`${method} ${p} -> ${res.status}: ${body.error && body.error.message}`);
    return body;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function advanceClock(clockId, to) {
  await stripe('POST', `/test_helpers/test_clocks/${clockId}/advance`, { frozen_time: to });
  for (let i = 0; i < 120; i++) {
    await sleep(3000);
    const c = await stripe('GET', `/test_helpers/test_clocks/${clockId}`);
    if (c.status === 'ready') return;
    if (c.status === 'internal_failure') throw new Error(`clock ${clockId} failed to advance`);
  }
  throw new Error(`clock ${clockId} still advancing after 6 minutes`);
}

// ---------- seed ----------

(async () => {
  const manifest = { createdAt: new Date().toISOString(), prices: {}, clocks: [] };

  console.log('Creating products and prices...');
  for (const [key, plan] of Object.entries(PLANS)) {
    const product = await stripe('POST', '/products', { name: plan.name, metadata: { seed: 'true' } });
    const price = await stripe('POST', '/prices', {
      product: product.id, currency: 'eur', unit_amount: plan.amount,
      recurring: { interval: 'month' }, metadata: { seed: 'true' },
    });
    manifest.prices[key] = price.id;
    console.log(`  ${plan.name}: ${price.id}`);
  }

  for (const cohort of SCENARIO) {
    const start = NOW - cohort.startMonthsAgo * MONTH;
    console.log(`\nCohort ${cohort.cohort}: clock starts ${new Date(start * 1000).toISOString().slice(0, 10)}`);
    const clock = await stripe('POST', '/test_helpers/test_clocks', {
      frozen_time: start, name: `[seed] cohort ${cohort.cohort}`,
    });
    const entry = { id: clock.id, cohort: cohort.cohort, customers: [] };
    manifest.clocks.push(entry);

    for (const c of cohort.customers) {
      const customer = await stripe('POST', '/customers', {
        name: c.name,
        email: c.name.replace(/[^a-z]+/gi, '.').toLowerCase() + '@example.com',
        test_clock: clock.id,
        payment_method: 'pm_card_visa',
        invoice_settings: { default_payment_method: 'pm_card_visa' },
        metadata: { seed: 'true' },
      });
      const subParams = {
        customer: customer.id,
        items: { 0: { price: manifest.prices[c.plan] } },
        collection_method: 'charge_automatically',
        metadata: { seed: 'true' },
      };
      if (c.trialDays) subParams.trial_period_days = c.trialDays;
      const sub = await stripe('POST', '/subscriptions', subParams);
      entry.customers.push({ id: customer.id, subscription: sub.id, name: c.name, plan: c.plan, actions: c.actions || {} });
      console.log(`  ${c.name}: ${customer.id} / ${sub.id}`);
    }

    // advance month by month, applying scheduled actions first
    for (let m = 1; m <= cohort.startMonthsAgo; m++) {
      for (const c of entry.customers) {
        const action = (c.actions || {})[m];
        if (!action) continue;
        console.log(`  [month ${m}] ${c.name}: ${action}`);
        if (action.startsWith('upgrade:')) {
          const toPlan = action.split(':')[1];
          const sub = await stripe('GET', `/subscriptions/${c.subscription}`);
          await stripe('POST', `/subscriptions/${c.subscription}`, {
            items: { 0: { id: sub.items.data[0].id, price: manifest.prices[toPlan] } },
            proration_behavior: 'always_invoice',
          });
        } else if (action === 'cancel_at_period_end') {
          await stripe('POST', `/subscriptions/${c.subscription}`, { cancel_at_period_end: true });
        } else if (action === 'cancel_now') {
          await stripe('DELETE', `/subscriptions/${c.subscription}`);
        } else if (action === 'fail_payments') {
          await stripe('POST', '/payment_methods/pm_card_chargeCustomerFail/attach', { customer: c.id });
          await stripe('POST', `/customers/${c.id}`, {
            invoice_settings: { default_payment_method: 'pm_card_chargeCustomerFail' },
          });
        }
      }
      const to = Math.min(start + m * MONTH, NOW - 60);
      process.stdout.write(`  advancing clock to month ${m}...`);
      await advanceClock(clock.id, to);
      console.log(' ready');
    }
  }

  const out = path.join(__dirname, 'seed-manifest.json');
  fs.writeFileSync(out, JSON.stringify(manifest, null, 2));
  console.log(`\nDone. Manifest written to ${out}`);
  console.log('Now run: node tools/stripe-seed/validate.js');
})().catch((e) => { console.error('\nSEED FAILED:', e.message); process.exit(1); });
