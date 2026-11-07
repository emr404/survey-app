<template>
  <div class="page" v-if="destination && batch">
    <router-link to="/results" class="back-link">← Back to recommendations</router-link>
    <header class="page-heading split-heading"><div><p class="eyebrow">{{ destination.country }} / A closer look</p><h1 tabindex="-1">Picture yourself<br />in {{ destination.name }}.</h1><p>Explore the highlights, costs and practical details.</p></div></header>
    <div v-if="stale" class="notice">Your brief has changed since this shortlist was created. Update your recommendations to match your new preferences. <router-link to="/results" class="text-button">Review changes →</router-link></div>
    <article class="panel destination-overview" aria-label="Destination overview">
      <DestinationPhoto :name="destination.name" :country="destination.country" class="overview-photo" hide-unavailable />
      <div class="destination-overview-body">
        <section aria-labelledby="trip-estimates-heading">
          <h2 id="trip-estimates-heading" class="eyebrow">Your trip at a glance</h2>
          <p class="overview-estimate-label">Planning estimates, not live quotes.</p>
          <dl class="destination-facts">
            <div><dt>Daily cost per person</dt><dd>{{ rangeLabel(destination.dailyCost.low, destination.dailyCost.high, batch.preferences.currency) }}<p>{{ destination.costNote }}</p></dd></div>
            <div><dt>One-way journey</dt><dd>{{ destination.journeyHours === null ? 'Not yet known' : 'About ' + countLabel(destination.journeyHours, 'hour') }}<p>{{ destination.journeyNote }}</p></dd></div>
          </dl>
        </section>
        <div class="destination-story">
          <section aria-labelledby="destination-fit-heading">
            <h2 id="destination-fit-heading">Why it could work for you</h2>
            <ul class="reason-list overview-reasons"><li v-for="reason in destination.matchReasons" :key="reason">{{ reason }}</li></ul>
            <h3>Make room for</h3>
            <ul class="overview-highlights" aria-label="Destination highlights"><li v-for="highlight in destination.highlights" :key="highlight">{{ highlight }}</li></ul>
          </section>
          <section class="destination-conditions" aria-labelledby="destination-conditions-heading">
            <h2 id="destination-conditions-heading">When you’re there</h2>
            <dl><div><dt>Seasonal conditions</dt><dd>{{ destination.seasonNote }}</dd></div><div><dt>Crowds</dt><dd>{{ destination.crowdNote }}</dd></div></dl>
          </section>
        </div>
        <section class="overview-tradeoffs" aria-labelledby="destination-tradeoffs-heading">
          <h2 id="destination-tradeoffs-heading">The trade-offs</h2>
          <ul><li v-for="tradeoff in destination.tradeoffs" :key="tradeoff">{{ tradeoff }}</li></ul>
        </section>
        <VisaAdvice :advice="destination.visaAdvice" :preferences="batch.preferences" expanded />
      </div>
    </article>
  </div>
  <div v-else class="page"><h1 tabindex="-1">This possibility isn’t in your shortlist.</h1><p>It may belong to an earlier set of results.</p><router-link to="/results" class="button primary">Return to the shortlist →</router-link></div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from '@/store';
import { samePreferences, rangeLabel, countLabel } from '@/domain/preferences';
import VisaAdvice from '@/components/VisaAdvice.vue';
import DestinationPhoto from '@/components/DestinationPhoto.vue';
const store = useStore(); const route = useRoute();
const batch = computed(() => store.state.batch);
const destination = computed(() => batch.value?.result.destinations.find(d => d.id === route.params.id));
const stale = computed(() => !batch.value || !samePreferences(batch.value.preferences, store.state.preferences));
</script>
