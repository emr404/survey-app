import { reactive, ref, onBeforeUnmount } from 'vue';
import { Preferences, Destination, RecommendationResult, ItineraryResult } from '@/domain/types';
import { RequestGate } from '@/domain/requests';
import { parseRecommendations, parseItinerary } from '@/domain/responses';

export const serviceStatus = reactive({ checked: false, available: false, mode: 'unknown', error: '' });
class TravelRequestError extends Error {
  constructor(message: string, readonly code: string) { super(message); }
}
export async function checkService(): Promise<void> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch('/api/status', { signal: controller.signal });
    const value: unknown = await response.json();
    const data = value as { mode?: unknown; available?: unknown };
    if (!response.ok || !data || !['demo', 'live'].includes(String(data.mode)) || typeof data.available !== 'boolean') throw new Error();
    serviceStatus.mode = String(data.mode); serviceStatus.available = data.available;
    serviceStatus.error = data.available ? '' : 'Live AI is configured without a server key.';
  } catch { serviceStatus.mode = 'unknown'; serviceStatus.available = false; serviceStatus.error = 'The travel service is unavailable. Start the local API to generate ideas. Your saved work is still available.'; }
  finally { serviceStatus.checked = true; window.clearTimeout(timeout); }
}
async function request(path: string, body: unknown, signal: AbortSignal): Promise<unknown> {
  let response: Response;
  try { response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal }); }
  catch (error) {
    if (signal.aborted) throw error;
    throw new Error('We couldn’t reach the travel service. Your saved work is safe. Check the connection and retry.');
  }
  const value: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = value as { error?: unknown; code?: unknown } | null;
    throw new TravelRequestError(typeof error?.error === 'string' ? error.error : 'The travel service could not complete this request. Please retry.',
      typeof error?.code === 'string' ? error.code : 'request_failed');
  }
  return value;
}
export async function getRecommendations(preferences: Preferences, signal: AbortSignal): Promise<RecommendationResult> {
  return parseRecommendations(await request('/api/recommendations', { preferences }, signal));
}
export async function getItinerary(preferences: Preferences, destination: Destination, signal: AbortSignal): Promise<ItineraryResult> {
  return parseItinerary(await request('/api/itinerary', { preferences, destination }, signal), preferences.days);
}
export function useTravelRequest() {
  const gate = new RequestGate();
  const status = ref<'idle' | 'requesting' | 'cancelled' | 'error' | 'done'>('idle');
  const error = ref('');
  const errorCode = ref('');
  function cancel() { gate.cancel(); status.value = 'cancelled'; error.value = ''; errorCode.value = ''; }
  async function run<T>(operation: (signal: AbortSignal) => Promise<T>, accept: (value: T) => void, timeoutMs = 60000) {
    const { id, signal } = gate.begin();
    status.value = 'requesting'; error.value = ''; errorCode.value = '';
    let timedOut = false;
    const timeout = window.setTimeout(() => { if (!gate.current(id)) return; timedOut = true; gate.cancel(); status.value = 'error'; error.value = 'This request took too long. Your previous work is saved. Please retry.'; }, Math.min(timeoutMs, 2147483647));
    try {
      const result = await operation(signal);
      if (gate.current(id)) { accept(result); status.value = 'done'; }
    } catch (cause) {
      if (gate.current(id) && !timedOut) {
        error.value = cause instanceof Error ? cause.message : 'Something went wrong. Please retry.';
        errorCode.value = cause instanceof TravelRequestError ? cause.code : 'request_failed';
        status.value = 'error';
      }
    } finally { window.clearTimeout(timeout); }
  }
  onBeforeUnmount(() => gate.cancel());
  return { status, error, errorCode, run, cancel };
}
