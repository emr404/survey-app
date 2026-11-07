<template>
  <TravelBackdrop />
  <a class="skip-link" href="#main-content">Skip to content</a>
  <header class="app-header">
    <router-link to="/" class="brand"><span class="brand-mark"><BrandMark /></span> Talaria<span class="brand-caption">A plan you make your own.</span></router-link>
    <span class="pill" v-if="serviceStatus.checked">{{ serviceStatus.mode === 'demo' ? 'Local demo' : serviceStatus.mode === 'live' ? 'AI mode' : 'Offline' }}</span>
  </header>
  <nav class="journey-nav" aria-label="Trip planning stages">
    <ol>
      <li v-for="(stage, i) in stages" :key="stage.path">
        <router-link v-if="stage.available" :to="stage.path" :aria-current="activeStage === i ? 'step' : undefined" :class="{ active: activeStage === i }"><span>{{ i + 1 }}</span>{{ stage.label }}</router-link>
        <span v-else class="unavailable"><span>{{ i + 1 }}</span>{{ stage.label }}</span>
      </li>
    </ol>
  </nav>
  <div v-if="!store.state.storageAvailable" class="notice global-notice" role="status">Browser storage is unavailable. Your work lasts only until this page is refreshed.</div>
  <main id="main-content" tabindex="-1"><router-view /></main>
  <footer class="app-footer"><div class="footer-brand"><BrandMark /><small>© {{ year }} Talaria</small></div></footer>
</template>
<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from '@/store';
import { serviceStatus, checkService } from '@/services/recommendations';
import TravelBackdrop from '@/components/TravelBackdrop.vue';
import BrandMark from '@/components/BrandMark.vue';
const store = useStore();
const route = useRoute();
const year = new Date().getFullYear();
const activeStage = computed(() => route.path === '/' || route.path === '/preview' ? 0 : route.path === '/compare' ? 2 : route.path === '/itinerary' ? 3 : 1);
const stages = computed(() => [
  { path: '/', label: 'Your trip', available: true },
  { path: '/results', label: 'Discover', available: !!store.state.batch },
  { path: '/compare', label: 'Compare', available: store.state.compareIds.length >= 2 },
  { path: '/itinerary', label: 'Your plan', available: !!store.state.itinerary },
]);
function pointerInput() { document.documentElement.dataset.inputMethod = 'pointer'; }
function keyboardInput(event: KeyboardEvent) {
  if (['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) document.documentElement.dataset.inputMethod = 'keyboard';
}
onMounted(() => {
  checkService();
  document.addEventListener('pointerdown', pointerInput, true);
  document.addEventListener('keydown', keyboardInput, true);
});
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', pointerInput, true);
  document.removeEventListener('keydown', keyboardInput, true);
});
watch(() => route.fullPath, async () => { await nextTick(); document.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true }); });
</script>
