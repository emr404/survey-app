<template>
  <section v-if="status === 'requesting'" class="request-state panel" aria-live="polite" aria-busy="true">
    <span class="request-mark" aria-hidden="true">✳</span><div><h2>{{ title }}</h2><p>{{ mode === 'demo' ? 'Waiting for the local demo response. No AI model or research tools are running.' : 'Waiting for the model response. No live search or research tools are running.' }}</p><p class="muted small">The response will be checked before it appears.</p></div>
    <button class="button secondary" @click="$emit('cancel')">Cancel request</button>
  </section>
  <section v-else-if="status === 'error'" class="panel error-state" role="alert"><h2>A small detour.</h2><p>{{ error }}</p><button class="button primary" @click="$emit('retry')">Retry request</button></section>
  <section v-else-if="status === 'cancelled'" class="notice" role="status"><p>Request cancelled. Your preferences and previous work are unchanged.</p><button class="text-button" @click="$emit('retry')">Try again</button></section>
</template>
<script setup lang="ts">
defineProps<{ status: string; title: string; mode: string; error: string }>();
defineEmits<{ (event: 'cancel'): void; (event: 'retry'): void }>();
</script>
