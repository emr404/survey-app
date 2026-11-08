import type { RecommendationResult, Preferences } from '@/types/travel';
import type { DataValue } from '@/types/json';
import { isJsonObject } from './json';
import { validRecommendations, visaAdviceMatchesPreferences } from '../../shared/validation';

export function parseRecommendations(
  value: DataValue,
  preferences?: Preferences
): RecommendationResult {
  if (!isJsonObject(value)) throw new Error('Invalid recommendation response. Please retry.');
  const { mode, ...result } = value;
  if (mode !== 'groq' || !validRecommendations(result)) {
    throw new Error(
      'The recommendation response failed validation. Previous results are preserved.'
    );
  }
  if (
    preferences &&
    !result.destinations.every((destination) =>
      visaAdviceMatchesPreferences(destination.visaAdvice, preferences)
    )
  ) {
    throw new Error(
      'The recommendation response failed validation. Previous results are preserved.'
    );
  }
  return { ...result, mode };
}
