<template>
  <dl class="preference-summary">
    <div><dt>Passport nationalities</dt><dd>{{ preferences.passportCountries.map(countryName).join(', ') || 'Not specified' }}{{ preferences.passportType === 'other' ? ', other travel document' : '' }}</dd></div>
    <div v-if="preferences.residenceCountry"><dt>Country of residence</dt><dd>{{ countryName(preferences.residenceCountry) }}</dd></div>
    <div><dt>Departing from</dt><dd>{{ preferences.departure || 'Not specified' }}</dd></div>
    <div><dt>When & how long</dt><dd>{{ countLabel(preferences.days, 'day') }}, {{ preferences.timing === 'dates' ? preferences.startDate : preferences.season === 'Any season' ? 'Flexible dates' : preferences.season + ', flexible dates' }}</dd></div>
    <div><dt>Daily budget</dt><dd>{{ money(preferences.dailyBudget, preferences.currency) }} / person</dd></div>
    <div><dt>Travellers</dt><dd>{{ countLabel(preferences.travellers, 'traveller') }}, {{ money(preferences.dailyBudget * preferences.days * preferences.travellers, preferences.currency) }} group trip target</dd></div>
    <div><dt>What you love</dt><dd>{{ preferences.interests.join(', ') || 'Choose your interests' }}, {{ preferences.pace.toLowerCase() }} pace</dd></div>
    <div><dt>Journey</dt><dd>{{ preferences.transport }}{{ preferences.maxJourneyHours ? ', up to ' + preferences.maxJourneyHours + 'h one way' : ', no time limit set' }}</dd></div>
    <div><dt>Region & crowds</dt><dd>{{ preferences.region }}. {{ preferences.crowds }}</dd></div>
    <div v-if="preferences.constraints" class="summary-wide"><dt>Constraints to consider</dt><dd class="preserve-lines">{{ preferences.constraints }}</dd></div>
  </dl>
  <p class="small muted">Budget covers accommodation, meals, local transport and activities. Travel to the destination is excluded. All estimates are per person unless labelled “group”.</p>
</template>
<script setup lang="ts">
import { countries } from '../../shared/countries';
import { Preferences } from '@/domain/types';
import { money, countLabel } from '@/domain/preferences';
function countryName(code: string) { return countries.find(country => country.code === code)?.name || code; }
defineProps<{ preferences: Preferences }>();
</script>
