<script setup lang="ts">
import { useRoute } from 'vue-router';
import PlotDetailsContent from '~/modules/plots/components/PlotDetailsContent.vue';
import PlotDetailsLoadError from '~/modules/plots/components/PlotDetailsLoadError.vue';
import PlotDetailsLoading from '~/modules/plots/components/PlotDetailsLoading.vue';
import PlotNotFound from '~/modules/plots/components/PlotNotFound.vue';
import { usePlotDetailsStore } from '~/modules/plots/plot-details-store';

const route = useRoute();
const store = usePlotDetailsStore();

onMounted(() => {
  void store.loadPlotDetails(String(route.params.plotId));
});
</script>

<template>
  <PlotDetailsLoading v-if="store.isLoading" />
  <PlotDetailsLoadError v-else-if="store.hasLoadError" />
  <PlotNotFound v-else-if="store.isNotFound" />
  <PlotDetailsContent v-else />
</template>
