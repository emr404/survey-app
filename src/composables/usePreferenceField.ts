import { computed, WritableComputedRef } from 'vue';
import type { Preferences } from '@/types/travel';

type PreferenceField = <K extends keyof Preferences>(key: K) => WritableComputedRef<Preferences[K]>;

export function usePreferenceField(
  preferences: () => Preferences,
  update: (value: Preferences) => void
): PreferenceField {
  return <K extends keyof Preferences>(key: K): WritableComputedRef<Preferences[K]> =>
    computed({
      get: () => preferences()[key],
      set: (value) => update({ ...preferences(), [key]: value }),
    });
}
