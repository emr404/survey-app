<template>
  <div v-if="draft" class="page itinerary-page">
    <router-link to="/results" class="back-link">← Back to your recommendations</router-link>
    <header class="page-heading split-heading"><div><p class="eyebrow">04 / {{ approved ? 'Reviewed and approved by you' : 'A draft, until you say otherwise' }}</p><h1 tabindex="-1">{{ draft.destination.name }},<br />on your terms.</h1><p>{{ draft.preferences.days }} days, {{ draft.preferences.travellers }} travellers, {{ draft.preferences.pace.toLowerCase() }} pace. Move things around, make space, and keep what feels right.</p></div><span class="plan-status" :class="{ approved }">{{ approved ? 'Approved plan' : 'Draft, revision ' + draft.revision }}</span></header>
    <EvidenceNotice :mode="draft.mode" compact />
    <div class="notice" v-if="stale" role="status">Your trip brief has changed. This plan still reflects the earlier preferences and can’t be approved for your new brief. <router-link to="/results" class="text-button">Update recommendations →</router-link></div>
    <div class="itinerary-layout">
      <div class="itinerary-days">
        <section class="panel day-panel" v-for="(day, dayIndex) in draft.content.days" :key="day.day" :aria-labelledby="'day-' + day.day">
          <div class="day-heading"><div><p class="eyebrow">Day {{ day.day }} <span v-if="dateFor(day.day)"> / {{ dateFor(day.day) }}</span></p><h2 :id="'day-' + day.day" tabindex="-1">{{ day.day === 1 ? 'Ease into the trip.' : day.day === draft.preferences.days ? 'Make the last day yours.' : 'A little room to explore.' }}</h2></div><span class="small muted">{{ day.activities.reduce((total, activity) => total + activity.durationMinutes, 0) / 60 }}h planned</span></div>
          <p class="small muted" v-if="!day.activities.length">An open day. Add at least one activity before approval.</p>
          <ol class="activity-list"><li v-for="(activity, activityIndex) in day.activities" :key="activity.id" class="activity-item">
            <template v-if="editor?.day === dayIndex && editor.activity.id === activity.id"><ActivityEditor :key="activity.id" :activity="editor.activity" :currency="draft.preferences.currency" :adding="false" @save="saveActivity" @cancel="closeEditor" /></template>
            <template v-else><div class="activity-index" aria-hidden="true">{{ String(activityIndex + 1).padStart(2, '0') }}</div><div class="activity-body"><h3 :id="'activity-' + activity.id" tabindex="-1">{{ activity.title }}</h3><p>{{ activity.description }}</p><p class="activity-meta">{{ activity.durationMinutes }} min <span class="meta-cost"> {{ rangeLabel(activity.cost.low, activity.cost.high, draft.preferences.currency) }} / person</span> <span class="estimate-label">estimate</span></p><div class="activity-controls"><button class="text-button" @click="openEditor(dayIndex, activity)">Replace / edit<span class="sr-only"> {{ activity.title }}</span></button><button class="text-button danger" @click="remove(dayIndex, activity)">Remove<span class="sr-only"> {{ activity.title }}</span></button><div class="reorder-controls"><button class="icon-button" :disabled="activityIndex === 0" @click="move(dayIndex, activity, -1)" :aria-label="'Move ' + activity.title + ' earlier'">↑</button><button class="icon-button" :disabled="activityIndex === day.activities.length - 1" @click="move(dayIndex, activity, 1)" :aria-label="'Move ' + activity.title + ' later'">↓</button></div></div></div></template>
          </li></ol>
          <ActivityEditor v-if="editor?.day === dayIndex && editor.adding" :key="editor.activity.id" :activity="editor.activity" :currency="draft.preferences.currency" :adding="true" @save="saveActivity" @cancel="closeEditor" />
          <button v-else-if="day.activities.length < 4" class="add-activity" @click="add(dayIndex)">+ Add an activity to day {{ day.day }}</button>
          <p v-if="day.activities.reduce((sum, activity) => sum + activity.durationMinutes, 0) > 720" class="field-error">This day has more than 12 hours of activities. Make some room before approval.</p>
        </section>
      </div>
      <aside class="plan-sidebar">
        <section class="panel cost-summary"><p class="eyebrow">A planning range, not a quote</p><h2>Your estimated envelope</h2><p class="total-estimate">{{ rangeLabel(total.low, total.high, draft.preferences.currency) }}</p><p class="small muted">per person for {{ draft.preferences.days }} days</p><dl><div><dt>Group estimate ({{ draft.preferences.travellers }})</dt><dd>{{ rangeLabel(total.low * draft.preferences.travellers, total.high * draft.preferences.travellers, draft.preferences.currency) }}</dd></div><div><dt>Your target / person</dt><dd>{{ money(draft.preferences.dailyBudget * draft.preferences.days, draft.preferences.currency) }}</dd></div><div><dt>Base daily costs / person</dt><dd>{{ rangeLabel(draft.content.baseDailyCost.low, draft.content.baseDailyCost.high, draft.preferences.currency) }}</dd></div></dl><p class="small muted">Base costs cover stays, meals and local transport. Activity estimates above are added separately. Travel to {{ draft.destination.name }} is excluded.</p><p v-if="total.high > draft.preferences.dailyBudget * draft.preferences.days" class="budget-warning">The upper estimate is over your target. Review the activities or adjust your brief before deciding.</p></section>
        <section class="panel assumptions"><h2>The assumptions behind this plan</h2><ul><li v-for="assumption in draft.content.assumptions" :key="assumption">{{ assumption }}</li></ul><details><summary>The brief this plan uses</summary><PreferenceSummary :preferences="draft.preferences" /></details></section>
      </aside>
    </div>
    <div class="sr-only" role="status" aria-live="polite">{{ announcement }}</div>
    <section v-if="approved" class="approval-panel approved-panel" aria-labelledby="approval-title"><span class="approval-mark" aria-hidden="true">✓</span><div><p class="eyebrow">Your decision, recorded</p><h2 id="approval-title">A plan you’ve made your own.</h2><p>You approved revision {{ draft.approvedRevision }}. Nothing has been reserved or purchased. Travel details still need checking.</p><p class="small">Any further edit will return this plan to draft and require a fresh approval.</p></div><button class="button primary" @click="download">Save plan as text ↓</button></section>
    <section v-else class="approval-panel" aria-labelledby="approval-title"><div><p class="eyebrow">One final human decision</p><h2 id="approval-title">Ready to call this your plan?</h2><p>Approval saves this exact version as your final plan on this device. It doesn’t reserve anything or spend money.</p><ul v-if="approvalProblems.length" class="approval-problems"><li v-for="problem in approvalProblems" :key="problem">{{ problem }}</li></ul><label class="approval-check"><input type="checkbox" v-model="confirmed" :disabled="!!approvalProblems.length || !!editor" /> I’ve reviewed the activities, assumptions and estimates. I understand travel details are unverified and nothing is booked.</label><p v-if="editor" class="field-error">Save or cancel your activity edit before approving.</p><p v-if="approvalError" class="field-error" role="alert">{{ approvalError }}</p></div><button class="button primary" @click="approve" :disabled="!confirmed || !!approvalProblems.length || !!editor">Approve this plan →</button></section>
    <HistoryLog :entries="store.state.history" />
  </div>
  <div v-else class="page narrow-page"><h1 tabindex="-1">Your plan is still a possibility.</h1><section class="panel empty-state"><h2>Choose a destination first.</h2><p>Explore your recommendations and build an editable itinerary when you find a good fit.</p><router-link to="/results" class="button primary">Explore destinations →</router-link></section></div>
