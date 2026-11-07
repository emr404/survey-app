<template>
  <div class="page">
    <router-link to="/results" class="back-link">← Back to the shortlist</router-link>
    <header class="page-heading"><p class="eyebrow">03 / The same questions, side by side</p><h1 tabindex="-1">Find your kind<br />of compromise.</h1><p>There’s rarely one perfect choice. Compare what matters, then explore the destination you’d like to shape into a plan.</p></header>
    <template v-if="batch && destinations.length >= 2">
      <EvidenceNotice :mode="batch.result.mode" compact />
      <p v-if="stale" class="notice">These comparisons reflect your saved shortlist, before your pending preference changes. <router-link to="/results" class="text-button">Apply changes first →</router-link></p>
      <p class="small muted comparison-hint">On smaller screens, scroll the table sideways to compare. All estimates use {{ batch.preferences.currency }} and the same saved trip brief.</p>
      <div class="comparison-scroll" tabindex="0" role="region" aria-label="Destination comparison, scroll horizontally">
        <table><caption>Destination trade-offs. Unverified {{ batch.result.mode === 'demo' ? 'demo assumptions' : 'AI estimates' }}</caption><thead><tr><th scope="col">What matters</th><th v-for="destination in destinations" :key="destination.id" scope="col"><span class="eyebrow">{{ destination.country }}</span><h2>{{ destination.name }}</h2></th></tr></thead><tbody>
          <tr><th scope="row">Daily cost / person<span>Stays, meals, local transport & activities</span></th><td v-for="d in destinations" :key="d.id"><strong>{{ rangeLabel(d.dailyCost.low, d.dailyCost.high, batch.preferences.currency) }}</strong><span class="small muted">Illustrative estimate, excluding travel to destination</span></td></tr>
          <tr><th scope="row">One-way journey<span>Door-to-door estimate</span></th><td v-for="d in destinations" :key="d.id"><strong>{{ d.journeyHours === null ? 'Unknown' : 'About ' + d.journeyHours + ' hours' }}</strong><p>{{ d.journeyNote }}</p></td></tr>
          <tr><th scope="row">Fit with your interests</th><td v-for="d in destinations" :key="d.id">{{ d.matchReasons[0] }}</td></tr>
          <tr><th scope="row">Season & conditions</th><td v-for="d in destinations" :key="d.id">{{ d.seasonNote }}</td></tr>
          <tr><th scope="row">Crowds</th><td v-for="d in destinations" :key="d.id">{{ d.crowdNote }}</td></tr>
          <tr><th scope="row">The compromise</th><td v-for="d in destinations" :key="d.id"><ul><li v-for="tradeoff in d.tradeoffs" :key="tradeoff">{{ tradeoff }}</li></ul></td></tr>
          <tr><th scope="row">Your next step</th><td v-for="d in destinations" :key="d.id"><router-link :to="'/destination/' + d.id" class="button primary">Explore {{ d.name }} →</router-link><button class="text-button" @click="remove(d.id)" :aria-label="'Remove ' + d.name + ' from comparison'">Remove from comparison</button></td></tr>
        </tbody></table>
      </div>
    </template>
    <section v-else class="panel empty-state"><h2>Pick a couple of possibilities.</h2><p>Select at least two destinations on your shortlist to compare them here. Your results and previous selections are saved.</p><router-link to="/results" class="button primary">Choose destinations →</router-link></section>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from '@/store';
import { rangeLabel, samePreferences } from '@/domain/preferences';
import EvidenceNotice from '@/components/EvidenceNotice.vue';
const store = useStore();
const batch = computed(() => store.state.batch);
const destinations = computed(() => batch.value?.result.destinations.filter(d => store.state.compareIds.includes(d.id)) || []);
const stale = computed(() => batch.value && !samePreferences(batch.value.preferences, store.state.preferences));
function remove(id: string) { store.commit('TOGGLE_COMPARE', id); }
</script>
