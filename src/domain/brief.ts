import { Preferences } from './types';
import { issuesFor } from './preferences';

// Navigation belongs to the brief, not to the preferences sent to the model.
export const briefSteps: { id: string; label: string; title: string; description: string; fields: (keyof Preferences)[] }[] = [
  { id: 'trip', label: 'Your trip', title: 'Start with the essentials.', description: 'Where you leave from, who’s coming and when you’d like to go.', fields: ['departure', 'days', 'travellers', 'timing', 'startDate', 'season'] },
  { id: 'budget', label: 'Budget', title: 'Find your comfort zone.', description: 'Set a budget and a journey you’d be happy to make.', fields: ['dailyBudget', 'currency', 'transport', 'maxJourneyHours'] },
  { id: 'passports', label: 'Passports', title: 'A little about entry requirements.', description: 'Optional. Add the passports your group will travel on to get relevant entry suggestions.', fields: ['passportCountries', 'residenceCountry', 'passportType'] },
  { id: 'interests', label: 'Interests', title: 'Make it your kind of trip.', description: 'Choose what you enjoy and anything the suggestions should take into account.', fields: ['interests', 'pace', 'crowds', 'region', 'constraints'] },
  { id: 'review', label: 'Review', title: 'Does this sound like your trip?', description: 'Check your brief. You can edit any section before asking for recommendations.', fields: [] },
];
export const reviewStep = briefSteps.length - 1;
export function stepIssues(preferences: Preferences, step: number): Record<string, string> {
  const errors = issuesFor(preferences);
  return Object.fromEntries((briefSteps[step]?.fields || []).filter(key => errors[key]).map(key => [key, errors[key]]));
}
export function firstInvalidStep(preferences: Preferences): number {
  return briefSteps.findIndex((_step, index) => Object.keys(stepIssues(preferences, index)).length > 0);
}
export function reachableStep(preferences: Preferences, requested: unknown): number {
  const target = briefSteps.findIndex(step => step.id === requested);
  if (target < 0) return 0;
  const invalid = firstInvalidStep(preferences);
  return invalid >= 0 ? Math.min(target, invalid) : target;
}
