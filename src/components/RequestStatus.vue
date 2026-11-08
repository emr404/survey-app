<template>
  <section
    v-if="status === 'requesting'"
    class="request-state panel recommendation-loading"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <div class="loading-emblem" aria-hidden="true">
      <span class="loading-orbit"></span>
      <BrandMark />
    </div>
    <h2>{{ title }}</h2>
    <p>Finding places that fit your trip.</p>
    <p class="loading-invocation">May Hermes guide your next adventure.</p>
    <button class="button secondary" @click="$emit('cancel')">Cancel request</button>
  </section>
  <section v-else-if="status === 'error'" class="panel error-state" role="alert">
    <h2>We hit a small detour.</h2>
    <p>{{ error }}</p>
    <button class="button primary" @click="$emit('retry')">Try again</button>
  </section>
  <section v-else-if="status === 'cancelled'" class="notice" role="status">
    <p>Request cancelled. Your preferences and previous results are saved.</p>
    <button class="text-button" @click="$emit('retry')">Try again</button>
  </section>
</template>
<script setup lang="ts">
import type { RequestStatus } from '@/types/requests';
import BrandMark from './BrandMark.vue';
defineProps<{ status: RequestStatus; title: string; error: string }>();
defineEmits<{ (event: 'cancel'): void; (event: 'retry'): void }>();
</script>
