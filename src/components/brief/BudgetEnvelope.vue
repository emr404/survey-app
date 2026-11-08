<template>
  <aside class="preference-aside">
    <div class="budget-card">
      <p class="eyebrow">Your planning envelope</p>
      <template v-if="hasBudget">
        <p class="budget-figure">
          {{ money(preferences.dailyBudget * preferences.days, preferences.currency) }}
        </p>
        <p>per person for {{ countLabel(preferences.days, 'day') }}</p>
      </template>
      <p v-else class="small">
        Add a valid trip length, group size and daily budget to see your target.
      </p>
      <hr />
      <p v-if="hasBudget">
        <strong>
          {{
            money(
              preferences.dailyBudget * preferences.days * preferences.travellers,
              preferences.currency
            )
          }}
        </strong>
        for your group of {{ preferences.travellers }}
      </p>
      <p class="small">Travel to your destination is extra. This is your target, not a quote.</p>
    </div>
    <router-link v-if="hasResults" to="/results" class="text-button">
      Return to saved recommendations →
    </router-link>
  </aside>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import type { Preferences } from '@/types/travel';
import { countLabel, money } from '@/domain/preferences';

const props = defineProps<{
  preferences: Preferences;
  errors: Record<string, string>;
  hasResults: boolean;
}>();
const hasBudget = computed(
  () => !['days', 'travellers', 'dailyBudget', 'currency'].some((key) => props.errors[key])
);
</script>
