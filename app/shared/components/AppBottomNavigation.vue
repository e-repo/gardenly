<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();

const navigationItems = [
  { to: '/', labelKey: 'navigation.today', icon: 'mdi-calendar-today' },
  {
    to: '/garden',
    labelKey: 'navigation.garden',
    icon: 'mdi-sprout-outline',
  },
  {
    to: '/settings',
    labelKey: 'navigation.settings',
    icon: 'mdi-cog-outline',
  },
] as const;
</script>

<template>
  <v-bottom-navigation
    :model-value="route.path"
    app
    bg-color="teal-lighten-5"
    color="primary"
    grow
  >
    <v-btn
      v-for="item in navigationItems"
      :key="item.to"
      :value="item.to"
      :to="item.to"
      min-height="56"
    >
      <v-icon :icon="item.icon" />
      <span>{{ $t(item.labelKey) }}</span>
    </v-btn>
  </v-bottom-navigation>
</template>
