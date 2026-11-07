<template>
  <div class="page narrow-page">
    <router-link to="/" class="back-link">← Edit your trip</router-link>
    <header class="page-heading"><p class="eyebrow">Your brief, before we begin</p><h1 tabindex="-1">Does this feel like you?</h1><p>A quick check before turning your preferences into possibilities.</p></header>
    <section class="panel"><div class="section-heading"><h2>Your trip brief</h2><router-link to="/" class="text-button">Edit preferences</router-link></div><PreferenceSummary :preferences="preferences" /></section>
    <section v-if="Object.keys(errors).length" class="notice" role="alert"><h2>Your brief needs a little more detail.</h2><ul><li v-for="(error, field) in errors" :key="field">{{ error }}</li></ul><router-link to="/" class="text-button">Complete your preferences →</router-link></section>
    <section v-if="changes.length" class="panel pending-panel"><p class="eyebrow">Changes since your last shortlist</p><ul><li v-for="change in changes" :key="change">{{ change }}</li></ul><p class="small muted">Previous results stay saved until a new response is successfully checked.</p></section>
    <EvidenceNotice v-if="serviceStatus.checked && serviceStatus.mode !== 'unknown'" :mode="serviceStatus.mode === 'live' ? 'live' : 'demo'" />
    <p class="notice" v-if="serviceStatus.error" role="status">{{ serviceStatus.error }} <button class="text-button" @click="checkService">Check connection</button></p>
    <div class="actions end"><router-link v-if="store.state.batch" to="/results" class="button secondary">View saved results</router-link><button class="button primary" @click="begin" :disabled="!!Object.keys(errors).length || !serviceStatus.checked || !serviceStatus.available">{{ serviceStatus.mode === 'live' ? 'Get AI recommendations' : 'Explore demo recommendations' }} →</button></div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from '@/store';
import { describeChanges, issuesFor } from '@/domain/preferences';
import { serviceStatus, checkService } from '@/services/recommendations';
import PreferenceSummary from '@/components/PreferenceSummary.vue';
import EvidenceNotice from '@/components/EvidenceNotice.vue';
const store = useStore(); const router = useRouter();
const preferences = computed(() => store.state.preferences);
const errors = computed(() => issuesFor(preferences.value));
const changes = computed(() => store.state.batch ? describeChanges(store.state.batch.preferences, preferences.value) : []);
function begin() { if (!Object.keys(errors.value).length && serviceStatus.available) router.push({ path: '/results', query: { generate: '1' } }); }
</script>
