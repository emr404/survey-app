import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createTravelServer } from './app.mjs';
import { recommendationFixture } from '../tests/fixtures/recommendations.mjs';
const preferences = { passportCountries: [], residenceCountry: '', passportType: 'ordinary', departure: 'London', currency: 'GBP', dailyBudget: 120, travellers: 2, days: 5, timing: 'flexible', startDate: '', season: 'Any season', region: 'Europe', interests: ['Culture', 'Food'], pace: 'Balanced', transport: 'Any transport', maxJourneyHours: null, crowds: 'No preference', constraints: '' };
const reply = result => new Response(JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(result) } }] }));
const fetchFixture = async (_url, options) => reply(recommendationFixture(JSON.parse(JSON.parse(options.body).messages[1].content).preferences));
async function withServer(options, run) {
  const server = createTravelServer({ groqKey: 'test-only', fetchImpl: fetchFixture, ...options });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (body = { preferences }, extra = {}, path = '/api/recommendations') => fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), ...extra });
  try { await run(post, base); }
  finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
}
test('Groq is the only provider and recommendations pass through the real HTTP API', async () => {
  await withServer({}, async (post, base) => {
    assert.deepEqual(await (await fetch(base + '/api/status')).json(), { mode: 'groq', available: true });
    const response = await post(); assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store');
    const result = await response.json(); assert.equal(result.mode, 'groq'); assert.equal(result.destinations.length, 3); assert.equal(JSON.stringify(result).includes('test-only'), false);
    assert.equal((await fetch(base + '/api/itinerary')).status, 404);
  });
});
test('missing credentials report unavailable and never fall back to another provider', async () => {
  let calls = 0;
  await withServer({ groqKey: '', fetchImpl: async () => { calls++; throw new Error(); } }, async (post, base) => {
    const status = await (await fetch(base + '/api/status')).json(); assert.equal(status.available, false);
    const response = await post(); assert.equal(response.status, 503); assert.equal((await response.json()).code, 'groq_not_configured'); assert.equal(calls, 0);
  });
});
test('invalid preferences are rejected before contacting Groq', async () => {
  let calls = 0;
  await withServer({ fetchImpl: async () => { calls++; throw new Error(); } }, async post => {
    for (const change of [{ departure: '' }, { travellers: 0 }, { days: 1.5 }, { passportCountries: ['ZZ'] }]) assert.equal((await post({ preferences: { ...preferences, ...change } })).status, 400);
    assert.equal(calls, 0);
  });
});
test('larger groups and longer holidays remain valid', async () => {
  await withServer({}, async post => {
    const response = await post({ preferences: { ...preferences, travellers: 25, days: 45 } });
    assert.equal(response.status, 200); assert.equal((await response.json()).destinations.length, 3);
  });
});
test('malformed bodies, wrong content types, methods and oversized requests are rejected', async () => {
  await withServer({}, async (post, base) => {
    assert.equal((await post({}, { body: '{' })).status, 400);
    assert.equal((await post({}, { headers: { 'Content-Type': 'text/plain' } })).status, 415);
    assert.equal((await post({ preferences: { ...preferences, constraints: 'x'.repeat(33000) } })).status, 413);
    const response = await fetch(base + '/api/recommendations'); assert.equal(response.status, 405); assert.equal(response.headers.get('allow'), 'POST');
  });
});
test('invalid model output and provider limits return sanitised, retryable errors', async () => {
  await withServer({ fetchImpl: async () => reply({ summary: 'incomplete' }) }, async post => {
    const response = await post(); assert.equal(response.status, 502); assert.match((await response.json()).error, /failed validation/);
  });
  await withServer({ fetchImpl: async () => new Response(JSON.stringify({ error: { message: 'private provider details' } }), { status: 429 }) }, async post => {
    const response = await post(); const body = await response.json(); assert.equal(response.status, 503); assert.equal(body.code, 'groq_rate_limit'); assert.equal(body.error.includes('private provider details'), false);
  });
});
test('partial and empty responses are valid without padding the shortlist', async () => {
  await withServer({}, async post => {
    for (const [dailyBudget, count] of [[66, 1], [20, 0]]) {
      const response = await post({ preferences: { ...preferences, dailyBudget } }); assert.equal(response.status, 200); assert.equal((await response.json()).destinations.length, count);
    }
  });
});
test('client cancellation reaches the in-flight Groq request', async () => {
  let started; const entered = new Promise(resolve => { started = resolve; });
  let cancelled; const aborted = new Promise(resolve => { cancelled = resolve; });
  await withServer({ fetchImpl: async (_url, options) => new Promise((_resolve, reject) => {
    started(); options.signal.addEventListener('abort', () => { cancelled(); reject(new DOMException('Cancelled', 'AbortError')); }, { once: true });
  }) }, async post => {
    const controller = new AbortController(); const pending = post(undefined, { signal: controller.signal });
    await entered; controller.abort(); await assert.rejects(pending, { name: 'AbortError' }); await aborted;
  });
});
test('repeated requests are rate limited', async () => {
  await withServer({}, async post => {
    for (let index = 0; index < 30; index++) assert.equal((await post()).status, 200);
    const response = await post(); assert.equal(response.status, 429); assert.equal(response.headers.get('retry-after'), '60');
  });
});

test('the configured frontend origin receives CORS headers and unapproved origins never reach Groq', async () => {
  let calls = 0;
  const origin = 'https://travel-companion-emr.netlify.app';
  await withServer({ allowedOrigin: origin, fetchImpl: async (...args) => { calls++; return fetchFixture(...args); } }, async (post, base) => {
    const response = await post(undefined, { headers: { 'Content-Type': 'application/json', Origin: origin } });
    assert.equal(response.status, 200); assert.equal(response.headers.get('access-control-allow-origin'), origin); assert.equal(calls, 1);
    for (const unapproved of ['https://other.example', 'https://travel-companion-emr.netlify.app.evil.example']) {
      const denied = await post(undefined, { headers: { 'Content-Type': 'application/json', Origin: unapproved } });
      assert.equal(denied.status, 403); assert.equal(denied.headers.get('access-control-allow-origin'), null);
    }
    assert.equal(calls, 1);
    assert.equal((await fetch(base + '/api/status')).status, 200);
  });
});
test('cross-origin preflight permits JSON requests only from the configured frontend', async () => {
  const origin = 'https://travel-companion-emr.netlify.app';
  await withServer({ allowedOrigin: origin }, async (_post, base) => {
    const preflight = (extra = {}) => fetch(base + '/api/recommendations', { method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type', ...extra } });
    const response = await preflight(); assert.equal(response.status, 204);
    assert.equal(response.headers.get('access-control-allow-origin'), origin);
    assert.equal(response.headers.get('access-control-allow-headers'), 'Content-Type');
    assert.equal((await preflight({ Origin: 'https://other.example' })).status, 403);
    assert.equal((await preflight({ 'Access-Control-Request-Method': 'DELETE' })).status, 405);
    assert.equal((await preflight({ 'Access-Control-Request-Headers': 'authorization' })).status, 400);
  });
});
