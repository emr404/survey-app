<template>
  <form class="activity-editor" @submit.prevent="save" novalidate>
    <div class="section-heading"><h4>{{ adding ? 'Add your own activity' : 'Replace or edit this activity' }}</h4><button type="button" class="text-button" @click="$emit('cancel')">Cancel</button></div>
    <p class="small muted">Your choice, using your own planning estimates. This change will require a fresh approval.</p>
    <p v-if="error" class="field-error" role="alert">{{ error }}</p>
    <div class="field"><label :for="'title-' + activity.id">Activity name</label><input :id="'title-' + activity.id" ref="titleInput" v-model="form.title" maxlength="100" /></div>
    <div class="field"><label :for="'description-' + activity.id">Plan or practical notes</label><textarea :id="'description-' + activity.id" v-model="form.description" rows="2" maxlength="600" /></div>
    <div class="field-grid three-fields"><div class="field"><label :for="'duration-' + activity.id">Duration (minutes)</label><input :id="'duration-' + activity.id" type="number" v-model.number="form.durationMinutes" min="15" max="720" step="15" /></div><div class="field"><label :for="'low-' + activity.id">Low estimate ({{ currency }})</label><input :id="'low-' + activity.id" type="number" v-model.number="form.cost.low" min="0" max="10000" /></div><div class="field"><label :for="'high-' + activity.id">High estimate ({{ currency }})</label><input :id="'high-' + activity.id" type="number" v-model.number="form.cost.high" min="0" max="10000" /></div></div>
    <p class="small muted">Activity cost per person, excluding meals, accommodation and local transport already in the base daily budget.</p>
    <button class="button primary" type="submit">Save activity</button>
  </form>
</template>
<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { Activity, Currency } from '@/domain/types';
import { contracts, matches } from '../../shared/validation';
const props = defineProps<{ activity: Activity; currency: Currency; adding: boolean }>();
const emit = defineEmits<{ (event: 'save', value: Activity): void; (event: 'cancel'): void }>();
const form = reactive<Activity>(JSON.parse(JSON.stringify(props.activity)));
const error = ref(''); const titleInput = ref<HTMLInputElement | null>(null);
onMounted(() => titleInput.value?.focus());
function save() {
  const value = { ...form, title: form.title.trim(), description: form.description.trim(), cost: { ...form.cost } };
  if (!matches(value, contracts.activity) || value.cost.low > value.cost.high) { error.value = 'Enter a title and notes, a duration of 15–720 minutes, and a cost range from 0–10,000 with the low estimate first.'; return; }
  emit('save', value);
}
</script>
