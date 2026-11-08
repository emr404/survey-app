<template>
  <TravelBackdrop />
  <a class="skip-link" href="#main-content">Skip to content</a>
  <header class="app-header">
    <router-link to="/" class="brand" aria-label="Talaria home">
      <span class="brand-mark"><BrandMark /></span>
    </router-link>
  </header>
  <nav class="journey-nav" aria-label="Trip planning stages">
    <ol>
      <li v-for="(stage, i) in stages" :key="stage.path">
        <router-link
          v-if="stage.available"
          :to="stage.path"
          :aria-current="activeStage === i ? 'step' : undefined"
          :class="{ active: activeStage === i }"
        >
          <span>{{ i + 1 }}</span>
          {{ stage.label }}
        </router-link>
        <span v-else class="unavailable">
          <span>{{ i + 1 }}</span>
          {{ stage.label }}
        </span>
      </li>
    </ol>
  </nav>
  <div v-if="!store.state.storageAvailable" class="notice global-notice" role="status">
    Browser storage is unavailable. Your work lasts only until this page is refreshed.
  </div>
  <main id="main-content" tabindex="-1"><router-view /></main>
  <footer class="app-footer">
    <small>Talaria © {{ year }}</small>
    <small>Powered by Groq</small>
  </footer>
</template>
<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from '@/store';
import TravelBackdrop from '@/components/TravelBackdrop.vue';
import BrandMark from '@/components/BrandMark.vue';
const store = useStore();
const route = useRoute();
const year = new Date().getFullYear();
const activeStage = computed(() => (route.path === '/' ? 0 : 1));
const stages = computed(() => [
  { path: '/', label: 'Your trip', available: true },
  { path: '/results', label: 'Recommendations', available: !!store.state.batch },
]);
function pointerInput(): void {
  document.documentElement.dataset.inputMethod = 'pointer';
}
function keyboardInput(event: KeyboardEvent): void {
  if (['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key))
    document.documentElement.dataset.inputMethod = 'keyboard';
}
onMounted(() => {
  document.addEventListener('pointerdown', pointerInput, true);
  document.addEventListener('keydown', keyboardInput, true);
});
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', pointerInput, true);
  document.removeEventListener('keydown', keyboardInput, true);
});
watch(
  () => route.path,
  async () => {
    await nextTick();
    document.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
  }
);
</script>
