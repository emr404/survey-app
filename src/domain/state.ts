import { TravelState, RecommendationBatch, ItineraryDraft, HistoryEntry, Preferences } from './types';
import { defaultPreferences, isPreferenceDraft, issuesFor, migrateLegacy, samePreferences } from './preferences';
import { validDestination, validRecommendations, validItinerary } from '../../shared/validation';

export const freshState = (): TravelState => ({ preferences: defaultPreferences(), batch: null, compareIds: [], itinerary: null, history: [], storageAvailable: true });
export function isBatch(value: unknown): value is RecommendationBatch {
  if (!value || typeof value !== 'object') return false;
  const b = value as RecommendationBatch;
  if (!isPreferenceDraft(b.preferences) || Object.keys(issuesFor(b.preferences)).length || !b.result) return false;
  const { mode, ...recommendations } = b.result;
  return ['demo', 'live'].includes(mode) && validRecommendations(recommendations);
}
export function isDraft(value: unknown): value is ItineraryDraft {
  if (!value || typeof value !== 'object') return false;
  const d = value as ItineraryDraft;
  return isPreferenceDraft(d.preferences) && !Object.keys(issuesFor(d.preferences)).length &&
    validDestination(d.destination) && validItinerary(d.content, d.preferences.days) &&
    ['demo', 'live'].includes(d.mode) && Number.isInteger(d.revision) && d.revision >= 1 &&
    (d.approvedRevision === null || d.approvedRevision === d.revision) &&
    (d.approvedAt === null || (typeof d.approvedAt === 'string' && Number.isFinite(Date.parse(d.approvedAt)))) &&
    ((d.approvedRevision === null) === (d.approvedAt === null));
}
function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as HistoryEntry;
  return typeof entry.id === 'string' && typeof entry.at === 'string' && Number.isFinite(Date.parse(entry.at)) &&
    ['preferences', 'refinement', 'selection', 'edit', 'approval'].includes(entry.kind) &&
    typeof entry.label === 'string' && entry.label.length < 500 && Array.isArray(entry.changes) &&
    entry.changes.length <= 20 && entry.changes.every(item => typeof item === 'string' && item.length < 4000);
}
export function restoreState(raw: string | null, legacy: string | null = null): TravelState {
  const state = freshState();
  try {
    if (!raw) { if (legacy) state.preferences = migrateLegacy(JSON.parse(legacy)); return state; }
    const saved = JSON.parse(raw);
    if (saved.version !== 2) return state;
    if (isPreferenceDraft(saved.preferences)) state.preferences = saved.preferences;
    if (isBatch(saved.batch)) state.batch = saved.batch;
    if (Array.isArray(saved.compareIds)) state.compareIds = saved.compareIds.filter((id: unknown) =>
      typeof id === 'string' && state.batch?.result.destinations.some(d => d.id === id)).slice(0, 3);
    if (isDraft(saved.itinerary)) {
      const itinerary: ItineraryDraft = saved.itinerary;
      if (!samePreferences(state.preferences, itinerary.preferences)) {
        itinerary.approvedRevision = null; itinerary.approvedAt = null;
      }
      state.itinerary = itinerary;
    }
    if (Array.isArray(saved.history)) state.history = saved.history.filter(isHistoryEntry).slice(-60);
  } catch { /* Invalid browser saves never block a fresh journey. */ }
  return state;
}
export function withPreferences(state: TravelState, preferences: Preferences): void {
  if (!samePreferences(state.preferences, preferences) && state.itinerary) {
    state.itinerary.approvedRevision = null; state.itinerary.approvedAt = null;
  }
  state.preferences = JSON.parse(JSON.stringify(preferences)) as Preferences;
}
