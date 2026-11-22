<script setup lang="ts">
import type { Plot, WeatherForecast } from '~/domain/garden';
import { formatTemperature, weatherIcon } from '~/modules/plots/weather';

defineProps<{
  plot: Plot;
  weather: WeatherForecast | null;
}>();
</script>

<template>
  <v-hover v-slot="{ isHovering, props: hoverProps }">
    <v-card
      v-bind="hoverProps"
      class="plot-card mb-3"
      variant="outlined"
      :elevation="isHovering ? 4 : 0"
    >
      <v-card-item>
        <v-card-title class="text-blue-grey-darken-4">
          {{ plot.name }}
        </v-card-title>
        <v-card-subtitle>{{ plot.locationLabel }}</v-card-subtitle>
      </v-card-item>
      <v-card-text class="d-flex align-center ga-2 text-blue-grey-darken-4">
        <template v-if="weather">
          <v-icon :icon="weatherIcon(weather.condition)" color="primary" />
          <span>{{ formatTemperature(weather.temperature) }}</span>
        </template>
        <template v-else>
          <v-icon icon="mdi-weather-cloudy-off-outline" color="blue-grey" />
          <span>{{ $t('pages.garden.weatherUnavailable') }}</span>
        </template>
      </v-card-text>
    </v-card>
  </v-hover>
</template>

<style scoped>
.plot-card {
  border-color: rgb(var(--v-theme-teal-lighten-3));
}
</style>
