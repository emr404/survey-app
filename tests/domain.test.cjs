const test = require('node:test');
const assert = require('node:assert/strict');
const { defaultPreferences, issuesFor, refinePreferences, describeChanges } = require('../src/domain/preferences.ts');
const { freshState, restoreState, withPreferences } = require('../src/domain/state.ts');
const { RequestGate } = require('../src/domain/requests.ts');
const { parseRecommendations } = require('../src/domain/responses.ts');
const p = { ...defaultPreferences(), departure: 'London', days: 2 };
async function fixture() {
  const { recommendationFixture } = await import('./fixtures/recommendations.mjs');
  return { result: { ...recommendationFixture(p), mode: 'groq' } };
}

test('preferences require departure, interests, valid amounts, dates and positive whole group sizes', () => {
  assert.equal(Object.keys(issuesFor(p)).length, 0);
  assert.equal(Object.keys(issuesFor({ ...p, days: 45 })).length, 0);
  for (const travellers of [11, 25, 100]) assert.deepEqual(issuesFor({ ...p, travellers }), {});
  for (const patch of [ { departure: '' }, { dailyBudget: 0 }, { dailyBudget: NaN }, { interests: [] },
    { travellers: 0 }, { travellers: 1.5 }, { days: 0 }, { days: 1.5 }, { currency: 'XYZ' }, { timing: 'dates', startDate: '2028-02-30' }, { constraints: 'x'.repeat(1501) } ]) {
    assert.ok(Object.keys(issuesFor({ ...p, ...patch })).length, JSON.stringify(patch));
  }
  assert.equal(Object.keys(issuesFor({ ...p, timing: 'dates', startDate: '2028-02-29' })).length, 0);
});

test('refinements preserve the rest of the brief and describe exactly what changed', () => {
  const input = { ...p, constraints: 'No long walks', startDate: '2028-05-04', timing: 'dates' };
  const lower = refinePreferences(input, 'budget');
  assert.equal(lower.dailyBudget, 96);
  assert.equal(input.dailyBudget, 120);
  assert.deepEqual(lower.interests, input.interests);
  assert.equal(lower.constraints, input.constraints);
  assert.equal(lower.startDate, input.startDate);
  assert.deepEqual(describeChanges(input, lower), ['Daily budget per person: 120 → 96']);
  assert.equal(refinePreferences(input, 'quieter').crowds, 'Quieter places');
  assert.equal(refinePreferences({ ...input, maxJourneyHours: 1 }, 'shorter').maxJourneyHours, 1);
});

test('browser and model responses reject invalid ranges, ids, unknown provenance and nested fields', async () => {
  const { result } = await fixture();
  assert.deepEqual(parseRecommendations(result), result);
  const bad = structuredClone(result); bad.destinations[0].dailyCost = { low: 200, high: 100 };
  assert.throws(() => parseRecommendations(bad));
  const ids = structuredClone(result); ids.destinations[1].id = ids.destinations[0].id;
  assert.throws(() => parseRecommendations(ids));
  const extra = structuredClone(result); extra.destinations[0].verifiedAt = 'invented';
  assert.throws(() => parseRecommendations(extra));
  assert.throws(() => parseRecommendations({ ...result, mode: 'verified' }));
});

test('empty and partial shortlists are valid rather than padded with weaker matches', async () => {
  const { result } = await fixture();
  assert.equal(parseRecommendations({ ...result, destinations: [] }).destinations.length, 0);
  assert.equal(parseRecommendations({ ...result, destinations: [result.destinations[0]] }).destinations.length, 1);
});

test('saved preferences and Groq results restore; corrupt saves do not', async () => {
  const { result } = await fixture();
  const saved = { version: 2, preferences: p, batch: { preferences: p, result }, history: [] };
  const restored = restoreState(JSON.stringify(saved));
  assert.deepEqual(restored.preferences, p); assert.deepEqual(restored.batch.result, result);
  assert.deepEqual(restoreState('{broken'), freshState());
  saved.batch.result.destinations[0].dailyCost = { low: 200, high: 100 };
  assert.equal(restoreState(JSON.stringify(saved)).batch, null);
});

test('old survey saves retain useful preferences without trusting old question lists', () => {
  const saved = restoreState(null, JSON.stringify({ answers: { 1: 'Beach', 3: 'Europe', 6: 'One week', 9: 'Solo' }, tripNotes: 'No driving' }));
  assert.deepEqual(saved.preferences.interests, ['Coast']);
  assert.equal(saved.preferences.days, 7); assert.equal(saved.preferences.travellers, 1);
  assert.equal(saved.preferences.constraints, 'No driving');
});

test('unfinished numeric edits survive refresh without erasing the rest of the brief', () => {
  for (const changes of [{ days: 0 }, { days: 2.5 }, { dailyBudget: -1 }, { travellers: 0 }]) {
    const preferences = { ...p, constraints: 'No driving', ...changes };
    const restored = restoreState(JSON.stringify({ version: 2, preferences }));
    assert.deepEqual(restored.preferences, preferences);
    assert.ok(Object.keys(issuesFor(restored.preferences)).length, 'Invalid drafts must still be blocked before generation');
  }
});

