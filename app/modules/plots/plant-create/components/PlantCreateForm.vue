<script setup lang="ts">
import { useRouter } from 'vue-router';
import type { Culture, Plot } from '~/domain/garden';
import PlotNotFound from '~/modules/plots/plot-details/components/PlotNotFound.vue';
import { usePlotDetailsStore } from '~/modules/plots/plot-details/store';

const { plotId } = defineProps<{
  plotId: string;
}>();

const { t } = useI18n();
const router = useRouter();
const store = usePlotDetailsStore();
const plot = shallowRef<Plot | null>(null);
const cultures = shallowRef<Culture[]>([]);
const isLoading = shallowRef(true);
const hasLoadError = shallowRef(false);
const cultureId = shallowRef<string | null>(null);
const variety = shallowRef<string | null>(null);
const plantedYear = shallowRef('');
const locationNote = shallowRef('');
const quantity = shallowRef('1');
const customName = shallowRef('');
const cultureError = shallowRef('');
const varietyError = shallowRef('');
const plantedYearError = shallowRef('');
const quantityError = shallowRef('');
const customNameError = shallowRef('');
const currentYear = new Date().getFullYear();

const detailsRoute = computed(() => `/plots/${plotId}`);
const selectedCulture = computed(() =>
  cultures.value.find((culture) => culture.id === cultureId.value),
);
const isNotFound = computed(
  () => !isLoading.value && !hasLoadError.value && plot.value === null,
);

onMounted(async () => {
  const repository = useGardenRepository();
  isLoading.value = true;
  hasLoadError.value = false;

  try {
    const [loadedPlot, loadedCultures] = await Promise.all([
      repository.getPlot(plotId),
      repository.getCultures(),
    ]);
    plot.value = loadedPlot;
    cultures.value = loadedCultures;
  } catch (error) {
    console.error('Не удалось загрузить данные новой посадки', error);
    plot.value = null;
    cultures.value = [];
    hasLoadError.value = true;
  } finally {
    isLoading.value = false;
  }
});

function onCultureChange(): void {
  variety.value = null;
  cultureError.value = '';
  varietyError.value = '';
}

async function submit(): Promise<void> {
  const normalizedQuantity =
    quantity.value.trim() === '' ? 1 : Number(quantity.value);
  const normalizedYear =
    plantedYear.value.trim() === '' ? undefined : Number(plantedYear.value);
  const normalizedCustomName = customName.value.trim();

  cultureError.value = cultureId.value
    ? ''
    : t('pages.newPlant.cultureRequired');
  varietyError.value = variety.value ? '' : t('pages.newPlant.varietyRequired');
  quantityError.value =
    Number.isInteger(normalizedQuantity) && normalizedQuantity >= 1
      ? ''
      : t('pages.newPlant.quantityError');
  plantedYearError.value =
    normalizedYear === undefined
      ? t('pages.newPlant.plantedYearRequired')
      : Number.isInteger(normalizedYear) && normalizedYear <= currentYear
        ? ''
        : t('pages.newPlant.plantedYearError');
  customNameError.value =
    normalizedCustomName === '' ||
    (normalizedCustomName.length >= 3 && normalizedCustomName.length <= 200)
      ? ''
      : t('pages.newPlant.customNameError');

  if (
    !cultureId.value ||
    !variety.value ||
    normalizedYear === undefined ||
    cultureError.value ||
    varietyError.value ||
    quantityError.value ||
    plantedYearError.value ||
    customNameError.value
  ) {
    return;
  }

  const created = await store.createPlant({
    plotId,
    cultureId: cultureId.value,
    variety: variety.value,
    plantedYear: normalizedYear,
    locationNote: locationNote.value.trim() || undefined,
    quantity: normalizedQuantity,
    customName: normalizedCustomName || undefined,
  });

  if (created) {
    await router.push(detailsRoute.value);
  }
}

async function onCancel(): Promise<void> {
  await router.push(detailsRoute.value);
}
</script>

<template>
  <div>
    <div v-if="isLoading" class="d-flex align-center ga-3 py-4">
      <v-progress-circular color="primary" indeterminate size="28" />
      <span>{{ $t('pages.newPlant.loading') }}</span>
    </div>

    <div v-else-if="hasLoadError">
      <v-alert type="error" variant="tonal" class="mb-4">
        {{ $t('pages.newPlant.loadError') }}
      </v-alert>
      <v-btn color="primary" :to="detailsRoute" prepend-icon="mdi-arrow-left">
        {{ $t('pages.newPlant.backToPlot') }}
      </v-btn>
    </div>

    <PlotNotFound v-else-if="isNotFound" />

    <form v-else-if="plot" novalidate @submit.prevent="submit">
      <v-autocomplete
        v-model="cultureId"
        :items="cultures"
        item-title="name"
        item-value="id"
        :label="$t('pages.newPlant.cultureLabel')"
        :no-data-text="$t('pages.newPlant.cultureNoData')"
        :error-messages="cultureError"
        class="mb-2"
        @update:model-value="onCultureChange"
      />

      <v-select
        v-model="variety"
        :items="selectedCulture?.commonVarieties ?? []"
        :label="$t('pages.newPlant.varietyLabel')"
        :error-messages="varietyError"
        :disabled="!selectedCulture"
        clearable
        class="mb-2"
        @update:model-value="varietyError = ''"
      />

      <v-text-field
        v-model="plantedYear"
        :label="$t('pages.newPlant.plantedYearLabel')"
        :error-messages="plantedYearError"
        type="number"
        :max="currentYear"
        step="1"
        class="mb-2"
        @update:model-value="plantedYearError = ''"
      />

      <v-text-field
        v-model="locationNote"
        :label="$t('pages.newPlant.locationLabel')"
        class="mb-2"
      />

      <v-text-field
        v-model="quantity"
        :label="$t('pages.newPlant.quantityLabel')"
        :error-messages="quantityError"
        type="number"
        min="1"
        step="1"
        class="mb-2"
        @update:model-value="quantityError = ''"
      />

      <v-text-field
        v-model="customName"
        :label="$t('pages.newPlant.customNameLabel')"
        :error-messages="customNameError"
        class="mb-2"
        @update:model-value="customNameError = ''"
      />

      <v-alert
        v-if="store.hasCreateError"
        type="error"
        variant="tonal"
        class="mb-4"
      >
        {{ $t('pages.newPlant.saveError') }}
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
        {{ $t('pages.newPlant.submit') }}
      </v-btn>
      <v-btn
        type="button"
        block
        variant="text"
        color="blue-grey-darken-2"
        @click="onCancel"
      >
        {{ $t('pages.newPlant.cancel') }}
      </v-btn>
    </form>
  </div>
</template>
