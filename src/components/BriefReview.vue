<template>
  <div class="brief-review">
    <section v-for="(section, index) in sections" :key="section.title" :aria-labelledby="'review-section-' + index">
      <header><h3 :id="'review-section-' + index">{{ section.title }}</h3><button type="button" class="text-button" :aria-label="'Edit ' + section.title" @click="$emit('edit', index)">Edit <span aria-hidden="true">↗</span></button></header>
      <dl><div v-for="row in section.rows" :key="row[0]"><dt>{{ row[0] }}</dt><dd class="preserve-lines">{{ row[1] }}</dd></div></dl>
    </section>
    <p class="small muted">Budget covers stays, meals, local transport and activities. Travel to the destination is extra. Suggestions and costs are estimates, so check details before making plans.</p>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { countries } from '../../shared/countries';
import { Preferences } from '@/domain/types';
import { money, countLabel } from '@/domain/preferences';
const props = defineProps<{ preferences: Preferences }>();
defineEmits<{ (event: 'edit', step: number): void }>();
const countryName = (code: string) => countries.find(country => country.code === code)?.name || code;
const sections = computed(() => {
  const p = props.preferences;
  return [
    { title: 'Your trip', rows: [
      ['Departure', p.departure], ['Length & group', `${countLabel(p.days, 'day')}, ${countLabel(p.travellers, 'traveller')}`],
      ['Dates', p.timing === 'dates' ? p.startDate : `${p.season}, flexible dates`],
    ] },
    { title: 'Budget', rows: [
      ['Per person', `${money(p.dailyBudget, p.currency)} a day, ${money(p.dailyBudget * p.days, p.currency)} for the trip`],
      ['Group target', money(p.dailyBudget * p.days * p.travellers, p.currency)],
      ['Journey', `${p.transport}, ${p.maxJourneyHours === null ? 'no time limit set' : 'up to ' + countLabel(p.maxJourneyHours, 'hour') + ' door to door, one way'}`],
    ] },
    { title: 'Passports', rows: [
      ['Nationalities', p.passportCountries.map(countryName).join(', ') || 'Not provided. Entry requirements will need a separate check.'],
      ['Residence', p.residenceCountry ? countryName(p.residenceCountry) : 'Not specified'],
      ['Travel document', p.passportType === 'ordinary' ? 'Ordinary passport' : 'Other travel document'],
    ] },
    { title: 'Interests', rows: [
      ['What you enjoy', p.interests.join(', ')], ['Pace & crowds', `${p.pace}, ${p.crowds.toLowerCase()}`],
      ['Region', p.region], ['Things to consider', p.constraints || 'None added'],
    ] },
  ];
});
</script>
