<script setup lang="ts">
import AppBottomNavigation from '~/shared/components/AppBottomNavigation.vue';
</script>

<template>
  <v-app>
    <v-main class="bg-background">
      <v-container class="px-4 py-6" max-width="720">
        <slot />
      </v-container>
    </v-main>
    <AppBottomNavigation />
  </v-app>
</template>
