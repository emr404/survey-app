import type { Ref } from 'vue';
import type { Preferences } from './travel';

export type RequestStatus = 'idle' | 'requesting' | 'cancelled' | 'error' | 'done';
export interface RecommendationRequest {
  preferences: Preferences;
}
export interface RequestController {
  status: Ref<RequestStatus>;
  error: Ref<string>;
  cancel(): void;
  run<T>(operation: (signal: AbortSignal) => Promise<T>, accept: (value: T) => void): Promise<void>;
}
export interface DestinationImage {
  url: string;
  alt: string;
  author: string;
  sourceUrl: string;
  license: string;
  licenseUrl: string;
}

export type RequestOutcome<T> = { success: true; value: T } | { success: false; message: string };

export interface ApiError {
  error: string;
  code?: string;
}
