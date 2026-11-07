import test from 'node:test';
import assert from 'node:assert/strict';
import { groqOutput } from './groq.mjs';
import { generateRecommendations } from './recommendations.mjs';
import { recommendationFixture } from '../tests/fixtures/recommendations.mjs';
const preferences = { passportCountries: [], residenceCountry: '', passportType: 'ordinary', departure: 'London', currency: 'GBP', dailyBudget: 120, travellers: 2, days: 5, timing: 'flexible', startDate: '', season: 'Summer', region: 'Europe', interests: ['Food', 'Culture'], pace: 'Balanced', transport: 'Any transport', maxJourneyHours: null, crowds: 'No preference', constraints: '' };
const reply = value => new Response(JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(value) } }] }));
test('Groq uses server credentials, strict structured output and validates before display', async () => {
  const result = await generateRecommendations(preferences, { groqKey: 'server-secret', fetchImpl: async (url, options) => {
    assert.equal(url, 'https://api.groq.com/openai/v1/chat/completions');
    assert.equal(options.headers.Authorization, 'Bearer server-secret');
    const body = JSON.parse(options.body);
    assert.equal(body.model, 'openai/gpt-oss-20b'); assert.equal(body.response_format.json_schema.strict, true);
    assert.deepEqual(JSON.parse(body.messages[1].content), { preferences });
    return reply(recommendationFixture(preferences));
  } });
  assert.equal(result.mode, 'groq'); assert.equal(JSON.stringify(result).includes('server-secret'), false);
  await assert.rejects(generateRecommendations(preferences, { groqKey: 'x', fetchImpl: async () => reply({ summary: 'incomplete' }) }), /failed validation/);
});
test('missing keys, free limits, authentication and invalid generations are actionable and sanitised', async () => {
  await assert.rejects(groqOutput({}, '', {}), { code: 'groq_not_configured' });
  for (const [status, code] of [[429, 'groq_rate_limit'], [401, 'groq_authentication'], [400, 'groq_configuration'], [503, 'groq_unavailable']]) {
    await assert.rejects(groqOutput({}, '', { groqKey: 'secret', fetchImpl: async () => new Response(JSON.stringify({ error: { message: 'secret' } }), { status }) }), error => error.code === code && !error.message.includes('secret'));
  }
  await assert.rejects(groqOutput({}, '', { groqKey: 'x', fetchImpl: async () => new Response(JSON.stringify({ error: { code: 'json_validate_failed' } }), { status: 400 }) }), { code: 'groq_invalid_response' });
});
test('timeouts, cancellation and incomplete responses preserve retryable failures', async () => {
  const controller = new AbortController(); controller.abort();
  await assert.rejects(groqOutput({}, '', { groqKey: 'x', fetchImpl: async () => { throw new Error('aborted'); } }, controller.signal), { code: 'request_cancelled' });
  await assert.rejects(groqOutput({}, '', { groqKey: 'x', fetchImpl: async () => { throw new DOMException('timeout', 'TimeoutError'); } }), { code: 'groq_timeout' });
  await assert.rejects(groqOutput({}, '', { groqKey: 'x', fetchImpl: async () => new Response(JSON.stringify({ choices: [{ finish_reason: 'length', message: { content: '{}' } }] })) }), { code: 'groq_invalid_response' });
});

test('passport and residence details reach Groq; every selected nationality needs its own advice', async () => {
  const p = { ...preferences, passportCountries: ['GB', 'IN'], residenceCountry: 'GB' };
  const result = await generateRecommendations(p, { groqKey: 'test-only', fetchImpl: async (_url, options) => {
    const body = JSON.parse(options.body);
    assert.deepEqual(JSON.parse(body.messages[1].content).preferences.passportCountries, ['GB', 'IN']);
    assert.equal(JSON.parse(body.messages[1].content).preferences.residenceCountry, 'GB');
    assert.match(body.messages[0].content, /Do not infer nationality from departure/);
    assert.match(body.messages[0].content, /not a live rules lookup/);
    return reply(recommendationFixture(p));
  } });
  assert.equal(result.destinations[0].visaAdvice.length, 2);
  const missingPassport = recommendationFixture(p); missingPassport.destinations[0].visaAdvice.pop();
  await assert.rejects(generateRecommendations(p, { groqKey: 'test-only', fetchImpl: async () => reply(missingPassport) }), /failed validation/);
  const otherDoc = { ...p, passportType: 'other' }; const optimistic = recommendationFixture(otherDoc); optimistic.destinations[0].visaAdvice[0].status = 'visa_exemption_may_apply';
  await assert.rejects(generateRecommendations(otherDoc, { groqKey: 'test-only', fetchImpl: async () => reply(optimistic) }), /failed validation/);
});

test('five valid match reasons are capped at four without losing recommendations', async () => {
  const recommendations = recommendationFixture(preferences);
  recommendations.destinations[0].matchReasons = ['First preference match', 'Second preference match', 'Third preference match', 'Fourth preference match', 'Fifth preference match'];
  const result = await generateRecommendations(preferences, { groqKey: 'test', fetchImpl: async (_url, options) => {
    const schema = JSON.parse(options.body).response_format.json_schema.schema;
    assert.equal(schema.properties.destinations.items.properties.matchReasons.maxItems, undefined);
    assert.equal(schema.properties.destinations.maxItems, 3);
    return reply(recommendations);
  } });
  assert.equal(result.destinations.length, 3); assert.deepEqual(result.destinations[0].matchReasons, recommendations.destinations[0].matchReasons.slice(0, 4));
});
test('a provider-rejected extra reason is recovered only after full validation', async () => {
  const recommendations = recommendationFixture(preferences);
  recommendations.destinations[0].matchReasons.push('Another valid reason', 'A fifth valid reason');
  const fetchImpl = async () => new Response(JSON.stringify({ error: { code: 'json_validate_failed', message: 'secret-provider-details', failed_generation: JSON.stringify(recommendations) } }), { status: 400 });
  const result = await generateRecommendations(preferences, { groqKey: 'test', fetchImpl });
  assert.equal(result.destinations[0].matchReasons.length, 4);
  recommendations.destinations[0].dailyCost = { low: 200, high: 100 };
  await assert.rejects(generateRecommendations(preferences, { groqKey: 'test', fetchImpl }), error => error.code === 'groq_invalid_response' && !error.message.includes('secret-provider-details'));
});
test('invalid extra reason content is rejected rather than hidden by trimming', async () => {
  const recommendations = recommendationFixture(preferences);
  recommendations.destinations[0].matchReasons.push('A fourth reason', 123);
  await assert.rejects(generateRecommendations(preferences, { groqKey: 'test', fetchImpl: async () => reply(recommendations) }), /failed validation/);
});
