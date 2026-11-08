<template>
  <fieldset>
    <legend class="sr-only">Your comfort zone</legend>
    <div class="field-grid">
      <div class="field">
        <label for="dailyBudget">Daily budget per person</label>
        <input
          id="dailyBudget"
          :value="form.dailyBudget"
          @input="setNumber('dailyBudget', $event)"
          type="number"
          min="1"
          max="10000"
          inputmode="decimal"
          aria-describedby="budget-help budget-error"
          :aria-invalid="!!errors.dailyBudget && submitted"
        />
        <p id="budget-error" v-if="submitted && errors.dailyBudget" class="field-error">
          {{ errors.dailyBudget }}
        </p>
      </div>
      <div class="field">
        <label for="currency">Currency</label>
        <select
          :aria-invalid="submitted && !!errors.currency"
          aria-errormessage="currency-error"
          id="currency"
          v-model="form.currency"
        >
          <option value="GBP">GBP (British pound)</option>
          <option value="EUR">EUR (Euro)</option>
          <option value="USD">USD (US dollar)</option>
        </select>
        <p v-if="submitted && errors.currency" id="currency-error" class="field-error">
          {{ errors.currency }}
        </p>
      </div>
    </div>
    <p id="budget-help" class="field-help budget-help">
      Includes stays, meals, local transport and activities. Excludes travel to your destination. No
      live currency conversion.
    </p>
    <div class="field-grid">
      <div class="field">
        <label for="transport">Preferred transport</label>
        <select
          :aria-invalid="submitted && !!errors.transport"
          aria-errormessage="transport-error"
          id="transport"
          v-model="form.transport"
        >
          <option>Any transport</option>
          <option>Flight</option>
          <option>Train</option>
        </select>
        <p v-if="submitted && errors.transport" id="transport-error" class="field-error">
          {{ errors.transport }}
        </p>
      </div>
      <div class="field">
        <label for="maxJourneyHours">Maximum one-way journey</label>
        <select
          :aria-invalid="submitted && !!errors.maxJourneyHours"
          aria-errormessage="maxJourneyHours-error"
          id="maxJourneyHours"
          v-model="form.maxJourneyHours"
        >
          <option :value="null">No limit set</option>
          <option v-for="hours in journeyLimits" :key="hours" :value="hours">
            Up to {{ countLabel(hours, 'hour') }}
          </option>
          <option
            v-if="form.maxJourneyHours !== null && !journeyLimits.includes(form.maxJourneyHours)"
            :value="form.maxJourneyHours"
          >
            Up to {{ countLabel(form.maxJourneyHours, 'hour') }}
          </option>
        </select>
        <p
          v-if="submitted && errors.maxJourneyHours"
          id="maxJourneyHours-error"
          class="field-error"
        >
          {{ errors.maxJourneyHours }}
        </p>
      </div>
    </div>
    <p class="field-help">Journey limits mean door to door, including connections and transfers.</p>
  </fieldset>
</template>
<script setup lang="ts">
import { reactive } from 'vue';
import type { Preferences } from '@/types/travel';
import type { PreferenceSectionProps } from '@/types/brief';
import { usePreferenceField } from '@/composables/usePreferenceField';
import { countLabel } from '@/domain/preferences';
import { journeyLimits } from '@/domain/options';
import { inputValue } from '@/domain/events';
const props = defineProps<PreferenceSectionProps>();
const emit = defineEmits<{ (event: 'update', value: Preferences): void }>();
const field = usePreferenceField(
  () => props.preferences,
  (value) => emit('update', value)
);
const form = reactive({
  dailyBudget: field('dailyBudget'),
  currency: field('currency'),
  transport: field('transport'),
  maxJourneyHours: field('maxJourneyHours'),
});
function setNumber(key: 'dailyBudget', event: Event): void {
  form[key] = Number(inputValue(event));
}
</script>
