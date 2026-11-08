<template>
  <div class="page preferences-page">
    <header class="page-heading">
      <p class="eyebrow">01 / Begin with what matters</p>
      <h1 tabindex="-1">
        A good trip starts
        <br />
        with you.
      </h1>
      <p>Tell us what matters. We’ll find a few places that fit.</p>
    </header>
    <div class="preferences-layout">
      <form ref="formElement" class="panel preference-form" @submit.prevent="advance" novalidate>
        <nav class="brief-progress" aria-label="Trip brief steps">
          <ol>
            <li v-for="(item, index) in briefSteps" :key="item.id">
              <button
                type="button"
                :aria-current="step === index ? 'step' : undefined"
                :class="{ active: step === index }"
                @click="navigate(index)"
              >
                <span aria-hidden="true">{{ index + 1 }}</span>
                {{ item.label }}
              </button>
            </li>
          </ol>
        </nav>
        <div class="brief-step-heading">
          <p class="eyebrow">Step {{ step + 1 }} of {{ briefSteps.length }}</p>
          <progress :value="step + 1" :max="briefSteps.length" aria-label="Trip brief progress" />
          <h2 ref="stepHeading" tabindex="-1">{{ currentStep.title }}</h2>
          <p>{{ currentStep.description }}</p>
        </div>
        <div v-if="submitted && Object.keys(visibleErrors).length" class="sr-only" role="alert">
          {{ Object.values(visibleErrors).join(' ') }}
        </div>
        <TripEssentials
          v-if="step === 0"
          :preferences="form"
          :errors="errors"
          :submitted="submitted"
          @update="updatePreferences"
        />
        <TripBudget
          v-if="step === 1"
          :preferences="form"
          :errors="errors"
          :submitted="submitted"
          @update="updatePreferences"
        />
        <fieldset v-if="step === 2">
          <legend class="sr-only">Passports & entry</legend>
          <PassportFields
            :errors="submitted ? errors : {}"
            :preferences="form"
            @update="updatePreferences"
          />
        </fieldset>
        <TripInterests
          v-if="step === 3"
          :preferences="form"
          :errors="errors"
          :submitted="submitted"
          @update="updatePreferences"
        />
        <BriefReview v-if="step === reviewStep" :preferences="form" @edit="editSection" />
        <p v-if="step === reviewStep" class="brief-consent small muted">
          Selecting Find destinations sends this brief to the recommendation service. Planning only.
          No reservations or payments.
        </p>
        <p v-if="navigationError" class="field-error" role="alert">{{ navigationError }}</p>
        <div class="form-footer brief-actions">
          <button
            v-if="step > 0"
            class="button secondary"
            type="button"
            @click="navigate(step - 1)"
          >
            <span aria-hidden="true">←</span>
            Back
          </button>
          <button class="button primary" type="submit">
            {{ primaryAction }}
            <span aria-hidden="true">→</span>
          </button>
        </div>
        <p class="brief-save small muted">
          {{
            storageAvailable
              ? 'Answers saved as you go on this device.'
              : 'Answers kept for this visit. Browser storage is unavailable.'
          }}
        </p>
      </form>
      <BudgetEnvelope :preferences="form" :errors="errors" :has-results="hasResults" />
    </div>
  </div>
</template>
<script setup lang="ts">
import PassportFields from '@/components/PassportFields.vue';
import BriefReview from '@/components/BriefReview.vue';
import TripEssentials from '@/components/brief/TripEssentials.vue';
import TripBudget from '@/components/brief/TripBudget.vue';
import TripInterests from '@/components/brief/TripInterests.vue';
import BudgetEnvelope from '@/components/brief/BudgetEnvelope.vue';
import { useBrief } from '@/composables/useBrief';
import { briefSteps, reviewStep } from '@/domain/brief';

const {
  form,
  step,
  currentStep,
  primaryAction,
  submitted,
  formElement,
  stepHeading,
  errors,
  visibleErrors,
  navigationError,
  storageAvailable,
  hasResults,
  advance,
  navigate,
  editSection,
  updatePreferences,
} = useBrief();
</script>
