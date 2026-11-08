import type { DataValue, JsonObject, JsonValue } from '@/types/json';

export function parseJson(text: string): JsonValue {
  return JSON.parse(text) as JsonValue;
}

export function isJsonObject(value: DataValue): value is JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
