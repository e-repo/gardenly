<script setup lang="ts">
import type { CultureCategory, Culture, Plant } from '~/domain/garden';
import PlantListItem from '~/modules/plots/components/PlantListItem.vue';
import { usePlotDetailsStore } from '~/modules/plots/plot-details-store';
import { categoryIcon, cultureCategoryOrder } from '~/modules/plots/plants';
import { formatTemperature, weatherIcon } from '~/modules/plots/weather';

const AUTO_PAGE_LIMIT = 3;

const store = usePlotDetailsStore();

const orderedSummaries = computed(() =>
  cultureCategoryOrder.flatMap((category) => {
    const summary = store.categorySummaries.find(
      (candidate) => candidate.category === category,
    );
    return summary ? [summary] : [];
  }),
);

const openedCategory = ref<CultureCategory | null>(null);
const autoLoadedPages = ref<Partial<Record<CultureCategory, number>>>({});

function onPanelChange(value: unknown): void {
  openedCategory.value =
    typeof value === 'string' &&
    (cultureCategoryOrder as readonly string[]).includes(value)
      ? (value as CultureCategory)
      : null;
}

watch(openedCategory, (category, previous) => {
  const target = category ?? previous;
  if (target) {
    void nextTick(() => {
      document
        .getElementById(`section-${target}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
  if (category) {
    autoLoadedPages.value = { ...autoLoadedPages.value, [category]: 0 };
    void store.loadCategory(category);
  }
});

function sectionState(category: CultureCategory) {
  return store.categoryPlants[category];
}

function plantsWithCulture(
  category: CultureCategory,
): { plant: Plant; culture: Culture }[] {
  return (store.categoryPlants[category]?.plants ?? []).flatMap((plant) => {
    const culture = store.cultureById[plant.cultureId];
    return culture ? [{ plant, culture }] : [];
  });
}

function isAutoMode(category: CultureCategory): boolean {
  return (autoLoadedPages.value[category] ?? 0) < AUTO_PAGE_LIMIT;
}

async function onLoadMore(
  category: CultureCategory,
  options: { done: (status: 'ok' | 'empty' | 'loading' | 'error') => void },
): Promise<void> {
  const state = store.categoryPlants[category];

  if (!state?.nextPageToken) {
    options.done('empty');
    return;
  }

  await store.loadMorePlants(category);

  autoLoadedPages.value = {
    ...autoLoadedPages.value,
    [category]: (autoLoadedPages.value[category] ?? 0) + 1,
  };

  const updated = store.categoryPlants[category];
  if (updated?.hasLoadError) {
    options.done('error');
    return;
  }
  options.done(updated?.nextPageToken ? 'ok' : 'empty');
}
</script>

<template>
  <div v-if="store.plot">
    <div class="d-flex align-center ga-2 mb-2">
      <v-btn
        icon="mdi-arrow-left"
        to="/garden"
        variant="text"
        color="blue-grey-darken-2"
        :aria-label="$t('pages.plotDetails.back')"
      />
      <h1 class="text-h5 font-weight-medium text-blue-grey-darken-4 mb-0">
        {{ store.plot.name }}
      </h1>
    </div>

    <p class="text-body-2 text-blue-grey-darken-2 mb-2">
      {{ store.plot.locationLabel }}
    </p>

    <div class="d-flex align-center ga-2 mb-4 text-blue-grey-darken-4">
      <template v-if="store.weather">
        <v-icon :icon="weatherIcon(store.weather.condition)" color="primary" />
        <span>{{ formatTemperature(store.weather.temperature) }}</span>
      </template>
      <template v-else>
        <v-icon icon="mdi-weather-cloudy-off-outline" color="blue-grey" />
        <span>{{ $t('pages.garden.weatherUnavailable') }}</span>
      </template>
    </div>

    <p v-if="orderedSummaries.length === 0" class="text-body-1 text-blue-grey">
      {{ $t('pages.plotDetails.emptyPlants') }}
    </p>

    <v-expansion-panels
      v-else
      class="plot-categories"
      variant="accordion"
      :model-value="openedCategory"
      @update:model-value="onPanelChange"
    >
      <v-expansion-panel
        v-for="summary in orderedSummaries"
        :key="summary.category"
        :value="summary.category"
      >
        <v-expansion-panel-title :id="`section-${summary.category}`">
          <div class="d-flex align-center ga-2">
            <v-icon :icon="categoryIcon(summary.category)" color="primary" />
            <span class="text-blue-grey-darken-4">
              {{ $t(`pages.plotDetails.categories.${summary.category}`) }}
            </span>
            <span class="text-blue-grey">· {{ summary.count }}</span>
          </div>
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <v-alert
            v-if="sectionState(summary.category)?.hasLoadError"
            type="error"
            variant="tonal"
            density="compact"
          >
            {{ $t('pages.plotDetails.sectionLoadError') }}
          </v-alert>

          <div
            v-else-if="!sectionState(summary.category)?.loaded"
            class="d-flex justify-center py-3"
          >
            <v-progress-circular color="primary" indeterminate size="24" />
          </div>

          <v-infinite-scroll
            v-else
            :mode="isAutoMode(summary.category) ? 'intersect' : 'manual'"
            :load-more-text="$t('pages.plotDetails.showMore')"
            color="primary"
            @load="(options) => onLoadMore(summary.category, options)"
          >
            <PlantListItem
              v-for="item in plantsWithCulture(summary.category)"
              :key="item.plant.id"
              :plant="item.plant"
              :culture="item.culture"
            />
            <template #empty />
          </v-infinite-scroll>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<style scoped>
.plot-categories :deep(.v-expansion-panel) {
  border-color: rgb(var(--v-theme-teal-lighten-3));
}
</style>
