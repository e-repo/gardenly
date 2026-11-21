<script setup lang="ts">
import GardenOverview from '~/modules/plots/components/GardenOverview.vue';
</script>

<template>
  <div>
    <h1 class="text-h4 font-weight-medium text-blue-grey-darken-4 mb-5">
      {{ $t('pages.garden.title') }}
    </h1>
    <GardenOverview />
  </div>
</template>
