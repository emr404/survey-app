import type { ComputedRef, Ref } from 'vue';
import type { Preferences } from './travel';

export interface BriefStep {
  id: string;
  label: string;
  title: string;
  description: string;
  fields: (keyof Preferences)[];
}
export interface PreferenceSectionProps {
  preferences: Preferences;
  errors: Record<string, string>;
  submitted: boolean;
}
export interface BriefController {
  form: Preferences;
  step: Ref<number>;
  currentStep: ComputedRef<BriefStep>;
  primaryAction: ComputedRef<string>;
  submitted: Ref<boolean>;
  formElement: Ref<HTMLFormElement | null>;
  stepHeading: Ref<HTMLElement | null>;
  errors: ComputedRef<Record<string, string>>;
  visibleErrors: ComputedRef<Record<string, string>>;
  navigationError: Ref<string>;
  storageAvailable: ComputedRef<boolean>;
  hasResults: ComputedRef<boolean>;
  advance(): Promise<void>;
  navigate(target: number, returnToReview?: boolean): Promise<void>;
  editSection(index: number): Promise<void>;
  updatePreferences(value: Preferences): void;
}
export interface ReviewSection {
  title: string;
  rows: [label: string, value: string][];
}