test('relaxed draft restoration does not allow invalid preferences on saved recommendations', async () => {
  const { result } = await fixture();
  const preferences = { ...p, days: 0 };
  const restored = restoreState(JSON.stringify({ version: 2, preferences, batch: { preferences, result } }));
  assert.deepEqual(restored.preferences, preferences);
  assert.equal(restored.batch, null);
});

test('cancelled and superseded responses cannot overwrite newer work', () => {
  const gate = new RequestGate(); const first = gate.begin(); const second = gate.begin();
  assert.equal(first.signal.aborted, true); assert.equal(gate.current(first.id), false);
  assert.equal(gate.current(second.id), true);
  gate.cancel(); assert.equal(second.signal.aborted, true); assert.equal(gate.current(second.id), false);
});

test('Groq recommendations survive validation and saved-state restoration', async () => {
  const { result } = await fixture();
  const generated = { ...result, mode: 'groq' };
  assert.equal(parseRecommendations(generated).mode, 'groq');
  const restored = restoreState(JSON.stringify({ version: 2, preferences: p, batch: { preferences: p, result: generated }, compareIds: ['old-selection'] }));
  assert.deepEqual(restored.batch.result, generated);
  assert.equal('compareIds' in restored, false);
});

test('passport preferences validate known, unique nationalities and survive refinement', () => {
  const selected = { ...p, passportCountries: ['GB', 'IN'], residenceCountry: 'FR', passportType: 'ordinary' };
  assert.deepEqual(issuesFor(selected), {});
  assert.ok(issuesFor({ ...selected, passportCountries: ['GB', 'GB'] }).passportCountries);
  assert.ok(issuesFor({ ...selected, passportCountries: ['ZZ'] }).passportCountries);
  assert.ok(issuesFor({ ...selected, residenceCountry: 'ZZ' }).residenceCountry);
  assert.ok(issuesFor({ ...selected, passportType: 'invalid' }).passportType);
  assert.deepEqual(refinePreferences(selected, 'budget').passportCountries, ['GB', 'IN']);
  assert.equal(refinePreferences(selected, 'quieter').residenceCountry, 'FR');
  assert.deepEqual(describeChanges(p, selected).slice(0, 2), ['Passport nationalities: None → United Kingdom, India', 'Country of residence: Not specified → France']);
});

test('visa advice must correspond to every selected passport, with no invented confirmation fields', async () => {
  const { result } = await fixture();
  const preferences = { ...p, passportCountries: ['IN'] };
  const updated = { ...result, destinations: result.destinations.map(d => ({ ...d, visaAdvice: [{ passportCountry: 'IN', status: 'check_required', note: 'Check entry rules for this passport and your stay.' }] })) };
  assert.equal(parseRecommendations(updated, preferences).destinations[0].visaAdvice[0].passportCountry, 'IN');
  assert.throws(() => parseRecommendations(updated, { ...preferences, passportCountries: ['GB'] }), /validation/);
  const bad = JSON.parse(JSON.stringify(updated));
  bad.destinations[0].visaAdvice[0].verifiedAt = 'invented'; assert.throws(() => parseRecommendations(bad, preferences), /validation/);
  delete bad.destinations[0].visaAdvice[0].verifiedAt;
  bad.destinations[0].visaAdvice[0].status = 'visa_exemption_may_apply';
  assert.throws(() => parseRecommendations(bad, { ...preferences, passportType: 'other' }), /validation/);
  bad.destinations[0].visaAdvice[0].status = 'visa_free'; assert.throws(() => parseRecommendations(bad, preferences), /validation/);
});

test('older Groq saves retain preferences and recommendations when passport fields are absent', async () => {
  const { result } = await fixture();
  const oldPreferences = { ...p }; delete oldPreferences.passportCountries; delete oldPreferences.residenceCountry; delete oldPreferences.passportType;
  const oldResult = JSON.parse(JSON.stringify(result)); oldResult.destinations.forEach(d => { delete d.visaAdvice; });
  const restored = restoreState(JSON.stringify({ version: 2, preferences: oldPreferences, batch: { preferences: oldPreferences, result: oldResult } }));
  assert.equal(restored.preferences.departure, p.departure); assert.deepEqual(restored.preferences.passportCountries, []);
  assert.equal(restored.batch.result.destinations.length, result.destinations.length);
  assert.deepEqual(restored.batch.result.destinations[0].visaAdvice, []);
  withPreferences(restored, { ...restored.preferences, passportCountries: ['IN'] });
  assert.deepEqual(restored.preferences.passportCountries, ['IN']);
});

test('invalid amounts return field-specific errors rather than a generic form error', () => {
  const errors = issuesFor({ ...p, days: 0, travellers: 0, dailyBudget: 10001, departure: '' });
  assert.match(errors.days, /positive whole number/);
  assert.match(errors.travellers, /positive whole number/);
  assert.match(errors.dailyBudget, /10,000/);
  assert.match(errors.departure, /departure city/);
  assert.equal(errors.form, undefined);
});
