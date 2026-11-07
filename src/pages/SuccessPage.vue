<template>
  <div class="page">
    <header class="page-heading split-heading"><div><p class="eyebrow">02 / Possibilities, with perspective</p><h1 tabindex="-1">Somewhere that<br />feels like you.</h1><p>A shortlist to explore, not a decision made for you. Start with the fit, then look at the compromises.</p></div><router-link to="/" class="text-button">Edit your trip brief ↗</router-link></header>
    <section class="panel refinement-panel" aria-labelledby="refine-heading">
      <div><p class="eyebrow">Keep the conversation going</p><h2 id="refine-heading">What would make this a better fit?</h2></div>
      <div class="refinement-options"><button class="chip" @click="refine('quieter')" :disabled="status === 'requesting'">Less crowded</button><button class="chip" @click="refine('shorter')" :disabled="status === 'requesting'">Shorter journey</button><button class="chip" @click="refine('budget')" :disabled="status === 'requesting'">Lower budget −20%</button></div>
      <p class="small muted">These controls change your brief visibly. Nothing is sent until you choose “Update recommendations”.</p>
      <div v-if="pendingChanges.length" class="pending-changes"><h3>Changes ready to apply</h3><ul><li v-for="change in pendingChanges" :key="change">{{ change }}</li></ul><div class="actions"><button class="button primary" @click="generate" :disabled="status === 'requesting' || !!Object.keys(validationErrors).length">Update recommendations →</button><button class="text-button" @click="undoRefinements" :disabled="status === 'requesting'">Discard pending changes</button><router-link to="/" class="text-button">Edit the full brief</router-link></div></div>
      <details class="inline-preferences"><summary>View and edit refinement values</summary><div class="field-grid"><div class="field"><label for="refine-budget">Daily budget / person ({{ preferences.currency }})</label><input id="refine-budget" type="number" min="1" max="10000" :value="preferences.dailyBudget" @input="editBudget" :disabled="status === 'requesting'" /></div><div class="field"><label for="refine-journey">Maximum one-way journey</label><select id="refine-journey" :value="preferences.maxJourneyHours ?? ''" @change="editJourney" :disabled="status === 'requesting'"><option value="">No limit</option><option v-for="hour in journeyOptions" :key="hour" :value="hour">{{ hour }} hours</option></select></div><div class="field"><label for="refine-crowds">Crowds</label><select id="refine-crowds" :value="preferences.crowds" @change="editCrowds" :disabled="status === 'requesting'"><option>No preference</option><option>Quieter places</option></select></div></div><p v-for="(error, key) in validationErrors" :key="key" class="field-error">{{ error }}</p></details>
    </section>
    <RequestStatus :status="status" :error="error" :code="errorCode" title="Waiting for your recommendations" :mode="serviceStatus.mode" @cancel="cancel" @retry="generate" />
    <template v-if="batch">
      <EvidenceNotice :mode="batch.result.mode" compact />
      <div v-if="pendingChanges.length" class="notice" role="status">Showing your previous shortlist. It reflects the earlier brief until you update recommendations.</div>
      <section class="shortlist-intro"><p class="eyebrow">{{ batch.result.destinations.length }} possibilities. {{ batch.result.mode === 'demo' ? 'Simulated matches' : 'AI suggestions' }}</p><h2>{{ batch.result.destinations.length ? 'A starting point, with room to change.' : 'No suitable matches this time.' }}</h2><p>{{ batch.result.summary }}</p><details><summary>The brief behind these results</summary><PreferenceSummary :preferences="batch.preferences" /></details></section>
      <section v-if="batch.result.conflicts.length" class="notice" aria-label="Conflicts and limitations"><h3>Worth resolving together</h3><ul><li v-for="conflict in batch.result.conflicts" :key="conflict">{{ conflict }}</li></ul></section>
      <div v-if="batch.result.destinations.length" class="destination-grid"><DestinationCard v-for="(destination, i) in batch.result.destinations" :key="destination.id" :destination="destination" :preferences="batch.preferences" :index="i" :selected="store.state.compareIds.includes(destination.id)" @compare="toggleCompare" /></div>
      <section v-else class="panel empty-state"><span aria-hidden="true">↳</span><h2>Your constraints stay yours.</h2><p>No limits were relaxed automatically. Try changing one preference, or widen the region. The demo has a deliberately small catalogue.</p><router-link to="/" class="button secondary">Revisit the brief</router-link></section>
      <p v-if="batch.result.destinations.length > 0 && batch.result.destinations.length < 3" class="small muted partial-note" role="status">A partial shortlist: only {{ batch.result.destinations.length }} options were returned. We haven’t filled the space with weaker matches.</p>
      <div v-if="batch.result.destinations.length" class="comparison-bar"><div><strong>{{ store.state.compareIds.length }} selected for comparison</strong><p class="small muted">Choose 2–3 destinations to weigh the same criteria side by side.</p></div><router-link v-if="store.state.compareIds.length >= 2" to="/compare" class="button primary">Compare destinations →</router-link><span v-else class="small muted">Select at least two</span></div>
      <section class="panel planning-notes"><h2>A few things to check</h2><ul><li v-for="note in batch.result.notes" :key="note">{{ note }}</li></ul></section>
    </template>
    <section v-else-if="status !== 'requesting'" class="panel empty-state"><h2>Your shortlist starts with a brief.</h2><p>Review your preferences, then request a set of recommendations. No generation happens just from visiting this page.</p><router-link to="/preview" class="button primary">Review my trip →</router-link></section>
    <HistoryLog :entries="store.state.history" />
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from '@/store';
import { Preferences } from '@/domain/types';
import { Refinement, describeChanges, refinePreferences, samePreferences, issuesFor } from '@/domain/preferences';
import { getRecommendations, useTravelRequest, serviceStatus } from '@/services/recommendations';
import { logChange } from '@/services/history';
import DestinationCard from '@/components/DestinationCard.vue';
import EvidenceNotice from '@/components/EvidenceNotice.vue';
import RequestStatus from '@/components/RequestStatus.vue';
import PreferenceSummary from '@/components/PreferenceSummary.vue';
import HistoryLog from '@/components/HistoryLog.vue';
const store = useStore(); const route = useRoute(); const router = useRouter();
const { status, error, errorCode, run, cancel } = useTravelRequest();
const batch = computed(() => store.state.batch);
const preferences = computed(() => store.state.preferences);
const pendingChanges = computed(() => batch.value ? describeChanges(batch.value.preferences, preferences.value) : []);
const validationErrors = computed(() => issuesFor(preferences.value));
const journeyOptions = computed(() => [...new Set([1,2,3,4,5,6,8,12,18,24, preferences.value.maxJourneyHours].filter((value): value is number => value !== null))].sort((a,b) => a-b));
function refine(value: Refinement) { store.commit('SET_PREFERENCES', refinePreferences(preferences.value, value)); }
function undoRefinements() { if (batch.value) store.commit('SET_PREFERENCES', batch.value.preferences); }
function editBudget(event: Event) { store.commit('SET_PREFERENCES', { ...preferences.value, dailyBudget: Number((event.target as HTMLInputElement).value) }); }
function editJourney(event: Event) { const value = (event.target as HTMLSelectElement).value; store.commit('SET_PREFERENCES', { ...preferences.value, maxJourneyHours: value === '' ? null : Number(value) }); }
function editCrowds(event: Event) { store.commit('SET_PREFERENCES', { ...preferences.value, crowds: (event.target as HTMLSelectElement).value }); }
function toggleCompare(id: string) { store.commit('TOGGLE_COMPARE', id); }
function generate() {
  if (Object.keys(validationErrors.value).length) { router.push('/'); return; }
  const snapshot: Preferences = JSON.parse(JSON.stringify(preferences.value));
  const changes = [...pendingChanges.value];
  logChange(changes.length ? 'refinement' : 'preferences', changes.length ? 'Requested a revised shortlist' : 'Requested recommendations', changes);
  run(signal => getRecommendations(snapshot, signal), result => {
    if (samePreferences(snapshot, preferences.value)) store.commit('SAVE_RESULTS', { preferences: snapshot, result });
  });
}
watch(preferences, () => { if (status.value === 'requesting') cancel(); }, { deep: true });
onMounted(() => { if (route.query.generate === '1') { router.replace('/results'); generate(); } });
</script>
