import type { TravelState, RecommendationBatch, Preferences } from '@/types/travel';
import type { DataValue, JsonValue, JsonObject } from '@/types/json';
import {
  defaultPreferences,
  clonePreferences,
  isPreferenceDraft,
  issuesFor,
  migrateLegacy,
} from './preferences';
import { isJsonObject, parseJson } from './json';
import { validRecommendations, visaAdviceMatchesPreferences } from '../../shared/validation';

export const freshState = (): TravelState => ({
  preferences: defaultPreferences(),
  batch: null,
  storageAvailable: true,
});

export function isBatch(value: DataValue): value is RecommendationBatch {
  if (!isJsonObject(value) || !isPreferenceDraft(value.preferences)) return false;
  if (Object.keys(issuesFor(value.preferences)).length || !isJsonObject(value.result)) return false;
  const { mode, ...recommendations } = value.result;
  if (mode !== 'groq' || !validRecommendations(recommendations)) return false;
  const preferences = value.preferences;
  return recommendations.destinations.every((destination) =>
    visaAdviceMatchesPreferences(destination.visaAdvice, preferences)
  );
}

function upgradeSavedPreferences(value: JsonValue | undefined): JsonValue | undefined {
  if (!isJsonObject(value)) return value;
  return { passportCountries: [], residenceCountry: '', passportType: 'ordinary', ...value };
}

export function restoreState(raw: string | null, legacy: string | null = null): TravelState {
  const state = freshState();
  try {
    if (!raw) {
      if (legacy) state.preferences = migrateLegacy(parseJson(legacy));
      return state;
    }
    const saved = parseJson(raw);
    if (!isJsonObject(saved) || saved.version !== 2) return state;
    const preferences = upgradeSavedPreferences(saved.preferences);
    if (isPreferenceDraft(preferences)) state.preferences = preferences;
    if (!isJsonObject(saved.batch)) return state;
    const batch: JsonObject = {
      ...saved.batch,
      preferences: upgradeSavedPreferences(saved.batch.preferences),
    };
    if (
      isPreferenceDraft(batch.preferences) &&
      batch.preferences.passportCountries.length === 0 &&
      isJsonObject(batch.result) &&
      Array.isArray(batch.result.destinations)
    ) {
      batch.result = {
        ...batch.result,
        destinations: batch.result.destinations.map((destination) =>
          isJsonObject(destination) ? { visaAdvice: [], ...destination } : destination
        ),
      };
    }
    if (isBatch(batch)) state.batch = batch;
    return state;
  } catch {
    return state;
  }
}

export function withPreferences(state: TravelState, preferences: Preferences): void {
  state.preferences = clonePreferences(preferences);
}
