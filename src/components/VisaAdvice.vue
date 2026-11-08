<template>
  <section class="visa-advice" aria-label="Passport and visa guidance">
    <p class="card-label">
      Visa guidance
      <span class="visa-qualifier">Preliminary</span>
    </p>
    <template v-if="preferences.passportCountries.length && advice.length">
      <ul class="visa-status-list">
        <li v-for="item in advice" :key="item.passportCountry">
          <strong>{{ countryName(item.passportCountry) }}</strong>
          <span>{{ statusLabel(item.status) }}</span>
        </li>
      </ul>
      <details :open="expanded">
        <summary>Entry details & checks</summary>
        <p v-for="item in advice" :key="item.passportCountry">
          <strong>{{ countryName(item.passportCountry) }}:</strong>
          {{ item.note }}
        </p>
        <p class="field-help">
          Not a live visa check. Confirm rules for your dates, residence, passport validity and
          transit, including any electronic travel authorisation. This assumes a holiday, not work
          or study.
        </p>
        <a
          href="https://www.iatatravelcentre.com/"
          target="_blank"
          rel="noopener noreferrer"
          class="text-button"
        >
          Check entry rules with IATA ↗
        </a>
      </details>
    </template>
    <p v-else class="field-help">
      Add your passport nationality to the trip brief for entry guidance.
    </p>
  </section>
</template>
<script setup lang="ts">
import { Preferences, VisaAdvice } from '@/types/travel';
import { countryName } from '@/domain/countries';
defineProps<{ advice: VisaAdvice[]; preferences: Preferences; expanded?: boolean }>();

function statusLabel(status: VisaAdvice['status']): string {
  return {
    visa_may_be_required: 'A visa may be needed',
    visa_exemption_may_apply: 'Visa exemption may apply',
    check_required: 'Entry rules need checking',
  }[status];
}
</script>
