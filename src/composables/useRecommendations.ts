import { computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from '@/store';
import type { RecommendationsController } from '@/types/recommendations';
import type { Refinement } from '@/domain/preferences';
import {
  clonePreferences,
  describeChanges,
  refinePreferences,
  samePreferences,
  issuesFor,
} from '@/domain/preferences';
import { journeyLimits } from '@/domain/options';
import { inputValue } from '@/domain/events';
import { getRecommendations } from '@/services/recommendations';
import { useTravelRequest } from './useTravelRequest';

export function useRecommendations(): RecommendationsController {
  const store = useStore();
  const route = useRoute();
  const router = useRouter();
  const { status, error, run, cancel } = useTravelRequest();
  const batch = computed(() => store.state.batch);
  const preferences = computed(() => store.state.preferences);
  const pendingChanges = computed(() =>
    batch.value ? describeChanges(batch.value.preferences, preferences.value) : []
  );
  const validationErrors = computed(() => issuesFor(preferences.value));
  const journeyOptions = computed(() => {
    const values = [1, ...journeyLimits, preferences.value.maxJourneyHours];
    return [...new Set(values.filter((value): value is number => value !== null))].sort(
      (a, b) => a - b
    );
  });

  function refine(value: Refinement): void {
    store.commit('SET_PREFERENCES', refinePreferences(preferences.value, value));
  }
  function undoRefinements(): void {
    if (!batch.value) return;
    store.commit('SET_PREFERENCES', batch.value.preferences);
  }
  function editBudget(event: Event): void {
    store.commit('SET_PREFERENCES', {
      ...preferences.value,
      dailyBudget: Number(inputValue(event)),
    });
  }
  function editJourney(event: Event): void {
    const value = inputValue(event);
    store.commit('SET_PREFERENCES', {
      ...preferences.value,
      maxJourneyHours: value === '' ? null : Number(value),
    });
  }
  function editCrowds(event: Event): void {
    const crowds = inputValue(event);
    if (crowds !== 'No preference' && crowds !== 'Quieter places') return;
    store.commit('SET_PREFERENCES', { ...preferences.value, crowds });
  }
  async function generate(): Promise<void> {
    if (status.value === 'requesting') return;
    if (Object.keys(validationErrors.value).length) {
      try {
        await router.push('/');
      } catch {
        status.value = 'error';
        error.value = 'Your brief needs attention. Open Your trip to review the details.';
      }
      return;
    }
    const snapshot = clonePreferences(preferences.value);
    await run(
      (signal) => getRecommendations(snapshot, signal),
      (result) => {
        if (!samePreferences(snapshot, preferences.value)) return;
        store.commit('SAVE_RESULTS', { preferences: snapshot, result });
      }
    );
  }

  watch(
    preferences,
    () => {
      if (status.value === 'requesting') cancel();
    },
    { deep: true, flush: 'sync' }
  );
  onMounted(async () => {
    if (route.query.generate !== '1') return;
    try {
      const failure = await router.replace('/results');
      if (failure) return;
      await generate();
    } catch {
      status.value = 'error';
      error.value = 'Recommendations could not be started. Your brief is saved. Please retry.';
    }
  });

  return {
    batch,
    preferences,
    pendingChanges,
    validationErrors,
    journeyOptions,
    status,
    error,
    cancel,
    generate,
    refine,
    undoRefinements,
    editBudget,
    editJourney,
    editCrowds,
  };
}