</template>
<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import { useStore } from '@/store';
import { Activity, ItineraryDraft } from '@/domain/types';
import { newId } from '@/domain/ids';
import { money, rangeLabel, samePreferences } from '@/domain/preferences';
import { removeActivity, replaceActivity, moveActivity, approvalIssues, approveDraft, isApproved, estimateTotal } from '@/domain/itinerary';
import { logChange } from '@/services/history';
import ActivityEditor from '@/components/ActivityEditor.vue';
import EvidenceNotice from '@/components/EvidenceNotice.vue';
import PreferenceSummary from '@/components/PreferenceSummary.vue';
import HistoryLog from '@/components/HistoryLog.vue';
const store = useStore();
const draft = computed(() => store.state.itinerary);
const confirmed = ref(false); const approvalError = ref(''); const announcement = ref('');
const editor = ref<{ day: number; activity: Activity; adding: boolean } | null>(null);
const total = computed(() => draft.value ? estimateTotal(draft.value) : { low: 0, high: 0 });
const stale = computed(() => draft.value && !samePreferences(draft.value.preferences, store.state.preferences));
const approved = computed(() => !!draft.value && isApproved(draft.value, store.state.preferences));
const approvalProblems = computed(() => draft.value ? approvalIssues(draft.value, store.state.preferences) : []);
watch(() => draft.value?.revision, () => { confirmed.value = false; approvalError.value = ''; });
function openEditor(day: number, activity: Activity) { confirmed.value = false; editor.value = { day, activity: JSON.parse(JSON.stringify(activity)), adding: false }; }
function add(day: number) {
  confirmed.value = false;
  editor.value = { day, adding: true, activity: { id: newId('user-'), title: '', description: '', durationMinutes: 60, cost: { low: 0, high: 0 } } };
}
async function focus(id: string) { await nextTick(); document.getElementById(id)?.focus(); }
function closeEditor() { const current = editor.value; editor.value = null; if (current) focus('day-' + (current.day + 1)); }
function saveActivity(activity: Activity) {
  if (!draft.value || !editor.value) return;
  try {
    const day = editor.value.day; const adding = editor.value.adding;
    store.commit('SAVE_ITINERARY', replaceActivity(draft.value, day, activity));
    logChange('edit', `${adding ? 'Added' : 'Replaced or edited'} an activity on day ${day + 1}`, [activity.title, 'Plan returned to draft; approval required.']);
    editor.value = null; announcement.value = 'Activity saved. The plan needs your approval.'; focus('activity-' + activity.id);
  } catch (error) { approvalError.value = error instanceof Error ? error.message : 'Could not save this activity.'; }
}
function remove(day: number, activity: Activity) {
  if (!draft.value) return;
  store.commit('SAVE_ITINERARY', removeActivity(draft.value, day, activity.id));
  logChange('edit', `Removed an activity from day ${day + 1}`, [activity.title]);
  announcement.value = `${activity.title} removed. Plan returned to draft.`;
  focus('day-' + (day + 1));
}
function move(day: number, activity: Activity, direction: -1 | 1) {
  if (!draft.value) return;
  const next = moveActivity(draft.value, day, activity.id, direction);
  if (next === draft.value) return;
  store.commit('SAVE_ITINERARY', next);
  logChange('edit', `Reordered day ${day + 1}`, [`${activity.title} moved ${direction === -1 ? 'earlier' : 'later'}.`]);
  announcement.value = 'Activity moved. Plan returned to draft.'; focus('activity-' + activity.id);
}
function approve() {
  if (!draft.value || editor.value) return;
  try {
    const next: ItineraryDraft = approveDraft(draft.value, store.state.preferences, confirmed.value, new Date().toISOString());
    store.commit('SAVE_ITINERARY', next); logChange('approval', `Approved revision ${next.revision} for ${next.destination.name}`, ['Planning approval only. No reservations or purchases.']);
    announcement.value = 'Plan approved. Nothing has been booked.';
  } catch (error) { approvalError.value = error instanceof Error ? error.message : 'Could not approve the plan.'; }
}
function dateFor(day: number): string {
  if (!draft.value || draft.value.preferences.timing !== 'dates') return '';
  const date = new Date(draft.value.preferences.startDate + 'T12:00:00Z'); date.setUTCDate(date.getUTCDate() + day - 1);
  return date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}
function download() {
  if (!draft.value || !approved.value) return;
  const d = draft.value;
  const text = [`${d.destination.name} — your approved travel plan`, `Revision ${d.revision}; user approval recorded at ${d.approvedAt}`,
    `${d.mode === 'demo' ? 'Simulated suggestions with user edits' : 'AI suggestions with user edits'}. No verified external data. No bookings or purchases.`,
    `${d.preferences.days} days, ${d.preferences.travellers} travellers, departing ${d.preferences.departure}.`,
    `Estimate per person: ${rangeLabel(total.value.low, total.value.high, d.preferences.currency)}; excludes travel to the destination.`,
    ...d.content.days.flatMap(day => [`\nDay ${day.day}`, ...day.activities.map(a => `${a.title} (${a.durationMinutes} min, ${rangeLabel(a.cost.low, a.cost.high, d.preferences.currency)} estimate/person)\n${a.description}`)]),
    '\nAssumptions', ...d.content.assumptions].join('\n');
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = `${d.destination.id}-travel-plan.txt`; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
</script>
