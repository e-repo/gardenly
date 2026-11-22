<script setup lang="ts">
import PlotCard from '~/modules/plots/components/PlotCard.vue';
import { usePlotsStore } from '~/modules/plots/store';

const store = usePlotsStore();
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-4">
      <p class="text-body-1 text-blue-grey-darken-4 mb-0">
        {{ $t('pages.garden.greeting', { name: store.profile?.displayName }) }}
      </p>
      <v-btn
        icon="mdi-cog-outline"
        to="/settings"
        variant="text"
        color="blue-grey-darken-2"
        :aria-label="$t('pages.garden.settingsLabel')"
      />
    </div>

    <v-btn
      block
      color="primary"
      size="x-large"
      to="/plots/new"
      prepend-icon="mdi-plus"
      class="mb-5"
    >
      {{ $t('pages.garden.addPlot') }}
    </v-btn>

    <p v-if="store.plots.length === 0" class="text-body-1 text-blue-grey">
      {{ $t('pages.garden.empty') }}
    </p>

    <PlotCard
      v-for="plot in store.plots"
      :key="plot.id"
      :plot="plot"
      :weather="store.weatherByPlotId[plot.id] ?? null"
    />
  </div>
</template>
