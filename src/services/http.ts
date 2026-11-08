import type { ApiError } from '@/types/requests';
import type { JsonValue } from '@/types/json';
import { isJsonObject, parseJson } from '@/domain/json';
import { apiUrl } from './api';

function parseApiError(value: JsonValue): ApiError | null {
  if (!isJsonObject(value) || typeof value.error !== 'string' || !value.error.trim()) return null;
  return { error: value.error, ...(typeof value.code === 'string' ? { code: value.code } : {}) };
}

export async function requestJson(path: string, options: RequestInit): Promise<JsonValue> {
  let response: Response;
  try {
    response = await fetch(apiUrl(path), options);
  } catch {
    if (options.signal?.aborted) throw new Error('Request cancelled.');
    throw new Error(
      'We couldn’t reach the travel service. Your saved work is safe. Check the connection and retry.'
    );
  }

  let value: JsonValue;
  try {
    value = parseJson(await response.text());
  } catch {
    throw new Error(
      'The travel service returned an unreadable response. Your previous results are preserved. Please retry.'
    );
  }
  if (response.ok) return value;
  const error = parseApiError(value);
  throw new Error(
    error?.error ?? 'The travel service could not complete this request. Please retry.'
  );
}
