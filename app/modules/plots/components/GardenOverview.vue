<script setup lang="ts">
import GardenContent from '~/modules/plots/components/GardenContent.vue';
import GardenLoading from '~/modules/plots/components/GardenLoading.vue';
import GardenLoadError from '~/modules/plots/components/GardenLoadError.vue';
import { usePlotsStore } from '~/modules/plots/store';

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
