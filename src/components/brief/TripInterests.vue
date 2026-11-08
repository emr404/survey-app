<template>
  <fieldset id="interests">
    <legend class="sr-only">What makes it your kind of trip?</legend>
    <p class="field-help">Choose a few interests. You can change these later.</p>
    <div class="interest-options" :class="{ 'has-error': submitted && !!errors.interests }">
      <label
        v-for="interest in interests"
        :key="interest"
        :class="{ chosen: form.interests.includes(interest) }"
      >
        <input
          :aria-invalid="submitted && !!errors.interests"
          aria-describedby="interests-error"
          type="checkbox"
          :value="interest"
          v-model="form.interests"
        />
        <span>{{ interest }}</span>
      </label>
    </div>
    <p id="interests-error" v-if="submitted && errors.interests" class="field-error">
      {{ errors.interests }}
    </p>
    <div class="field-grid">
      <div class="field">
        <label for="pace">Your pace</label>
        <select
          :aria-invalid="submitted && !!errors.pace"
          aria-errormessage="pace-error"
          id="pace"
          v-model="form.pace"
        >
          <option>Relaxed</option>
          <option>Balanced</option>
          <option>Active</option>
        </select>
        <p v-if="submitted && errors.pace" id="pace-error" class="field-error">{{ errors.pace }}</p>
      </div>
      <div class="field">
        <label for="crowds">Crowds</label>
        <select
          :aria-invalid="submitted && !!errors.crowds"
          aria-errormessage="crowds-error"
          id="crowds"
          v-model="form.crowds"
        >
          <option>No preference</option>
          <option>Quieter places</option>
        </select>
        <p v-if="submitted && errors.crowds" id="crowds-error" class="field-error">
          {{ errors.crowds }}
        </p>
      </div>
    </div>
    <div class="field">
      <label for="region">Where are you drawn to?</label>
      <select
        :aria-invalid="submitted && !!errors.region"
        aria-errormessage="region-error"
        id="region"
        v-model="form.region"
      >
        <option v-for="region in regions" :key="region">{{ region }}</option>
      </select>
      <p v-if="submitted && errors.region" id="region-error" class="field-error">
        {{ errors.region }}
      </p>
    </div>
    <div class="field">
      <label for="constraints">
        Anything we should work around?
        <span class="optional">Optional</span>
      </label>
      <textarea
        :aria-invalid="submitted && !!errors.constraints"
        aria-errormessage="constraints-error"
        id="constraints"
        v-model="form.constraints"
        rows="3"
        maxlength="1500"
        placeholder="Accessibility needs, things to avoid, dietary preferences, or a must-have…"
        aria-describedby="constraints-help"
      />
      <p v-if="submitted && errors.constraints" id="constraints-error" class="field-error">
        {{ errors.constraints }}
      </p>
      <p id="constraints-help" class="field-help">Share only what you want used for planning.</p>
    </div>
  </fieldset>
</template>
<script setup lang="ts">
import { reactive } from 'vue';
import type { Preferences } from '@/types/travel';
import type { PreferenceSectionProps } from '@/types/brief';
import { interests, regions } from '@/domain/options';
import { usePreferenceField } from '@/composables/usePreferenceField';
const props = defineProps<PreferenceSectionProps>();
const emit = defineEmits<{ (event: 'update', value: Preferences): void }>();
const field = usePreferenceField(
  () => props.preferences,
  (value) => emit('update', value)
);
const form = reactive({
  interests: field('interests'),
  pace: field('pace'),
  crowds: field('crowds'),
  region: field('region'),
  constraints: field('constraints'),
});
</script>
