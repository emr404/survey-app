import { createStore, Store, useStore as baseUseStore } from 'vuex';
import { InjectionKey } from 'vue';
import { TravelState, Preferences, RecommendationBatch } from '@/domain/types';
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
    SAVE_RESULTS(state, batch: RecommendationBatch) { state.batch = batch; },
  },
  plugins: [current => current.subscribe((_mutation, state) => {
    try {
      localStorage.setItem('travel-companion-v2', JSON.stringify({ version: 2,
        preferences: state.preferences, batch: state.batch,
      }));
      state.storageAvailable = true;
    } catch { state.storageAvailable = false; }
  })],
});
export function useStore() { return baseUseStore(key); }
