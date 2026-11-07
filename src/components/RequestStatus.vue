<template>
  <section v-if="status === 'requesting'" class="request-state panel" aria-live="polite" aria-busy="true">
    <span class="request-mark" aria-hidden="true">✳</span><div><h2>{{ title }}</h2><p>{{ mode === 'demo' ? 'Waiting for the local demo response. No AI model or research tools are running.' : 'Waiting for the model response. No live search or research tools are running.' }}</p><p class="muted small">The response will be checked before it appears.</p></div>
    <button class="button secondary" @click="$emit('cancel')">Cancel request</button>
  </section>
  <section v-else-if="status === 'error'" class="panel error-state" role="alert"><h2>{{ accountIssue ? 'Your AI account needs attention.' : code === 'rate_limit_exceeded' ? 'AI rate limit reached.' : 'Request could not be completed.' }}</h2><p>{{ error }}</p><div class="actions"><a v-if="billingIssue" class="button secondary" href="https://platform.openai.com/settings/organization/billing/overview" target="_blank" rel="noopener noreferrer">Check API billing ↗</a><a v-if="billingIssue || code === 'rate_limit_exceeded' || code === 'provider_limit_unknown'" class="button secondary" href="https://platform.openai.com/settings/organization/limits" target="_blank" rel="noopener noreferrer">Check API limits ↗</a><button class="button primary" @click="$emit('retry')">{{ accountIssue ? 'Retry after updating account' : 'Retry request' }}</button></div></section>
  <section v-else-if="status === 'cancelled'" class="notice" role="status"><p>Request cancelled. Your preferences and previous work are unchanged.</p><button class="text-button" @click="$emit('retry')">Try again</button></section>
</template>
<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps<{ status: string; title: string; mode: string; error: string; code?: string }>();
const billingIssue = computed(() => ['credit_balance_exhausted', 'insufficient_quota', 'project_spend_limit_exceeded', 'organization_spend_limit_exceeded', 'organization_usage_limit_exceeded'].includes(props.code || ''));
const accountIssue = computed(() => billingIssue.value || ['provider_authentication', 'provider_model_access', 'provider_configuration'].includes(props.code || ''));
defineEmits<{ (event: 'cancel'): void; (event: 'retry'): void }>();
</script>
