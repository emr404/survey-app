<template>
  <div class="passport-fields">
    <div class="field"><label for="passport-nationality">Passport nationality <span class="optional">Optional</span></label>
      <p id="passport-help" class="field-help">Choose the passport you’ll travel on. Add other nationalities if people in your group hold different passports. No passport numbers needed.</p>
      <div class="passport-picker"><select :aria-invalid="!!errors.passportCountries" aria-errormessage="passport-nationality-error" id="passport-nationality" v-model="selected" aria-describedby="passport-help" @change="addPassport"><option value="">Choose a nationality</option><option v-for="country in availableCountries" :key="country.code" :value="country.code">{{ country.name }}</option></select><p v-if="errors.passportCountries" id="passport-nationality-error" class="field-error">{{ errors.passportCountries }}</p></div>
      <ul v-if="preferences.passportCountries.length" class="passport-tags" aria-label="Selected passport nationalities"><li v-for="code in preferences.passportCountries" :key="code"><span>{{ countryName(code) }}</span><button type="button" :aria-label="'Remove ' + countryName(code) + ' passport'" @click="removePassport(code)">×</button></li></ul>
    </div>
    <div class="field-grid">
      <div class="field"><label for="residence-country">Country of residence <span class="optional">Optional</span></label><select :aria-invalid="!!errors.residenceCountry" aria-errormessage="residence-country-error" id="residence-country" :value="preferences.residenceCountry" @change="setResidence"><option value="">Not specified</option><option v-for="country in countries" :key="country.code" :value="country.code">{{ country.name }}</option></select><p v-if="errors.residenceCountry" id="residence-country-error" class="field-error">{{ errors.residenceCountry }}</p><p class="field-help">Residence and existing permits can affect entry rules. This is separate from your departure city.</p></div>
      <div class="field"><label for="passport-type">Travel document</label><select :aria-invalid="!!errors.passportType" aria-errormessage="passport-type-error" id="passport-type" :value="preferences.passportType" @change="setType"><option value="ordinary">Ordinary passport</option><option value="other">Other travel document</option></select><p v-if="errors.passportType" id="passport-type-error" class="field-error">{{ errors.passportType }}</p><p class="field-help">For refugee, emergency or other documents, check entry rules directly. For mixed residence or permit situations, add details below.</p></div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import { countries } from '../../shared/countries';
import { Preferences } from '@/domain/types';
const props = defineProps<{ preferences: Preferences; errors: Record<string, string> }>();
const emit = defineEmits<{ (event: 'update', value: Preferences): void }>();
const selected = ref('');
const availableCountries = computed(() => props.preferences.passportCountries.length >= 10 ? [] : countries.filter(country => !props.preferences.passportCountries.includes(country.code)));
function countryName(code: string) { return countries.find(country => country.code === code)?.name || code; }
function addPassport() {
  if (selected.value && availableCountries.value.some(country => country.code === selected.value)) emit('update', { ...props.preferences, passportCountries: [...props.preferences.passportCountries, selected.value] });
  selected.value = '';
}
function removePassport(code: string) { emit('update', { ...props.preferences, passportCountries: props.preferences.passportCountries.filter(value => value !== code) }); }
function setResidence(event: Event) { emit('update', { ...props.preferences, residenceCountry: (event.target as HTMLSelectElement).value }); }
function setType(event: Event) { emit('update', { ...props.preferences, passportType: (event.target as HTMLSelectElement).value as Preferences['passportType'] }); }
</script>
