import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createTravelServer } from './app.mjs';
import { validateTrip, generateRecommendations, generateItinerary } from './recommendations.mjs';
import { demoRecommendations, demoItinerary } from './demo.mjs';
const preferences = { departure: 'London', currency: 'GBP', dailyBudget: 120, travellers: 2, days: 2,
  timing: 'flexible', startDate: '', season: 'Any season', region: 'Europe', interests: ['Culture', 'Food'],
  pace: 'Balanced', transport: 'Any transport', maxJourneyHours: null, crowds: 'No preference', constraints: '' };
const payload = { preferences };
const recommendations = demoRecommendations(preferences);
const destination = recommendations.destinations[0];
const output = result => ({ status: 'completed', output: [{ content: [{ type: 'output_text', text: JSON.stringify(result) }] }] });
const mockResponse = value => new Response(JSON.stringify(value), { status: 200 });
async function withServer(options, run) {
  const server = createTravelServer(options); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  try { await run((body = payload, extra = {}, path = '/api/recommendations') => fetch(base + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), ...extra,
  }), base); }
  finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
}

test('default demo completes recommendations and full-length itinerary without any model call', async () => {
  let calls = 0;
  await withServer({ fetchImpl: async () => { calls++; throw new Error('No paid calls'); } }, async (post, base) => {
    const status = await (await fetch(base + '/api/status')).json(); assert.deepEqual(status, { mode: 'demo', available: true });
    const response = await post(); assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store');
    const result = await response.json(); assert.equal(result.mode, 'demo'); assert.equal(result.destinations.length, 3);
    const itinerary = await post({ preferences, destination }, {}, '/api/itinerary'); assert.equal(itinerary.status, 200);
    assert.equal((await itinerary.json()).days.length, preferences.days); assert.equal(calls, 0);
  });
});

test('live provider receives structured schema, correct preferences, no storage and a server-only key', async () => {
  await withServer({ mode: 'live', apiKey: 'test-secret', fetchImpl: async (url, options) => {
    assert.equal(url, 'https://api.openai.com/v1/responses'); assert.equal(options.headers.Authorization, 'Bearer test-secret');
    const request = JSON.parse(options.body); assert.equal(request.store, false); assert.equal(request.text.format.strict, true);
    assert.deepEqual(JSON.parse(request.input), payload); assert.ok(options.signal);
    return mockResponse(output(recommendations));
  } }, async post => {
    const response = await post(); assert.equal(response.status, 200); assert.deepEqual(await response.json(), { ...recommendations, mode: 'live' });
  });
});

test('live mode without credentials reports unavailable rather than silently switching modes', async () => {
  await withServer({ mode: 'live' }, async (post, base) => {
    assert.equal((await (await fetch(base + '/api/status')).json()).available, false);
    const response = await post(); assert.equal(response.status, 503); assert.match((await response.json()).error, /not configured/);
  });
});

test('invalid preferences never reach the provider', async () => {
  let calls = 0;
  await withServer({ mode: 'live', apiKey: 'test', fetchImpl: async () => { calls++; } }, async post => {
    for (const body of [null, {}, { preferences: {} }, { preferences: { ...preferences, currency: 'FAKE' } }, { preferences: { ...preferences, constraints: 'x'.repeat(1501) } }]) {
      assert.equal((await post(body)).status, 400);
    }
    assert.equal(calls, 0);
  });
});

test('malformed JSON, wrong content type and oversized requests are rejected', async () => {
  await withServer({}, async post => {
    assert.equal((await post(null, { body: '{broken' })).status, 400);
    assert.equal((await post(null, { headers: { 'Content-Type': 'text/plain' } })).status, 415);
    assert.equal((await post({ preferences, extra: 'x'.repeat(33000) })).status, 413);
  });
});

