import { RecommendationResult, Preferences } from './types';
import { validRecommendations, visaAdviceMatchesPreferences } from '../../shared/validation';
export function parseRecommendations(value: unknown, preferences?: Preferences): RecommendationResult {
  if (!value || typeof value !== 'object') throw new Error('Invalid recommendation response. Please retry.');
  const data = value as RecommendationResult;
  const { mode, ...result } = data;
  if (mode !== 'groq' || !validRecommendations(result) || (preferences && !result.destinations.every(destination => visaAdviceMatchesPreferences(destination.visaAdvice, preferences)))) throw new Error('The recommendation response failed validation. Previous results are preserved.');
  return data;
}
