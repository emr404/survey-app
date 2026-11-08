import { createStore, Store, useStore as baseUseStore } from 'vuex';
import { InjectionKey } from 'vue';
import { TravelState, Preferences, RecommendationBatch, SavedTravelState } from '@/types/travel';
import { freshState, restoreState, withPreferences } from '@/domain/state';

function load(): TravelState {
  try {
    return restoreState(
      localStorage.getItem('travel-companion-v2'),
      localStorage.getItem('survey-state')
    );
  } catch {
    return { ...freshState(), storageAvailable: false };
  }
}
export const key: InjectionKey<Store<TravelState>> = Symbol();
export const store = createStore<TravelState>({
  state: load(),
  mutations: {
    SET_PREFERENCES(state, preferences: Preferences): void {
      withPreferences(state, preferences);
    },
    SAVE_RESULTS(state, batch: RecommendationBatch): void {
      state.batch = batch;
    },
  },
  plugins: [
    (current) =>
      current.subscribe((_mutation, state) => {
        try {
          const saved: SavedTravelState = {
            version: 2,
            preferences: state.preferences,
            batch: state.batch,
          };
          localStorage.setItem('travel-companion-v2', JSON.stringify(saved));
          state.storageAvailable = true;
        } catch {
          state.storageAvailable = false;
        }
      }),
  ],
});
type TravelStore = Omit<Store<TravelState>, 'commit'> & {
  commit(type: 'SET_PREFERENCES', preferences: Preferences): void;
  commit(type: 'SAVE_RESULTS', batch: RecommendationBatch): void;
};

export function useStore(): TravelStore {
  return baseUseStore(key);
}
