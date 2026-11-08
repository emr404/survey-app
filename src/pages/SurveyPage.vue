<template>
  <div class="page preferences-page">
    <header class="page-heading"><p class="eyebrow">01 / Begin with what matters</p><h1 tabindex="-1">A good trip starts<br />with you.</h1><p>Tell us what matters. We’ll find a few places that fit.</p></header>
    <div class="preferences-layout">
      <form ref="formElement" class="panel preference-form" @submit.prevent="advance" novalidate>
        <nav class="brief-progress" aria-label="Trip brief steps">
          <ol><li v-for="(item, index) in briefSteps" :key="item.id"><button type="button" :aria-current="step === index ? 'step' : undefined" :class="{ active: step === index }" @click="navigate(index)"><span aria-hidden="true">{{ index + 1 }}</span>{{ item.label }}</button></li></ol>
        </nav>
        <div class="brief-step-heading"><p class="eyebrow">Step {{ step + 1 }} of {{ briefSteps.length }}</p><progress :value="step + 1" :max="briefSteps.length" aria-label="Trip brief progress" /><h2 ref="stepHeading" tabindex="-1">{{ briefSteps[step].title }}</h2><p>{{ briefSteps[step].description }}</p></div>
        <div v-if="submitted && Object.keys(visibleErrors).length" class="sr-only" role="alert">{{ Object.values(visibleErrors).join(' ') }}</div>
        <fieldset v-if="step === 0"><legend class="sr-only">The essentials</legend>
          <div class="field"><label for="departure">Where are you leaving from?</label><input id="departure" v-model="form.departure" maxlength="100" autocomplete="address-level2" placeholder="City or airport, e.g. London" :aria-invalid="!!errors.departure && submitted" aria-describedby="departure-help departure-error" /><p id="departure-help" class="field-help">So journey estimates have a starting point.</p><p id="departure-error" v-if="submitted && errors.departure" class="field-error">{{ errors.departure }}</p></div>
          <div class="field-grid"><div class="field"><label for="days">Trip length</label><div class="input-suffix"><input :aria-invalid="submitted && !!errors.days" aria-describedby="days-help days-error" id="days" :value="form.days" @input="setNumber('days', $event)" type="number" min="1" step="1" inputmode="numeric" /><span>{{ form.days === 1 ? 'day' : 'days' }}</span></div><p id="days-help" class="field-help">Include your travel days. Enter a whole number.</p><p v-if="submitted && errors.days" id="days-error" class="field-error">{{ errors.days }}</p></div><div class="field"><label for="travellers">Travellers</label><input :aria-invalid="submitted && !!errors.travellers" aria-describedby="travellers-help travellers-error" id="travellers" :value="form.travellers" @input="setNumber('travellers', $event)" type="number" min="1" step="1" inputmode="numeric" /><p id="travellers-help" class="field-help">All budget amounts start per person.</p><p v-if="submitted && errors.travellers" id="travellers-error" class="field-error">{{ errors.travellers }}</p></div></div>
          <div class="field-grid"><div class="field"><label for="timing">How fixed are your dates?</label><select :aria-invalid="submitted && !!errors.timing" aria-errormessage="timing-error" id="timing" v-model="form.timing"><option value="flexible">I’m flexible</option><option value="dates">I have a departure date</option></select><p v-if="submitted && errors.timing" id="timing-error" class="field-error">{{ errors.timing }}</p></div><div class="field" v-if="form.timing === 'dates'"><label for="startDate">Departure date</label><input id="startDate" type="date" v-model="form.startDate" :aria-invalid="!!errors.startDate && submitted" aria-describedby="date-error" /><p id="date-error" v-if="submitted && errors.startDate" class="field-error">{{ errors.startDate }}</p></div><div class="field" v-else><label for="season">Preferred season</label><select :aria-invalid="submitted && !!errors.season" aria-errormessage="season-error" id="season" v-model="form.season"><option v-for="season in seasons" :key="season">{{ season }}</option></select><p v-if="submitted && errors.season" id="season-error" class="field-error">{{ errors.season }}</p></div></div>
        </fieldset>
        <fieldset v-if="step === 1"><legend class="sr-only">Your comfort zone</legend>
          <div class="field-grid"><div class="field"><label for="dailyBudget">Daily budget per person</label><input id="dailyBudget" :value="form.dailyBudget" @input="setNumber('dailyBudget', $event)" type="number" min="1" max="10000" inputmode="decimal" aria-describedby="budget-help budget-error" :aria-invalid="!!errors.dailyBudget && submitted" /><p id="budget-error" v-if="submitted && errors.dailyBudget" class="field-error">{{ errors.dailyBudget }}</p></div><div class="field"><label for="currency">Currency</label><select :aria-invalid="submitted && !!errors.currency" aria-errormessage="currency-error" id="currency" v-model="form.currency"><option value="GBP">GBP (British pound)</option><option value="EUR">EUR (Euro)</option><option value="USD">USD (US dollar)</option></select><p v-if="submitted && errors.currency" id="currency-error" class="field-error">{{ errors.currency }}</p></div></div>
          <p id="budget-help" class="field-help budget-help">Includes stays, meals, local transport and activities. Excludes travel to your destination. No live currency conversion.</p>
          <div class="field-grid"><div class="field"><label for="transport">Preferred transport</label><select :aria-invalid="submitted && !!errors.transport" aria-errormessage="transport-error" id="transport" v-model="form.transport"><option>Any transport</option><option>Flight</option><option>Train</option></select><p v-if="submitted && errors.transport" id="transport-error" class="field-error">{{ errors.transport }}</p></div><div class="field"><label for="maxJourneyHours">Maximum one-way journey</label><select :aria-invalid="submitted && !!errors.maxJourneyHours" aria-errormessage="maxJourneyHours-error" id="maxJourneyHours" v-model="form.maxJourneyHours"><option :value="null">No limit set</option><option v-for="hours in [2, 3, 4, 5, 6, 8, 12, 18, 24]" :key="hours" :value="hours">Up to {{ countLabel(hours, 'hour') }}</option><option v-if="form.maxJourneyHours !== null && ![2,3,4,5,6,8,12,18,24].includes(form.maxJourneyHours)" :value="form.maxJourneyHours">Up to {{ countLabel(form.maxJourneyHours, 'hour') }}</option></select><p v-if="submitted && errors.maxJourneyHours" id="maxJourneyHours-error" class="field-error">{{ errors.maxJourneyHours }}</p></div></div>
          <p class="field-help">Journey limits mean door to door, including connections and transfers.</p>
        </fieldset>
        <fieldset v-if="step === 2"><legend class="sr-only">Passports & entry</legend><PassportFields :errors="submitted ? errors : {}" :preferences="form" @update="updatePassports" /></fieldset>
        <fieldset v-if="step === 3" id="interests"><legend class="sr-only">What makes it your kind of trip?</legend>
          <p class="field-help">Choose a few interests. You can change these later.</p>
          <div class="interest-options" :class="{ 'has-error': submitted && !!errors.interests }"><label v-for="interest in interests" :key="interest" :class="{ chosen: form.interests.includes(interest) }"><input :aria-invalid="submitted && !!errors.interests" aria-describedby="interests-error" type="checkbox" :value="interest" v-model="form.interests" /><span>{{ interest }}</span></label></div>
          <p id="interests-error" v-if="submitted && errors.interests" class="field-error">{{ errors.interests }}</p>
          <div class="field-grid"><div class="field"><label for="pace">Your pace</label><select :aria-invalid="submitted && !!errors.pace" aria-errormessage="pace-error" id="pace" v-model="form.pace"><option>Relaxed</option><option>Balanced</option><option>Active</option></select><p v-if="submitted && errors.pace" id="pace-error" class="field-error">{{ errors.pace }}</p></div><div class="field"><label for="crowds">Crowds</label><select :aria-invalid="submitted && !!errors.crowds" aria-errormessage="crowds-error" id="crowds" v-model="form.crowds"><option>No preference</option><option>Quieter places</option></select><p v-if="submitted && errors.crowds" id="crowds-error" class="field-error">{{ errors.crowds }}</p></div></div>
          <div class="field"><label for="region">Where are you drawn to?</label><select :aria-invalid="submitted && !!errors.region" aria-errormessage="region-error" id="region" v-model="form.region"><option v-for="region in regions" :key="region">{{ region }}</option></select><p v-if="submitted && errors.region" id="region-error" class="field-error">{{ errors.region }}</p></div>
          <div class="field"><label for="constraints">Anything we should work around? <span class="optional">Optional</span></label><textarea :aria-invalid="submitted && !!errors.constraints" aria-errormessage="constraints-error" id="constraints" v-model="form.constraints" rows="3" maxlength="1500" placeholder="Accessibility needs, things to avoid, dietary preferences, or a must-have…" aria-describedby="constraints-help" /><p v-if="submitted && errors.constraints" id="constraints-error" class="field-error">{{ errors.constraints }}</p><p id="constraints-help" class="field-help">Share only what you want used for planning.</p></div>
        </fieldset>
        <BriefReview v-if="step === reviewStep" :preferences="form" @edit="editSection" />
        <p v-if="step === reviewStep" class="brief-consent small muted">Selecting Find destinations sends this brief to the recommendation service. Planning only. No reservations or payments.</p>
        <div class="form-footer brief-actions">
          <button v-if="step > 0" class="button secondary" type="button" @click="navigate(step - 1)"><span aria-hidden="true">←</span> Back</button>
          <button class="button primary" type="submit">{{ step === reviewStep ? 'Find destinations' : returningToReview ? 'Save and review' : step === reviewStep - 1 ? 'Review your trip' : 'Continue' }} <span aria-hidden="true">→</span></button>
        </div>
        <p class="brief-save small muted">{{ store.state.storageAvailable ? 'Answers saved as you go on this device.' : 'Answers kept for this visit. Browser storage is unavailable.' }}</p>
      </form>
      <aside class="preference-aside"><div class="budget-card"><p class="eyebrow">Your planning envelope</p><p v-if="hasBudget" class="budget-figure">{{ money(form.dailyBudget * form.days, form.currency) }}</p><p v-if="hasBudget">per person for {{ countLabel(form.days, 'day') }}</p><p v-if="!hasBudget" class="small">Add a valid trip length, group size and daily budget to see your target.</p><hr /><p v-if="hasBudget"><strong>{{ money(form.dailyBudget * form.days * form.travellers, form.currency) }}</strong> for your group of {{ form.travellers }}</p><p class="small">Travel to your destination is extra. This is your target, not a quote.</p></div><router-link v-if="store.state.batch" to="/results" class="text-button">Return to saved recommendations →</router-link></aside>
    </div>
  </div>
