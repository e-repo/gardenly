<script setup lang="ts">
import type { Culture, Plant } from '~/domain/garden';
import { ageForm, plantAgeYears } from '~/modules/plots/plants';

const props = defineProps<{
  plant: Plant;
  culture: Culture;
}>();

const { t } = useI18n();

const title = computed(() =>
  [props.culture.name, props.plant.variety].filter(Boolean).join(' '),
);

const meta = computed(() => {
  const parts = [t('pages.plotDetails.quantity', { n: props.plant.quantity })];

  if (props.plant.plantedYear !== undefined) {
    const age = plantAgeYears(props.plant.plantedYear);
    parts.push(t(`pages.plotDetails.age.${ageForm(age)}`, { n: age }));
  }
  if (props.plant.locationNote) {
    parts.push(props.plant.locationNote);
  }

  return parts.join(' · ');
});
</script>

<template>
  <v-list-item class="px-0">
    <v-list-item-title class="text-blue-grey-darken-4">
      {{ title }}
    </v-list-item-title>
    <v-list-item-subtitle>{{ meta }}</v-list-item-subtitle>
  </v-list-item>
</template>
