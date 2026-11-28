<template>
  <div>
    <v-alert type="warning" variant="tonal" class="mb-4">
      {{ $t('pages.plotDetails.notFound') }}
    </v-alert>
    <v-btn color="primary" to="/garden" prepend-icon="mdi-arrow-left">
      {{ $t('pages.plotDetails.back') }}
    </v-btn>
  </div>
</template>
