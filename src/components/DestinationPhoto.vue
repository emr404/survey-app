<template>
  <figure v-if="!hideUnavailable || pending || (photo && !failed)" class="destination-photo">
    <div class="photo-frame" :class="{ 'photo-pending': pending }" :aria-busy="pending">
      <img
        v-if="photo && !failed"
        :src="photo.url"
        :alt="photo.alt"
        decoding="async"
        @error="imageFailed"
      />
      <span v-else class="photo-placeholder">
        {{ pending ? 'Loading photograph' : 'Photograph unavailable' }}
      </span>
    </div>
    <figcaption v-if="photo && !failed">
      <a :href="photo.sourceUrl" target="_blank" rel="noopener noreferrer">
        Photo: {{ photo.author }}
      </a>
      <span>/</span>
      <a :href="photo.licenseUrl" target="_blank" rel="noopener noreferrer">{{ photo.license }}</a>
      <span>/ cropped</span>
    </figcaption>
  </figure>
</template>
<script setup lang="ts">
import { useDestinationPhoto } from '@/composables/useDestinationPhoto';

const props = defineProps<{ name: string; country: string; hideUnavailable?: boolean }>();
const { photo, pending, failed, imageFailed } = useDestinationPhoto(() => ({
  name: props.name,
  country: props.country,
}));
</script>
