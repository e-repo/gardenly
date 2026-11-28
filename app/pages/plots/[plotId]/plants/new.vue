<script setup lang="ts">
import { useRoute } from 'vue-router';
import PlantCreateForm from '~/modules/plots/plant-create/components/PlantCreateForm.vue';

const route = useRoute();
const plotId = computed(() => String(route.params.plotId));
</script>

<template>
  <div>
    <h1 class="text-h4 font-weight-medium text-blue-grey-darken-4 mb-5">
      {{ $t('pages.newPlant.title') }}
    </h1>
    <PlantCreateForm :plot-id="plotId" />
  </div>
</template>
