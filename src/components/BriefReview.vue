<template>
  <div class="brief-review">
    <section
      v-for="(section, index) in sections"
      :key="section.title"
      :aria-labelledby="'review-section-' + index"
    >
      <header>
        <h3 :id="'review-section-' + index">{{ section.title }}</h3>
        <button
          type="button"
          class="text-button"
          :aria-label="'Edit ' + section.title"
          @click="$emit('edit', index)"
        >
          Edit
          <span aria-hidden="true">↗</span>
        </button>
      </header>
      <dl>
        <div v-for="row in section.rows" :key="row[0]">
          <dt>{{ row[0] }}</dt>
          <dd class="preserve-lines">{{ row[1] }}</dd>
        </div>
      </dl>
    </section>
    <p class="small muted">
      Budget covers stays, meals, local transport and activities. Travel to the destination is
      extra. Suggestions and costs are estimates, so check details before making plans.
    </p>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import type { Preferences } from '@/types/travel';
import { reviewSections } from '@/domain/review';

const props = defineProps<{ preferences: Preferences }>();
defineEmits<{ (event: 'edit', step: number): void }>();
const sections = computed(() => reviewSections(props.preferences));
</script>
