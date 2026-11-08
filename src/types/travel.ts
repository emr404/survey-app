export type Currency = 'GBP' | 'EUR' | 'USD';
export interface Preferences {
  passportCountries: string[];
  residenceCountry: string;
  passportType: 'ordinary' | 'other';
  departure: string;
  currency: Currency;
  dailyBudget: number;
  travellers: number;
  days: number;
  timing: 'flexible' | 'dates';
  startDate: string;
  season: 'Any season' | 'Spring' | 'Summer' | 'Autumn' | 'Winter';
  region: 'Anywhere' | 'Europe' | 'Asia' | 'Africa' | 'South America';
  interests: string[];
  pace: 'Relaxed' | 'Balanced' | 'Active';
  transport: 'Any transport' | 'Flight' | 'Train';
  maxJourneyHours: number | null;
  crowds: 'No preference' | 'Quieter places';
  constraints: string;
}
export interface CostRange {
  low: number;
  high: number;
}
export interface VisaAdvice {
  passportCountry: string;
  status: 'visa_may_be_required' | 'visa_exemption_may_apply' | 'check_required';
  note: string;
}
export interface Destination {
  visaAdvice: VisaAdvice[];
  id: string;
  name: string;
  country: string;
  matchReasons: string[];
  tradeoffs: string[];
  highlights: string[];
  dailyCost: CostRange;
  costNote: string;
  journeyHours: number | null;
  journeyNote: string;
  seasonNote: string;
  crowdNote: string;
}
export interface Recommendations {
  summary: string;
  conflicts: string[];
  destinations: Destination[];
  notes: string[];
}
export interface RecommendationResult extends Recommendations {
  mode: 'groq';
}
export interface RecommendationBatch {
  preferences: Preferences;
  result: RecommendationResult;
}
export interface TravelState {
  preferences: Preferences;
  batch: RecommendationBatch | null;
  storageAvailable: boolean;
}

export interface SavedTravelState {
  version: 2;
  preferences: Preferences;
  batch: RecommendationBatch | null;
}
