<template>
  <fieldset>
    <legend class="sr-only">The essentials</legend>
    <div class="field">
      <label for="departure">Where are you leaving from?</label>
      <input
        id="departure"
        v-model="form.departure"
        maxlength="100"
        autocomplete="address-level2"
        placeholder="City or airport, e.g. London"
        :aria-invalid="!!errors.departure && submitted"
        aria-describedby="departure-help departure-error"
      />
      <p id="departure-help" class="field-help">So journey estimates have a starting point.</p>
      <p id="departure-error" v-if="submitted && errors.departure" class="field-error">
        {{ errors.departure }}
      </p>
    </div>
    <div class="field-grid">
      <div class="field">
        <label for="days">Trip length</label>
        <div class="input-suffix">
          <input
            :aria-invalid="submitted && !!errors.days"
            aria-describedby="days-help days-error"
            id="days"
            :value="form.days"
            @input="setNumber('days', $event)"
            type="number"
            min="1"
            step="1"
            inputmode="numeric"
          />
          <span>{{ form.days === 1 ? 'day' : 'days' }}</span>
        </div>
        <p id="days-help" class="field-help">Include your travel days. Enter a whole number.</p>
        <p v-if="submitted && errors.days" id="days-error" class="field-error">{{ errors.days }}</p>
      </div>
      <div class="field">
        <label for="travellers">Travellers</label>
        <input
          :aria-invalid="submitted && !!errors.travellers"
          aria-describedby="travellers-help travellers-error"
          id="travellers"
          :value="form.travellers"
          @input="setNumber('travellers', $event)"
          type="number"
          min="1"
          step="1"
          inputmode="numeric"
        />
        <p id="travellers-help" class="field-help">All budget amounts start per person.</p>
        <p v-if="submitted && errors.travellers" id="travellers-error" class="field-error">
          {{ errors.travellers }}
        </p>
      </div>
    </div>
    <div class="field-grid">
      <div class="field">
        <label for="timing">How fixed are your dates?</label>
        <select
          :aria-invalid="submitted && !!errors.timing"
          aria-errormessage="timing-error"
          id="timing"
          v-model="form.timing"
        >
          <option value="flexible">I’m flexible</option>
          <option value="dates">I have a departure date</option>
        </select>
        <p v-if="submitted && errors.timing" id="timing-error" class="field-error">
          {{ errors.timing }}
        </p>
      </div>
      <div class="field" v-if="form.timing === 'dates'">
        <label for="startDate">Departure date</label>
        <input
          id="startDate"
          type="date"
          v-model="form.startDate"
          :aria-invalid="!!errors.startDate && submitted"
          aria-describedby="date-error"
        />
        <p id="date-error" v-if="submitted && errors.startDate" class="field-error">
          {{ errors.startDate }}
        </p>
      </div>
      <div class="field" v-else>
        <label for="season">Preferred season</label>
        <select
          :aria-invalid="submitted && !!errors.season"
          aria-errormessage="season-error"
          id="season"
          v-model="form.season"
        >
          <option v-for="season in seasons" :key="season">{{ season }}</option>
        </select>
        <p v-if="submitted && errors.season" id="season-error" class="field-error">
          {{ errors.season }}
        </p>
      </div>
    </div>
  </fieldset>
</template>
<script setup lang="ts">
import { reactive } from 'vue';
import type { Preferences } from '@/types/travel';
import type { PreferenceSectionProps } from '@/types/brief';
import { usePreferenceField } from '@/composables/usePreferenceField';
import { seasons } from '@/domain/options';
import { inputValue } from '@/domain/events';
const props = defineProps<PreferenceSectionProps>();
const emit = defineEmits<{ (event: 'update', value: Preferences): void }>();
const field = usePreferenceField(
  () => props.preferences,
  (value) => emit('update', value)
);
const form = reactive({
  departure: field('departure'),
  days: field('days'),
  travellers: field('travellers'),
  timing: field('timing'),
  startDate: field('startDate'),
  season: field('season'),
});

function setNumber(key: 'days' | 'travellers', event: Event): void {
  form[key] = Number(inputValue(event));
}
</script>
