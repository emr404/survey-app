import { Preferences, Currency } from './types';
import { countries } from '../../shared/countries';
import { preferenceIssues, matches, contracts } from '../../shared/validation';

export const defaultPreferences = (): Preferences => ({
  passportCountries: [], residenceCountry: '', passportType: 'ordinary',
  departure: '', currency: 'GBP', dailyBudget: 120, travellers: 2, days: 5,
  timing: 'flexible', startDate: '', season: 'Any season', region: 'Anywhere',
  interests: ['Culture', 'Food'], pace: 'Balanced', transport: 'Any transport',
  maxJourneyHours: null, crowds: 'No preference', constraints: '',
});
export const issuesFor = (preferences: Preferences): Record<string, string> => preferenceIssues(preferences);
// Drafts may contain temporary numeric edits. Generation still uses the strict
// shared preference contract via issuesFor; restoring a draft must not erase it.
const draftSchema = {
  ...contracts.preferences,
  properties: {
    ...contracts.preferences.properties,
    dailyBudget: { type: 'number' },
    days: { type: 'number' },
    travellers: { type: 'number' },
  },
};
export const isPreferenceDraft = (value: unknown): value is Preferences => matches(value, draftSchema);
export const samePreferences = (a: Preferences, b: Preferences): boolean =>
  (Object.keys(defaultPreferences()) as (keyof Preferences)[]).every(key => JSON.stringify(a[key]) === JSON.stringify(b[key]));
export const money = (value: number, currency: Currency): string => new Intl.NumberFormat('en-GB', {
  style: 'currency', currency, maximumFractionDigits: 0,
}).format(value);
export const countLabel = (count: number, unit: 'hour' | 'day' | 'traveller' | 'destination'): string =>
  `${count} ${unit}${count === 1 ? '' : 's'}`;
export const rangeLabel = (low: number, high: number, currency: Currency): string => `${money(low, currency)}–${money(high, currency)}`;
export const preferenceLabels: Record<keyof Preferences, string> = {
  passportCountries: 'Passport nationalities', residenceCountry: 'Country of residence', passportType: 'Travel document',
  departure: 'Departure', currency: 'Currency', dailyBudget: 'Daily budget per person', travellers: 'Travellers',
  days: 'Trip length', timing: 'Date flexibility', startDate: 'Departure date', season: 'Season',
  region: 'Region', interests: 'Interests', pace: 'Pace', transport: 'Transport', maxJourneyHours: 'Maximum one-way journey (hours)',
  crowds: 'Crowds', constraints: 'Travel constraints',
};
function display(value: unknown): string {
  if (typeof value === 'string') {
    const country = countries.find(country => country.code === value);
    if (country) return country.name;
    if (value === 'ordinary') return 'Ordinary passport';
    if (value === 'other') return 'Other travel document';
  }
  if (Array.isArray(value)) return value.map(display).join(', ') || 'None';
  return value === null || value === '' ? 'Not specified' : String(value);
}
export const describeChanges = (before: Preferences, after: Preferences): string[] =>
  (Object.keys(preferenceLabels) as (keyof Preferences)[])
    .filter(key => JSON.stringify(before[key]) !== JSON.stringify(after[key]))
    .map(key => `${preferenceLabels[key]}: ${display(before[key])} → ${display(after[key])}`);

export type Refinement = 'quieter' | 'shorter' | 'budget';
export function refinePreferences(preferences: Preferences, refinement: Refinement): Preferences {
  const next = { ...preferences, interests: [...preferences.interests] };
  if (refinement === 'quieter') next.crowds = 'Quieter places';
  if (refinement === 'shorter') next.maxJourneyHours = Math.max(1, Math.min(4, (next.maxJourneyHours ?? 6) - 1));
  if (refinement === 'budget') next.dailyBudget = Math.max(1, Math.floor(next.dailyBudget * 0.8));
  return next;
}

// Keep useful answers from the original questionnaire when opening an older browser save.
export function migrateLegacy(value: unknown): Preferences {
  const preferences = defaultPreferences();
  if (!value || typeof value !== 'object') return preferences;
  const legacy = value as { answers?: Record<string, string>; tripNotes?: string };
  const a = legacy.answers || {};
  const interests: Record<string, string> = { Beach: 'Coast', Mountain: 'Nature', City: 'Cities', Countryside: 'Nature' };
  if (interests[a['1']]) preferences.interests = [interests[a['1']]];
  if (a['3'] && ['Europe', 'Asia', 'Africa', 'South America'].includes(a['3'])) preferences.region = a['3'] as Preferences['region'];
  if (a['2'] === 'Train') preferences.transport = 'Train';
  if (a['2'] === 'Airplane') preferences.transport = 'Flight';
  const days: Record<string, number> = { 'A weekend': 2, 'One week': 7, 'Two weeks': 14 };
  preferences.days = days[a['6']] || 5;
  if (['Spring', 'Summer', 'Autumn', 'Winter'].includes(a['7'])) preferences.season = a['7'] as Preferences['season'];
  if (a['9'] === 'Solo') preferences.travellers = 1;
  if (typeof legacy.tripNotes === 'string') preferences.constraints = legacy.tripNotes.slice(0, 1500);
  return preferences;
}
