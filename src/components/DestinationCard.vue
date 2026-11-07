<template>
  <article class="destination-card panel">
    <div class="destination-top"><span class="destination-number">0{{ index + 1 }}</span><span class="eyebrow">{{ destination.country }}</span></div>
    <h3><router-link :to="'/destination/' + destination.id">{{ destination.name }}</router-link></h3>
    <p class="card-label">Why this made your shortlist</p>
    <ul class="reason-list"><li v-for="reason in destination.matchReasons.slice(0, 2)" :key="reason">{{ reason }}</li></ul>
    <dl class="card-metrics"><div><dt>Estimated daily cost per person</dt><dd>{{ rangeLabel(destination.dailyCost.low, destination.dailyCost.high, preferences.currency) }}</dd></div><div><dt>Estimated one-way journey</dt><dd>{{ destination.journeyHours === null ? 'Not known' : 'About ' + destination.journeyHours + ' hours' }}</dd></div></dl>
    <div class="tradeoff"><h4>The trade-off</h4><p>{{ destination.tradeoffs[0] }}</p></div>
    <div class="card-actions"><router-link class="button secondary" :to="'/destination/' + destination.id">Explore {{ destination.name }} <span aria-hidden="true">↗</span></router-link>
    <label class="compare-check"><input type="checkbox" :checked="selected" @change="$emit('compare', destination.id)" /> Compare<span class="sr-only"> {{ destination.name }}</span></label></div>
  </article>
</template>
<script setup lang="ts">
import { Destination, Preferences } from '@/domain/types';
import { rangeLabel } from '@/domain/preferences';
defineProps<{ destination: Destination; preferences: Preferences; index: number; selected: boolean }>();
defineEmits<{ (event: 'compare', id: string): void }>();
</script>
