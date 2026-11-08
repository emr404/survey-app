import type { Preferences, RecommendationResult } from '@/types/travel';
import type { RecommendationRequest } from '@/types/requests';
import { parseRecommendations } from '@/domain/responses';
import { requestJson } from './http';

export async function getRecommendations(
  preferences: Preferences,
  signal: AbortSignal
): Promise<RecommendationResult> {
  const payload: RecommendationRequest = { preferences };
  const response = await requestJson('/api/recommendations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });
  return parseRecommendations(response, preferences);
}
