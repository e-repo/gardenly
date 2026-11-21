<script setup lang="ts">
import type { Plot, WeatherForecast } from '~/domain/garden';
import { formatTemperature, weatherIcon } from '~/modules/plots/weather';

defineProps<{
  plot: Plot;
  weather: WeatherForecast | null;
}>();
</script>

<template>
  <v-card class="mb-3" color="teal-lighten-5" variant="flat">
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
</template>
