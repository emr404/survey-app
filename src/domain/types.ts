export type Currency = 'GBP' | 'EUR' | 'USD';
export interface Preferences {
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
export interface CostRange { low: number; high: number }
export interface Destination {
  id: string; name: string; country: string;
  matchReasons: string[]; tradeoffs: string[]; highlights: string[];
  dailyCost: CostRange; costNote: string;
  journeyHours: number | null; journeyNote: string;
  seasonNote: string; crowdNote: string;
}
export type SourceMode = 'demo' | 'live';
export interface Recommendations {
  summary: string; conflicts: string[]; destinations: Destination[]; notes: string[];
}
export interface RecommendationResult extends Recommendations { mode: SourceMode }
export interface RecommendationBatch { preferences: Preferences; result: RecommendationResult }
export interface Activity { id: string; title: string; description: string; durationMinutes: number; cost: CostRange }
export interface ItineraryContent {
  days: { day: number; activities: Activity[] }[];
  baseDailyCost: CostRange; assumptions: string[];
}
export interface ItineraryResult extends ItineraryContent { mode: SourceMode }
export interface ItineraryDraft {
  destination: Destination; preferences: Preferences; content: ItineraryContent; mode: SourceMode;
  revision: number; approvedRevision: number | null; approvedAt: string | null;
}
export interface HistoryEntry {
  id: string; at: string; kind: 'preferences' | 'refinement' | 'selection' | 'edit' | 'approval';
  label: string; changes: string[];
}
export interface TravelState {
  preferences: Preferences;
  batch: RecommendationBatch | null;
  compareIds: string[];
  itinerary: ItineraryDraft | null;
  history: HistoryEntry[];
  storageAvailable: boolean;
}
