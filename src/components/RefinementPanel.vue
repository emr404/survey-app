<template>
  <details class="panel refinement-panel" :open="pendingChanges.length > 0">
    <summary>Refine recommendations</summary>

    <div class="refinement-options">
      <button class="chip" @click="$emit('refine', 'quieter')" :disabled="status === 'requesting'">
        Less crowded
      </button>
      <button class="chip" @click="$emit('refine', 'shorter')" :disabled="status === 'requesting'">
        Shorter journey
      </button>
      <button class="chip" @click="$emit('refine', 'budget')" :disabled="status === 'requesting'">
        Lower budget −20%
      </button>
    </div>
    <p class="small muted">
      These controls change your brief visibly. Nothing is sent until you choose “Update
      recommendations”.
    </p>
    <div v-if="pendingChanges.length" class="pending-changes">
      <h3>Changes ready to apply</h3>
      <ul>
        <li v-for="change in pendingChanges" :key="change">{{ change }}</li>
      </ul>
      <div class="actions">
        <button
          class="button primary"
          @click="$emit('apply')"
          :disabled="status === 'requesting' || !!Object.keys(validationErrors).length"
        >
          Update recommendations →
        </button>
        <button class="text-button" @click="$emit('discard')" :disabled="status === 'requesting'">
          Discard pending changes
        </button>
        <router-link to="/" class="text-button">Edit the full brief</router-link>
      </div>
    </div>
    <details class="inline-preferences">
      <summary>View and edit refinement values</summary>
      <div class="field-grid">
        <div class="field">
          <label for="refine-budget">Daily budget / person ({{ preferences.currency }})</label>
          <input
            id="refine-budget"
            type="number"
            min="1"
            max="10000"
            :value="preferences.dailyBudget"
            @input="$emit('edit-budget', $event)"
            :disabled="status === 'requesting'"
          />
        </div>
        <div class="field">
          <label for="refine-journey">Maximum one-way journey</label>
          <select
            id="refine-journey"
            :value="preferences.maxJourneyHours ?? ''"
            @change="$emit('edit-journey', $event)"
            :disabled="status === 'requesting'"
          >
            <option value="">No limit</option>
            <option v-for="hour in journeyOptions" :key="hour" :value="hour">
              {{ countLabel(hour, 'hour') }}
            </option>
          </select>
        </div>
        <div class="field">
          <label for="refine-crowds">Crowds</label>
          <select
            id="refine-crowds"
            :value="preferences.crowds"
            @change="$emit('edit-crowds', $event)"
            :disabled="status === 'requesting'"
          >
            <option>No preference</option>
            <option>Quieter places</option>
          </select>
        </div>
      </div>
      <p v-for="(error, key) in validationErrors" :key="key" class="field-error">{{ error }}</p>
    </details>
  </details>
</template>
<script setup lang="ts">
import type { Preferences } from '@/types/travel';
import type { RequestStatus } from '@/types/requests';
import type { Refinement } from '@/domain/preferences';
import { countLabel } from '@/domain/preferences';

defineProps<{
  preferences: Preferences;
  status: RequestStatus;
  pendingChanges: string[];
  validationErrors: Record<string, string>;
  journeyOptions: number[];
}>();
defineEmits<{
  (event: 'refine', value: Refinement): void;
  (event: 'apply'): void;
  (event: 'discard'): void;
  (event: 'edit-budget', value: Event): void;
  (event: 'edit-journey', value: Event): void;
  (event: 'edit-crowds', value: Event): void;
}>();
</script>
