const test = require('node:test');
const assert = require('node:assert/strict');
const { defaultPreferences, issuesFor, refinePreferences, describeChanges, samePreferences } = require('../src/domain/preferences.ts');
const { freshState, restoreState, withPreferences } = require('../src/domain/state.ts');
const { RequestGate } = require('../src/domain/requests.ts');
const { parseRecommendations, parseItinerary } = require('../src/domain/responses.ts');
const { createDraft, replaceActivity, removeActivity, moveActivity, approveDraft, isApproved, approvalIssues, estimateTotal } = require('../src/domain/itinerary.ts');
const p = { ...defaultPreferences(), departure: 'London', days: 2 };
async function fixture() {
  const { demoRecommendations, demoItinerary } = await import('../server/demo.mjs');
  const result = { ...demoRecommendations(p), mode: 'demo' };
  const destination = result.destinations[0];
  const itinerary = { ...demoItinerary(p, destination), mode: 'demo' };
  return { result, destination, itinerary, draft: createDraft(destination, p, itinerary) };
}

test('preferences require departure, interests, valid amounts, dates and bounded group size', () => {
  assert.equal(Object.keys(issuesFor(p)).length, 0);
  assert.equal(Object.keys(issuesFor({ ...p, days: 45 })).length, 0);
  for (const patch of [ { departure: '' }, { dailyBudget: 0 }, { dailyBudget: NaN }, { interests: [] },
    { travellers: 0 }, { days: 0 }, { days: 1.5 }, { currency: 'XYZ' }, { timing: 'dates', startDate: '2028-02-30' }, { constraints: 'x'.repeat(1501) } ]) {
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
  const { result, itinerary } = await fixture();
  assert.deepEqual(parseRecommendations(result), result);
  assert.deepEqual(parseItinerary(itinerary, 2), itinerary);
  const bad = structuredClone(result); bad.destinations[0].dailyCost = { low: 200, high: 100 };
  assert.throws(() => parseRecommendations(bad));
  const ids = structuredClone(result); ids.destinations[1].id = ids.destinations[0].id;
  assert.throws(() => parseRecommendations(ids));
  const extra = structuredClone(result); extra.destinations[0].verifiedAt = 'invented';
  assert.throws(() => parseRecommendations(extra));
  assert.throws(() => parseRecommendations({ ...result, mode: 'verified' }));
  assert.throws(() => parseItinerary(itinerary, 3));
  const nested = structuredClone(itinerary); nested.days[0].activities[0].durationMinutes = -10;
  assert.throws(() => parseItinerary(nested, 2));
});

test('empty and partial shortlists are valid rather than padded with weaker matches', async () => {
  const { result } = await fixture();
  assert.equal(parseRecommendations({ ...result, destinations: [] }).destinations.length, 0);
  assert.equal(parseRecommendations({ ...result, destinations: [result.destinations[0]] }).destinations.length, 1);
});

test('approval requires explicit confirmation and is tied to the exact revision', async () => {
  const { draft } = await fixture();
  const at = '2026-11-07T15:00:00Z';
  assert.equal(isApproved(draft, p), false);
  assert.throws(() => approveDraft(draft, p, false, at));
  const approved = approveDraft(draft, p, true, at);
  assert.equal(isApproved(approved, p), true);
  const moved = moveActivity(approved, 0, approved.content.days[0].activities[0].id, 1);
  assert.equal(moved.revision, 2); assert.equal(moved.approvedRevision, null);
  assert.equal(isApproved(moved, p), false);
  assert.equal(isApproved(approved, { ...p, days: 3 }), false);
  assert.equal(isApproved(approved, p), true, 'Editing a clone must not mutate the previous revision');
});

test('replace, remove and add activities validate data and invalidate approval', async () => {
  const { draft } = await fixture();
  const original = draft.content.days[0].activities[0];
  const next = replaceActivity(draft, 0, { ...original, title: 'My own walking route' });
  assert.equal(next.content.days[0].activities[0].title, 'My own walking route');
  assert.equal(next.revision, 2);
  assert.throws(() => replaceActivity(next, 0, { ...original, cost: { low: 20, high: 10 } }));
  let empty = next;
  for (const activity of next.content.days[0].activities) empty = removeActivity(empty, 0, activity.id);
  assert.match(approvalIssues(empty, p).join(' '), /at least one/);
  assert.throws(() => approveDraft(empty, p, true, new Date().toISOString()));
  const restored = replaceActivity(empty, 0, { ...original, id: 'new-activity' });
  assert.equal(approvalIssues(restored, p).length, 0);
});

test('cost totals count base costs once and activity estimates separately', async () => {
  const { draft } = await fixture();
  draft.content.baseDailyCost = { low: 50, high: 80 };
  draft.content.days.forEach(day => day.activities.forEach(activity => { activity.cost = { low: 5, high: 10 }; }));
  assert.deepEqual(estimateTotal(draft), { low: 120, high: 200 });
});

test('preference edits invalidate approved plans even if the brief is later restored', async () => {
  const { draft } = await fixture();
  const state = freshState(); state.preferences = p; state.itinerary = approveDraft(draft, p, true, new Date().toISOString());
  withPreferences(state, { ...p, crowds: 'Quieter places' });
  assert.equal(state.itinerary.approvedRevision, null);
  withPreferences(state, p);
  assert.equal(isApproved(state.itinerary, p), false);
});

test('saved results, comparison, edits and approval survive valid restoration; corrupt data does not', async () => {
  const { result, draft } = await fixture();
  const approved = approveDraft(draft, p, true, new Date().toISOString());
  const saved = { version: 2, preferences: p, batch: { preferences: p, result }, compareIds: [result.destinations[0].id, 'missing'], itinerary: approved, history: [] };
  const restored = restoreState(JSON.stringify(saved));
  assert.ok(samePreferences(restored.preferences, p));
  assert.equal(restored.batch.result.destinations.length, result.destinations.length);
  assert.deepEqual(restored.compareIds, [result.destinations[0].id]);
  assert.equal(isApproved(restored.itinerary, p), true);
  assert.equal(restoreState('{broken').batch, null);
  saved.itinerary.content.days[0].activities[0].title = null;
  assert.equal(restoreState(JSON.stringify(saved)).itinerary, null);
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
