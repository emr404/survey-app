import { TravelState, RecommendationBatch, Preferences } from './types';
import { defaultPreferences, isPreferenceDraft, issuesFor, migrateLegacy } from './preferences';
import { validRecommendations, visaAdviceMatchesPreferences } from '../../shared/validation';

export const freshState = (): TravelState => ({ preferences: defaultPreferences(), batch: null, storageAvailable: true });
export function isBatch(value: unknown): value is RecommendationBatch {
  if (!value || typeof value !== 'object') return false;
  const b = value as RecommendationBatch;
  if (!isPreferenceDraft(b.preferences) || Object.keys(issuesFor(b.preferences)).length || !b.result) return false;
  const { mode, ...recommendations } = b.result;
  return mode === 'groq' && validRecommendations(recommendations) && b.result.destinations.every(destination => visaAdviceMatchesPreferences(destination.visaAdvice, b.preferences));
}
// Add only absent fields to older saves. Invalid supplied values still fail validation.
function upgradeSavedPreferences(value: unknown): unknown {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? { passportCountries: [], residenceCountry: '', passportType: 'ordinary', ...value } : value;
}
export function restoreState(raw: string | null, legacy: string | null = null): TravelState {
  const state = freshState();
  try {
    if (!raw) { if (legacy) state.preferences = migrateLegacy(JSON.parse(legacy)); return state; }
    const saved = JSON.parse(raw);
    if (saved.version !== 2) return state;
    saved.preferences = upgradeSavedPreferences(saved.preferences);
    if (saved.batch && typeof saved.batch === 'object') {
      saved.batch.preferences = upgradeSavedPreferences(saved.batch.preferences);
      if (isPreferenceDraft(saved.batch.preferences) && !saved.batch.preferences.passportCountries.length && Array.isArray(saved.batch.result?.destinations)) {
        saved.batch.result.destinations = saved.batch.result.destinations.map((destination: unknown) =>
          destination && typeof destination === 'object' ? { visaAdvice: [], ...destination } : destination);
      }
    }
    if (isPreferenceDraft(saved.preferences)) state.preferences = saved.preferences;
    if (isBatch(saved.batch)) state.batch = saved.batch;
  } catch { /* Invalid browser saves never block a fresh journey. */ }
  return state;
}
export function withPreferences(state: TravelState, preferences: Preferences): void {
  state.preferences = JSON.parse(JSON.stringify(preferences)) as Preferences;
}
