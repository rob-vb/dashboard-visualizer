#!/usr/bin/env node
/* Validate the history-reconstruction approach (research 03, ticket 04)
 * against the seeded Stripe test account — using ONLY a restricted read-only
 * key, i.e. exactly what the MVP app will hold.
 *
 * Usage: node tools/stripe-seed/validate.js
 * Key:   STRIPE_TEST_READONLY_KEY (rk_test_...) from env or tools/stripe-seed/.env
 */

'use strict';
const fs = require('fs');
const path = require('path');

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
const KEY = process.env.STRIPE_TEST_READONLY_KEY || process.env.STRIPE_TEST_SECRET_KEY;
if (!KEY) {
  console.error('STRIPE_TEST_READONLY_KEY (rk_test_...) is required — run setup-wizard.sh first.');
  process.exit(1);
}

async function stripeGet(p, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`https://api.stripe.com/v1${p}${qs ? '?' + qs : ''}`, {
    headers: { Authorization: 'Basic ' + Buffer.from(KEY + ':').toString('base64') },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`GET ${p} -> ${res.status}: ${body.error && body.error.message}`);
  return body;
}

// IMPORTANT (research 03 + Stripe docs): objects created under a test clock are
// omitted from unscoped "list all" calls, so we scope every list by customer.
async function listAll(p, params = {}) {
  const out = [];
  let after;
  for (;;) {
    const page = await stripeGet(p, Object.assign({ limit: 100 }, params, after ? { starting_after: after } : {}));
    out.push(...page.data);
    if (!page.has_more) return out;
    after = out[out.length - 1].id;
  }
}

const d = (ts) => (ts ? new Date(ts * 1000).toISOString().slice(0, 10) : '—');
const euro = (cents) => '€' + (cents / 100).toFixed(2);

(async () => {
  // seeded customers come from the test clocks in the manifest (test-clock
  // objects don't show up in unscoped list calls)
  const manifestFile = path.join(__dirname, 'seed-manifest.json');
  if (!fs.existsSync(manifestFile)) {
    console.error('seed-manifest.json not found — run seed.js first.');
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  const customers = manifest.clocks.flatMap((c) => c.customers);
  console.log(`Validating against ${customers.length} seeded customers...\n`);

  const signals = []; // the reconstructed Moment Signals
  let churnedFound = 0, failedFound = 0, updateInvoices = 0, trialingOrTrialed = 0;

  for (const c of customers) {
    // --- subscriptions: appeared / churned (status=all → full lifecycle) ---
    const subs = await listAll('/subscriptions', { customer: c.id, status: 'all' });
    for (const s of subs) {
      signals.push({ at: s.start_date, kind: 'subscriber_appeared', who: c.name });
      if (s.trial_start) trialingOrTrialed++;
      if (s.ended_at) {
        signals.push({ at: s.ended_at, kind: 'subscriber_churned', who: c.name });
        churnedFound++;
      } else if (s.cancel_at_period_end) {
        signals.push({ at: s.canceled_at, kind: '(risk) cancel_scheduled', who: c.name });
      }
      if (['past_due', 'unpaid'].includes(s.status)) {
        signals.push({ at: null, kind: `(risk) ${s.status}`, who: c.name });
      }
    }

    // --- invoices: payments + plan changes ---
    const invoices = await listAll('/invoices', { customer: c.id });
    for (const inv of invoices) {
      if (inv.status === 'paid' && inv.amount_paid > 0) {
        signals.push({
          at: inv.status_transitions.paid_at, kind: 'payment_received',
          who: c.name, amount: euro(inv.amount_paid),
        });
      }
      if (inv.attempted && inv.status !== 'paid' && inv.amount_due > 0) {
        signals.push({ at: inv.created, kind: 'payment_failed', who: c.name, amount: euro(inv.amount_due) });
        failedFound++;
      }
      if (inv.billing_reason === 'subscription_update') {
        signals.push({ at: inv.created, kind: 'subscriber_grew/shrank (update invoice)', who: c.name });
        updateInvoices++;
      }
    }
  }

  signals.sort((a, b) => (a.at || Infinity) - (b.at || Infinity));
  console.log('Reconstructed timeline:');
  for (const s of signals) {
    console.log(`  ${d(s.at)}  ${s.kind.padEnd(38)} ${s.who}${s.amount ? '  ' + s.amount : ''}`);
  }

  console.log('\nCoverage checks (scenario says these must be reconstructable):');
  const checks = [
    ['churned subscription found via status=all + ended_at', churnedFound >= 2],
    ['failed payment visible on invoices (attempted, unpaid)', failedFound >= 1],
    ['plan change visible via billing_reason=subscription_update', updateInvoices >= 1],
    ['trial visible via trial_start', trialingOrTrialed >= 1],
    ['payments carry exact historical paid_at timestamps',
      signals.some((s) => s.kind === 'payment_received' && s.at)],
  ];
  let ok = true;
  for (const [label, pass] of checks) {
    console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${label}`);
    if (!pass) ok = false;
  }
  console.log(ok
    ? '\nAll checks passed — the research-03 reconstruction rules hold on real API responses.'
    : '\nSome checks failed — compare against seed-manifest.json and research 03.');
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error('\nVALIDATION FAILED:', e.message); process.exit(1); });
