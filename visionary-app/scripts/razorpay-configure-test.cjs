// Uses ignored backend configuration. Never logs API credentials or raw responses.
const fs = require('node:fs'), path = require('node:path'), { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..'), backend = path.join(root, 'backend/upstream/backend');
const req = createRequire(path.join(backend, 'package.json'));
const envPath = path.join(backend, '.env'), env = req('dotenv').parse(fs.readFileSync(envPath));
if (env.BILLING_MODE !== 'test' || !/^rzp_test_[A-Za-z0-9]+$/.test(env.RAZORPAY_KEY_ID || '') || !env.RAZORPAY_KEY_SECRET) throw Error('Configure test credentials in the ignored backend environment first.');
const { BILLING_PLANS, CATALOG_VERSION } = req('./dist/src/billing/catalog.js');
async function api(method, resource, body) {
  const res = await fetch(`https://api.razorpay.com/v1/${resource}`, { method, headers: { Authorization: 'Basic ' + Buffer.from(env.RAZORPAY_KEY_ID + ':' + env.RAZORPAY_KEY_SECRET).toString('base64'), 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw Error(`Razorpay test configuration returned HTTP ${res.status}; credentials and response withheld.`);
  return res.json();
}
(async () => {
  let configured = 0, created = 0, text = fs.readFileSync(envPath, 'utf8');
  // A fixed catalog tag makes reruns recover plans created before an interrupted save.
  const plans = [];
  for (let skip = 0; ; skip += 100) {
    const page = await api('GET', `plans?count=100&skip=${skip}`);
    plans.push(...page.items);
    if (page.items.length < 100) break;
  }
  for (const plan of BILLING_PLANS.filter(row => row.id !== 'start')) for (const interval of ['monthly', 'annual']) {
    const name = `Visionary ${plan.name} ${interval} ${CATALOG_VERSION}`;
    let found = plans.find(row => row.item?.name === name && row.item.amount === plan[interval] && row.item.currency === 'INR' && row.period === (interval === 'annual' ? 'yearly' : 'monthly') && row.interval === 1);
    if (!found) { found = await api('POST', 'plans', { period: interval === 'annual' ? 'yearly' : 'monthly', interval: 1, item: { name, amount: plan[interval], currency: 'INR', description: 'Visionary test subscription. No real payment or tax invoice.' } }); ++created; }
    const key = `RAZORPAY_PLAN_${plan.id.toUpperCase()}_${interval.toUpperCase()}`;
    text = text.replace(new RegExp(`^${key}=.*\r?\n?`, 'gm'), '');
    text = text.trimEnd() + `\n${key}=${found.id}\n`;
    fs.writeFileSync(envPath, text); ++configured;
  }
  console.log(JSON.stringify({ mode: 'test', configuredPlans: configured, createdPlans: created, credentialsExposed: false }));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
