<template>
  <details v-if="entries.length" class="history panel">
    <summary>Your decisions <span class="muted">{{ entries.length }} recorded</span></summary>
    <p class="small muted">A local record of requested refinements, edits and approvals. These timestamps record your actions, not verification of travel information.</p>
    <ol><li v-for="entry in [...entries].reverse()" :key="entry.id"><div><strong>{{ entry.label }}</strong><time :datetime="entry.at">{{ new Date(entry.at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) }}</time></div><ul v-if="entry.changes.length"><li v-for="(change, i) in entry.changes" :key="i">{{ change }}</li></ul></li></ol>
  </details>
</template>
<script setup lang="ts">
import { HistoryEntry } from '@/domain/types';
defineProps<{ entries: HistoryEntry[] }>();
</script>
