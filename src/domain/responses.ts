import { RecommendationResult, ItineraryResult } from './types';
import { validRecommendations, validItinerary } from '../../shared/validation';
export function parseRecommendations(value: unknown): RecommendationResult {
  if (!value || typeof value !== 'object') throw new Error('Invalid recommendation response. Please retry.');
  const data = value as RecommendationResult;
  const { mode, ...result } = data;
  if (!['demo', 'live'].includes(mode) || !validRecommendations(result)) throw new Error('The recommendation response failed validation. Previous results are preserved.');
  return data;
}
export function parseItinerary(value: unknown, days: number): ItineraryResult {
  if (!value || typeof value !== 'object') throw new Error('Invalid itinerary response. Please retry.');
  const data = value as ItineraryResult;
  const { mode, ...content } = data;
  if (!['demo', 'live'].includes(mode) || !validItinerary(content, days)) throw new Error('The itinerary response failed validation. Your previous plan is preserved.');
  return data;
}
