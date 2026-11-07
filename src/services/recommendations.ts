import { apiUrl } from './api';
import { ref, onBeforeUnmount } from 'vue';
import { Preferences, RecommendationResult } from '@/domain/types';
import { RequestGate } from '@/domain/requests';
import { parseRecommendations } from '@/domain/responses';

async function request(path: string, body: unknown, signal: AbortSignal): Promise<unknown> {
  let response: Response;
  try { response = await fetch(apiUrl(path), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal }); }
  catch (error) {
    if (signal.aborted) throw error;
    throw new Error('We couldn’t reach the travel service. Your saved work is safe. Check the connection and retry.');
  }
  const value: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = value as { error?: unknown } | null;
    throw new Error(typeof error?.error === 'string' ? error.error : 'The travel service could not complete this request. Please retry.');
  }
  return value;
}
export async function getRecommendations(preferences: Preferences, signal: AbortSignal): Promise<RecommendationResult> {
  return parseRecommendations(await request('/api/recommendations', { preferences }, signal), preferences);
}
export function useTravelRequest() {
  const gate = new RequestGate();
  const status = ref<'idle' | 'requesting' | 'cancelled' | 'error' | 'done'>('idle');
  const error = ref('');
  function cancel() { gate.cancel(); status.value = 'cancelled'; error.value = ''; }
  async function run<T>(operation: (signal: AbortSignal) => Promise<T>, accept: (value: T) => void, timeoutMs = 60000) {
    const { id, signal } = gate.begin();
    status.value = 'requesting'; error.value = '';
    let timedOut = false;
    const timeout = window.setTimeout(() => { if (!gate.current(id)) return; timedOut = true; gate.cancel(); status.value = 'error'; error.value = 'This request took too long. Your previous work is saved. Please retry.'; }, Math.min(timeoutMs, 2147483647));
    try {
      const result = await operation(signal);
      if (gate.current(id)) { accept(result); status.value = 'done'; }
    } catch (cause) {
      if (gate.current(id) && !timedOut) {
        error.value = cause instanceof Error ? cause.message : 'Something went wrong. Please retry.';
        status.value = 'error';
      }
    } finally { window.clearTimeout(timeout); }
  }
  onBeforeUnmount(() => gate.cancel());
  return { status, error, run, cancel };
}
