<script setup lang="ts">
import GardenContent from '~/modules/plots/garden/components/GardenContent.vue';
import GardenLoading from '~/modules/plots/garden/components/GardenLoading.vue';
import GardenLoadError from '~/modules/plots/garden/components/GardenLoadError.vue';
import { usePlotsStore } from '~/modules/plots/garden/store';

const store = usePlotsStore();

onMounted(() => {
  void store.loadGarden();
});
</script>

<template>
  <GardenLoading v-if="store.isLoading" />
  <GardenLoadError v-else-if="store.hasLoadError" />
  <GardenContent v-else />
</template>
