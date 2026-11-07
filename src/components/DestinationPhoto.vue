<template>
  <figure v-if="!hideUnavailable || pending || (photo && !failed)" class="destination-photo">
    <div class="photo-frame" :class="{ 'photo-pending': pending }" :aria-busy="pending">
      <img v-if="photo && !failed" :src="photo.url" :alt="photo.alt" decoding="async" @error="failed = true" />
      <span v-else class="photo-placeholder">{{ pending ? 'Loading photograph' : 'Photograph unavailable' }}</span>
    </div>
    <figcaption v-if="photo && !failed"><a :href="photo.sourceUrl" target="_blank" rel="noopener noreferrer">Photo: {{ photo.author }}</a><span> / </span><a :href="photo.licenseUrl" target="_blank" rel="noopener noreferrer">{{ photo.license }}</a><span> / cropped</span></figcaption>
  </figure>
</template>
<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue';
import { getDestinationPhoto, DestinationImage } from '@/services/photos';
const props = defineProps<{ name: string; country: string; hideUnavailable?: boolean }>();
const photo = ref<DestinationImage | null>(null); const pending = ref(true); const failed = ref(false);
let controller: AbortController | null = null;
watch(() => [props.name, props.country], async () => {
  controller?.abort(); const current = new AbortController(); controller = current;
  photo.value = null; pending.value = true; failed.value = false;
  try { const result = await getDestinationPhoto(props.name, props.country, current.signal); if (!current.signal.aborted) photo.value = result; }
  finally { if (!current.signal.aborted) pending.value = false; }
}, { immediate: true });
onBeforeUnmount(() => controller?.abort());
</script>
