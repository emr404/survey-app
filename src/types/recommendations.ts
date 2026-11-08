import type { ComputedRef, Ref } from 'vue';
import type { Preferences, RecommendationBatch } from './travel';
import type { Refinement } from '@/domain/preferences';
import type { RequestStatus } from './requests';

export interface RecommendationsController {
  batch: ComputedRef<RecommendationBatch | null>;
  preferences: ComputedRef<Preferences>;
  pendingChanges: ComputedRef<string[]>;
  validationErrors: ComputedRef<Record<string, string>>;
  journeyOptions: ComputedRef<number[]>;
  status: Ref<RequestStatus>;
  error: Ref<string>;
  cancel(): void;
  generate(): Promise<void>;
  refine(value: Refinement): void;
  undoRefinements(): void;
  editBudget(event: Event): void;
  editJourney(event: Event): void;
  editCrowds(event: Event): void;
}
