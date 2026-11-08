<template>
  <div class="page">
    <header class="page-heading split-heading">
      <div>
        <p class="eyebrow">02 / Possibilities, with perspective</p>
        <h1 tabindex="-1">
          Somewhere that
          <br />
          feels like you.
        </h1>
        <p>Places picked around your budget, interests and travel plans.</p>
      </div>
      <router-link to="/" class="text-button">Edit your trip brief ↗</router-link>
    </header>
    <RequestStatus
      :status="status"
      :error="error"
      title="Waiting for your recommendations"
      @cancel="cancel"
      @retry="generate"
    />
    <template v-if="batch && status !== 'requesting'">
      <div v-if="pendingChanges.length" class="notice" role="status">
        Showing your previous shortlist. It reflects the earlier brief until you update
        recommendations.
      </div>
      <section class="shortlist-intro">
        <p class="eyebrow">{{ countLabel(batch.result.destinations.length, 'destination') }}</p>
        <h2>
          {{
            batch.result.destinations.length
              ? 'Your next trip could start here.'
              : 'No suitable matches this time.'
          }}
        </h2>
        <p>{{ batch.result.summary }}</p>
        <details>
          <summary>The brief behind these results</summary>
          <PreferenceSummary :preferences="batch.preferences" />
        </details>
      </section>
      <section
        v-if="batch.result.conflicts.length"
        class="notice"
        aria-label="Conflicts and limitations"
      >
        <h3>Worth resolving together</h3>
        <ul>
          <li v-for="conflict in batch.result.conflicts" :key="conflict">{{ conflict }}</li>
        </ul>
      </section>
      <div v-if="batch.result.destinations.length" class="destination-grid">
        <DestinationCard
          v-for="(destination, i) in batch.result.destinations"
          :key="destination.id"
          :destination="destination"
          :preferences="batch.preferences"
          :index="i"
        />
      </div>
      <section v-else class="panel empty-state">
        <span aria-hidden="true">↳</span>
        <h2>Your constraints stay yours.</h2>
        <p>Try changing one preference or widening the region.</p>
        <router-link to="/" class="button secondary">Revisit the brief</router-link>
      </section>
      <p
        v-if="batch.result.destinations.length > 0 && batch.result.destinations.length < 3"
        class="small muted partial-note"
        role="status"
      >
        A partial shortlist: only {{ countLabel(batch.result.destinations.length, 'destination') }}
        {{ batch.result.destinations.length === 1 ? 'was' : 'were' }} returned. We haven’t filled
        the space with weaker matches.
      </p>
      <section class="panel planning-notes">
        <h2>A few things to check</h2>
        <ul>
          <li v-for="note in batch.result.notes" :key="note">{{ note }}</li>
        </ul>
      </section>
      <RefinementPanel
        :preferences="preferences"
        :status="status"
        :pending-changes="pendingChanges"
        :validation-errors="validationErrors"
        :journey-options="journeyOptions"
        @refine="refine"
        @apply="generate"
        @discard="undoRefinements"
        @edit-budget="editBudget"
        @edit-journey="editJourney"
        @edit-crowds="editCrowds"
      />
      <p class="small muted partial-note">
        Costs and travel details are estimates, not live quotes. Check before booking.
      </p>
    </template>
    <section v-else-if="status !== 'requesting'" class="panel empty-state">
      <h2>Your shortlist starts with a brief.</h2>
      <p>Tell us what you have in mind to find destinations that fit.</p>
      <router-link to="/" class="button primary">Set my preferences →</router-link>
    </section>
  </div>
</template>
<script setup lang="ts">
import { useRecommendations } from '@/composables/useRecommendations';
import { countLabel } from '@/domain/preferences';
import RefinementPanel from '@/components/RefinementPanel.vue';
import DestinationCard from '@/components/DestinationCard.vue';
import RequestStatus from '@/components/RequestStatus.vue';
import PreferenceSummary from '@/components/PreferenceSummary.vue';

const {
  status,
  error,
  cancel,
  batch,
  preferences,
  pendingChanges,
  validationErrors,
  journeyOptions,
  refine,
  undoRefinements,
  editBudget,
  editJourney,
  editCrowds,
  generate,
} = useRecommendations();
</script>
