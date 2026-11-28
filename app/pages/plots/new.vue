<script setup lang="ts">
import PlotCreateForm from '~/modules/plots/plot-create/components/PlotCreateForm.vue';
</script>

<template>
  <div>
    <h1 class="text-h4 font-weight-medium text-blue-grey-darken-4 mb-5">
      {{ $t('pages.newPlot.title') }}
    </h1>
    <PlotCreateForm />
  </div>
</template>
