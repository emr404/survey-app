import { reactive, watch, computed, ref, nextTick } from 'vue';
import { useRoute, useRouter, isNavigationFailure, NavigationFailureType } from 'vue-router';
import { useStore } from '@/store';
import type { Preferences } from '@/types/travel';
import type { BriefController } from '@/types/brief';
import {
  briefSteps,
  reviewStep,
  stepIssues,
  firstInvalidStep,
  reachableStep,
} from '@/domain/brief';
import { clonePreferences, issuesFor } from '@/domain/preferences';

export function useBrief(): BriefController {
  const store = useStore();
  const router = useRouter();
  const route = useRoute();
  const form = reactive(clonePreferences(store.state.preferences));
  const step = ref(reachableStep(form, route.query.step));
  const stepHeading = ref<HTMLElement | null>(null);
  const formElement = ref<HTMLFormElement | null>(null);
  const submitted = ref(false);
  const navigationError = ref('');
  const currentStep = computed(() => briefSteps[step.value] ?? briefSteps[0]);
  const returningToReview = computed(() => route.query.returnTo === 'review');
  const errors = computed(() => issuesFor(form));
  const visibleErrors = computed(() => stepIssues(form, step.value));
  const storageAvailable = computed(() => store.state.storageAvailable);
  const hasResults = computed(() => store.state.batch !== null);
  const primaryAction = computed(() => {
    if (step.value === reviewStep) return 'Find destinations';
    if (returningToReview.value) return 'Save and review';
    return step.value === reviewStep - 1 ? 'Review your trip' : 'Continue';
  });

  function updatePreferences(value: Preferences): void {
    Object.assign(form, value);
  }
  async function focusError(): Promise<void> {
    await nextTick();
    const invalid = formElement.value?.querySelector<HTMLElement>(
      'input[aria-invalid="true"], select[aria-invalid="true"], textarea[aria-invalid="true"]'
    );
    invalid?.focus({ preventScroll: true });
    invalid?.scrollIntoView({ block: 'center', behavior: 'auto' });
  }
  async function navigate(target: number, returnToReview = false): Promise<void> {
    const requested = briefSteps[target];
    if (!requested) return;
    navigationError.value = '';
    try {
      const destination = reachableStep(form, requested.id);
      const failure = await router.push({
        path: '/',
        query: {
          step: (briefSteps[destination] ?? briefSteps[0]).id,
          ...(returnToReview ? { returnTo: 'review' } : {}),
        },
      });
      if (failure && !isNavigationFailure(failure, NavigationFailureType.duplicated)) {
        navigationError.value = 'This step could not be opened. Please try again.';
        return;
      }
      if (destination >= target) return;
      submitted.value = true;
      await focusError();
    } catch {
      navigationError.value =
        'This step could not be opened. Your answers are saved. Please try again.';
    }
  }
  async function editSection(index: number): Promise<void> {
    await navigate(index, true);
  }
  async function advance(): Promise<void> {
    submitted.value = true;
    if (Object.keys(visibleErrors.value).length) {
      await focusError();
      return;
    }
    if (step.value < reviewStep) {
      await navigate(returningToReview.value ? reviewStep : step.value + 1);
      return;
    }
    const invalid = firstInvalidStep(form);
    if (invalid >= 0) {
      await navigate(invalid);
      submitted.value = true;
      await focusError();
      return;
    }
    try {
      store.commit('SET_PREFERENCES', form);
      await router.push('/results?generate=1');
    } catch {
      navigationError.value =
        'Recommendations could not be opened. Your brief is saved. Please try again.';
    }
  }

  watch(form, (value) => store.commit('SET_PREFERENCES', value), { deep: true, flush: 'sync' });
  watch(
    () => route.query.step,
    async (requested, _previous, onCleanup) => {
      let active = true;
      onCleanup(() => {
        active = false;
      });
      const target = reachableStep(form, requested);
      try {
        if (requested && (briefSteps[target] ?? briefSteps[0]).id !== requested) {
          await router.replace({
            path: '/',
            query: { step: (briefSteps[target] ?? briefSteps[0]).id },
          });
        }
        if (!active) return;
        step.value = target;
        submitted.value = false;
        await nextTick();
        if (active && requested !== undefined) stepHeading.value?.focus({ preventScroll: true });
      } catch {
        navigationError.value = 'This step could not be restored. Your answers are saved.';
      }
    },
    { immediate: true }
  );

  return {
    form,
    step,
    currentStep,
    primaryAction,
    submitted,
    formElement,
    stepHeading,
    errors,
    visibleErrors,
    navigationError,
    storageAvailable,
    hasResults,
    advance,
    navigate,
    editSection,
    updatePreferences,
  };
}
