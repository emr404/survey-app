import type { DataValue, JsonPrimitive } from '../src/types/json';
import type { Preferences, Recommendations, Destination, VisaAdvice } from '../src/types/travel';

export interface Schema {
  type?: string;
  anyOf?: Schema[];
  enum?: JsonPrimitive[];
  properties?: Record<string, Schema>;
  required?: string[];
  items?: Schema;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  pattern?: string;
}
interface PreferenceSchema extends Schema {
  properties: Record<keyof Preferences, Schema>;
}
export const contracts: {
  preferences: PreferenceSchema;
  destination: Schema;
  recommendations: Schema;
};
export function matches(value: DataValue, schema: Schema): boolean;
export function preferenceIssues(value: DataValue): Record<string, string>;
export function validDestination(value: DataValue): value is Destination;
export function validRecommendations(value: DataValue): value is Recommendations;
export function visaAdviceMatchesPreferences(
  advice: VisaAdvice[],
  preferences: Preferences
): boolean;
