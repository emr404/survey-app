<template>
  <div class="page" v-if="destination && batch">
    <router-link :to="store.state.compareIds.length >= 2 ? '/compare' : '/results'" class="back-link">← {{ store.state.compareIds.length >= 2 ? 'Back to comparison' : 'Back to the shortlist' }}</router-link>
    <header class="page-heading split-heading"><div><p class="eyebrow">{{ destination.country }} / A closer look</p><h1 tabindex="-1">Picture yourself<br />in {{ destination.name }}.</h1><p>See the fit. Question the assumptions. Then make the itinerary your own.</p></div><label class="compare-check"><input type="checkbox" :checked="store.state.compareIds.includes(destination.id)" @change="store.commit('TOGGLE_COMPARE', destination.id)" /> Compare {{ destination.name }}</label></header>
    <EvidenceNotice :mode="batch.result.mode" />
    <div v-if="stale" class="notice">Your brief has changed since this shortlist was created. Update your recommendations before generating a plan. <router-link to="/results" class="text-button">Review changes →</router-link></div>
    <div class="detail-layout"><section class="panel"><p class="eyebrow">A match, explained</p><h2>Why it could work for you</h2><ul class="reason-list large-reasons"><li v-for="reason in destination.matchReasons" :key="reason">{{ reason }}</li></ul><h3>What to make room for</h3><div class="preference-tags"><span v-for="highlight in destination.highlights" :key="highlight">{{ highlight }}</span></div><div class="tradeoff"><h3>Where you’d be compromising</h3><ul><li v-for="tradeoff in destination.tradeoffs" :key="tradeoff">{{ tradeoff }}</li></ul></div></section>
      <aside class="panel detail-estimates"><p class="eyebrow">Planning estimates, not quotes</p><dl><div><dt>Daily cost / person</dt><dd>{{ rangeLabel(destination.dailyCost.low, destination.dailyCost.high, batch.preferences.currency) }}</dd><p>{{ destination.costNote }}</p></div><div><dt>One-way journey</dt><dd>{{ destination.journeyHours === null ? 'Unknown' : 'About ' + destination.journeyHours + ' hours' }}</dd><p>{{ destination.journeyNote }}</p></div><div><dt>Seasonal conditions</dt><p>{{ destination.seasonNote }}</p></div><div><dt>Crowds</dt><p>{{ destination.crowdNote }}</p></div></dl></aside>
    </div>
    <section class="plan-cta panel"><div><p class="eyebrow">04 / From possibility to a plan</p><h2>{{ existingPlan ? 'Your plan is ready to keep shaping.' : 'Give this trip a little shape.' }}</h2><p>Build an editable {{ batch.preferences.days }}-day itinerary. You can remove, replace and reorder every activity before approving.</p><p v-if="store.state.itinerary && !existingPlan" class="small muted">A successful response will replace your current saved itinerary. Your existing plan stays safe if this request fails or is cancelled.</p></div><router-link v-if="existingPlan" to="/itinerary" class="button primary">Continue editing my plan →</router-link><button v-else @click="buildPlan" :disabled="stale || status === 'requesting'" class="button primary">Build my {{ batch.preferences.days }}-day itinerary →</button></section>
    <p v-if="serviceStatus.mode === 'live' && batch.result.mode === 'demo'" class="notice">The server is now in live mode. Creating this plan sends your saved brief and this demo destination to OpenAI.</p>
    <RequestStatus :status="status" :error="error" :mode="serviceStatus.mode" title="Waiting for your itinerary" @cancel="cancel" @retry="buildPlan" />
  </div>
  <div v-else class="page"><h1 tabindex="-1">This possibility isn’t in your shortlist.</h1><p>It may belong to an earlier set of results. Your saved plan is still available in “Your plan”.</p><router-link to="/results" class="button primary">Return to the shortlist →</router-link></div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from '@/store';
import { samePreferences, rangeLabel } from '@/domain/preferences';
import { createDraft } from '@/domain/itinerary';
import { getItinerary, useTravelRequest, serviceStatus } from '@/services/recommendations';
import { logChange } from '@/services/history';
import EvidenceNotice from '@/components/EvidenceNotice.vue';
import RequestStatus from '@/components/RequestStatus.vue';
const store = useStore(); const route = useRoute(); const router = useRouter();
const { status, error, run, cancel } = useTravelRequest();
const batch = computed(() => store.state.batch);
const destination = computed(() => batch.value?.result.destinations.find(d => d.id === route.params.id));
const stale = computed(() => !batch.value || !samePreferences(batch.value.preferences, store.state.preferences));
const existingPlan = computed(() => store.state.itinerary?.destination.id === destination.value?.id &&
  batch.value && samePreferences(store.state.itinerary.preferences, batch.value.preferences));
function buildPlan() {
  if (!destination.value || !batch.value || stale.value) return;
  const chosen = JSON.parse(JSON.stringify(destination.value));
  const preferences = JSON.parse(JSON.stringify(batch.value.preferences));
  run(signal => getItinerary(preferences, chosen, signal), result => {
    if (!samePreferences(preferences, store.state.preferences)) return;
    store.commit('SAVE_ITINERARY', createDraft(chosen, preferences, result));
    logChange('selection', `Chose ${chosen.name} and created a draft`, [`${preferences.days} days. Approval required before finalisation`]);
    router.push('/itinerary');
  }, Math.ceil(preferences.days / 7) * 60000 + 10000);
}
</script>
