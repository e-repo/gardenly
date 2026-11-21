<script setup lang="ts">
import { useRouter } from 'vue-router';
import { usePlotsStore } from '~/modules/plots/store';

const { t } = useI18n();
const router = useRouter();
const store = usePlotsStore();

const name = ref('');
const locationLabel = ref('');
const nameError = ref('');
const locationError = ref('');

async function submit() {
  nameError.value = name.value.trim() ? '' : t('pages.newPlot.nameRequired');
  locationError.value = locationLabel.value.trim()
    ? ''
    : t('pages.newPlot.locationRequired');

  if (nameError.value || locationError.value) {
    return;
  }

  const created = await store.createPlot({
    name: name.value,
    locationLabel: locationLabel.value,
  });

  if (created) {
    await router.push('/garden');
  }
}

async function cancel() {
  await router.push('/garden');
}
</script>

<template>
  <form novalidate @submit.prevent="submit">
    <v-text-field
      v-model="name"
      :label="$t('pages.newPlot.nameLabel')"
      :error-messages="nameError"
      class="mb-2"
    />
    <v-text-field
      v-model="locationLabel"
      :label="$t('pages.newPlot.locationLabel')"
      :error-messages="locationError"
      class="mb-2"
    />

    <v-alert
      v-if="store.hasCreateError"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ $t('pages.newPlot.saveError') }}
    </v-alert>

    <v-btn
      type="submit"
      block
      color="primary"
      size="large"
      :loading="store.isCreating"
      :disabled="store.isCreating"
      class="mb-2"
    >
      {{ $t('pages.newPlot.submit') }}
    </v-btn>
    <v-btn block variant="text" color="blue-grey-darken-2" @click="cancel">
      {{ $t('pages.newPlot.cancel') }}
    </v-btn>
  </form>
</template>