</template>
<script setup lang="ts">
import { reactive, watch, computed, ref, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from '@/store';
import PassportFields from '@/components/PassportFields.vue';
import BriefReview from '@/components/BriefReview.vue';
import { briefSteps, reviewStep, stepIssues, firstInvalidStep, reachableStep } from '@/domain/brief';
import { Preferences } from '@/domain/types';
import { issuesFor, money, countLabel } from '@/domain/preferences';
const store = useStore();
const router = useRouter();
const route = useRoute();
const form = reactive<Preferences>(JSON.parse(JSON.stringify(store.state.preferences)));
const step = ref(reachableStep(form, route.query.step));
const stepHeading = ref<HTMLElement | null>(null);
const returningToReview = computed(() => route.query.returnTo === 'review');
const submitted = ref(false);
const formElement = ref<HTMLFormElement | null>(null);
const errors = computed(() => issuesFor(form));
const visibleErrors = computed(() => stepIssues(form, step.value));
const hasBudget = computed(() => !errors.value.days && !errors.value.travellers && !errors.value.dailyBudget && !errors.value.currency);
const seasons = ['Any season', 'Spring', 'Summer', 'Autumn', 'Winter'];
const interests = ['Coast', 'Culture', 'Food', 'Nature', 'Adventure', 'Cities'];
const regions = ['Anywhere', 'Europe', 'Asia', 'Africa', 'South America'];
watch(form, value => store.commit('SET_PREFERENCES', value), { deep: true, flush: 'sync' });
function updatePassports(value: Preferences) { Object.assign(form, value); }
function setNumber(key: 'days' | 'travellers' | 'dailyBudget', event: Event) { form[key] = Number((event.target as HTMLInputElement).value); }
// URLs retain the current step through refresh and browser Back. Guard forward
// navigation with the same domain rules used by Continue and final submission.
watch(() => route.query.step, async requested => {
  const target = reachableStep(form, requested);
  if (requested && briefSteps[target].id !== requested) {
    await router.replace({ path: '/', query: { step: briefSteps[target].id } });
  }
  step.value = target;
  submitted.value = false;
  await nextTick();
  if (requested !== undefined) stepHeading.value?.focus({ preventScroll: true });
}, { immediate: true });
async function focusError() {
  await nextTick();
  const invalid = formElement.value?.querySelector<HTMLElement>('input[aria-invalid="true"], select[aria-invalid="true"], textarea[aria-invalid="true"]');
  invalid?.focus({ preventScroll: true });
  invalid?.scrollIntoView({ block: 'center', behavior: 'auto' });
}
async function navigate(target: number, returnToReview = false) {
  const destination = reachableStep(form, briefSteps[target].id);
  await router.push({ path: '/', query: { step: briefSteps[destination].id, ...(returnToReview ? { returnTo: 'review' } : {}) } });
  if (destination < target) {
    submitted.value = true;
    await focusError();
  }
}
function editSection(index: number) { navigate(index, true); }
async function advance() {
  submitted.value = true;
  if (Object.keys(visibleErrors.value).length) { await focusError(); return; }
  if (step.value < reviewStep) {
    await navigate(returningToReview.value ? reviewStep : step.value + 1);
    return;
  }
  const invalid = firstInvalidStep(form);
  if (invalid >= 0) { await navigate(invalid); submitted.value = true; await focusError(); return; }
  store.commit('SET_PREFERENCES', form);
  await router.push('/results?generate=1');
}
</script>
