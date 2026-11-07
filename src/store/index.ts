import { createStore, Store, useStore as baseUseStore } from 'vuex';
import { InjectionKey } from 'vue';
import { TravelState, Preferences, RecommendationBatch, ItineraryDraft, HistoryEntry } from '@/domain/types';
import { freshState, restoreState, withPreferences } from '@/domain/state';

function load(): TravelState {
  try { return restoreState(localStorage.getItem('travel-companion-v2'), localStorage.getItem('survey-state')); }
  catch { return { ...freshState(), storageAvailable: false }; }
}
export const key: InjectionKey<Store<TravelState>> = Symbol();
export const store = createStore<TravelState>({
  state: load(),
  mutations: {
    SET_PREFERENCES(state, preferences: Preferences) { withPreferences(state, preferences); },
    SAVE_RESULTS(state, batch: RecommendationBatch) {
      state.batch = batch;
      state.compareIds = state.compareIds.filter(id => batch.result.destinations.some(d => d.id === id));
    },
    TOGGLE_COMPARE(state, id: string) {
      if (!state.batch?.result.destinations.some(d => d.id === id)) return;
      if (state.compareIds.includes(id)) state.compareIds = state.compareIds.filter(item => item !== id);
      else if (state.compareIds.length < 3) state.compareIds.push(id);
    },
    SAVE_ITINERARY(state, draft: ItineraryDraft) { state.itinerary = draft; },
    LOG(state, entry: HistoryEntry) { state.history = [...state.history, entry].slice(-60); },
  },
  plugins: [current => current.subscribe((_mutation, state) => {
    try {
      localStorage.setItem('travel-companion-v2', JSON.stringify({ version: 2,
        preferences: state.preferences, batch: state.batch, compareIds: state.compareIds, itinerary: state.itinerary, history: state.history,
      }));
      state.storageAvailable = true;
    } catch { state.storageAvailable = false; }
  })],
});
export function useStore() { return baseUseStore(key); }