test('provider failures are sanitised and timeouts are retryable', async () => {
  await withServer({ mode: 'live', apiKey: 'test-secret', fetchImpl: async () => new Response('private test-secret', { status: 401 }) }, async post => {
    const response = await post(); assert.equal(response.status, 502); assert.doesNotMatch(await response.text(), /test-secret|private/);
  });
  await assert.rejects(generateRecommendations(preferences, {
    mode: 'live', apiKey: 'test', fetchImpl: async () => { throw new DOMException('Timeout', 'TimeoutError'); },
  }), error => error.status === 504);
});

test('refused, incomplete and structurally invalid model output is rejected', async () => {
  const invalid = structuredClone(recommendations); invalid.destinations[0].dailyCost = { low: 100, high: 50 };
  for (const value of [output(invalid), { ...output(recommendations), status: 'incomplete' },
    { status: 'completed', output: [{ content: [{ type: 'refusal', refusal: 'No' }] }] }]) {
    await assert.rejects(generateRecommendations(preferences, { mode: 'live', apiKey: 'test', fetchImpl: async () => mockResponse(value) }), error => error.status === 502);
  }
});

test('empty and partial matches are returned honestly in the demo', () => {
  assert.equal(demoRecommendations({ ...preferences, dailyBudget: 20 }).destinations.length, 0);
  assert.equal(demoRecommendations({ ...preferences, dailyBudget: 66 }).destinations.length, 1);
  assert.equal(demoRecommendations({ ...preferences, transport: 'Train', region: 'Asia' }).destinations.length, 0);
  assert.equal(demoRecommendations({ ...preferences, departure: 'Unknown town', maxJourneyHours: 4 }).destinations.length, 0);
});

test('itinerary generation validates the destination and exact day count', async () => {
  await assert.rejects(generateItinerary(preferences, {}, {}), error => error.status === 400);
  const invalid = demoItinerary(preferences, destination); invalid.days.pop();
  await assert.rejects(generateItinerary(preferences, destination, {
    mode: 'live', apiKey: 'test', fetchImpl: async () => mockResponse(output(invalid)),
  }), error => error.status === 502);
  assert.ok(validateTrip(payload));
});

test('aborting the client request propagates cancellation to the model request', async () => {
  const controller = new AbortController(); let received;
  const pending = generateRecommendations(preferences, { mode: 'live', apiKey: 'test', fetchImpl: async (_url, options) => {
    received = options.signal;
    return new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true }));
  } }, controller.signal);
  controller.abort();
  await assert.rejects(pending, error => error.status === 499); assert.equal(received.aborted, true);
});

test('repeated requests are rate limited', async () => {
  await withServer({ mode: 'live' }, async post => {
    for (let i = 0; i < 30; i++) assert.equal((await post()).status, 503);
    const response = await post(); assert.equal(response.status, 429); assert.equal(response.headers.get('retry-after'), '60');
  });
});

test('long holidays generate and validate all days in demo mode', async () => {
  const p = { ...preferences, days: 45 };
  assert.ok(validateTrip({ preferences: p }));
  const result = await generateItinerary(p, destination, { mode: 'demo' });
  assert.equal(result.days.length, 45);
  assert.equal(result.days[44].day, 45);
});

test('long live itineraries use validated sections, preserve context and make activity ids unique', async () => {
  let calls = 0;
  const result = await generateItinerary({ ...preferences, days: 21 }, destination, {
    mode: 'live', apiKey: 'test', fetchImpl: async (_url, options) => {
      const input = JSON.parse(JSON.parse(options.body).input);
      assert.equal(input.tripLength, 21);
      assert.equal(input.preferences.days, 7);
      assert.equal(input.startDay, calls * 7 + 1);
      if (calls > 0) assert.ok(input.previousActivities.length);
      calls++;
      return mockResponse(output(demoItinerary(input.preferences, destination)));
    },
  });
  assert.equal(calls, 3);
  assert.equal(result.days.length, 21);
  assert.equal(result.days[20].day, 21);
  const ids = result.days.flatMap(day => day.activities.map(activity => activity.id));
  assert.equal(new Set(ids).size, ids.length);
});
