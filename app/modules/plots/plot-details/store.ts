import { defineStore } from 'pinia';
import type {
  Culture,
  CultureCategory,
  Plant,
  PlantCategorySummary,
  Plot,
  WeatherForecast,
} from '~/domain/garden';

export interface CategoryPlantsState {
  plants: Plant[];
  nextPageToken: string | undefined;
  isLoading: boolean;
  hasLoadError: boolean;
  loaded: boolean;
}

export const usePlotDetailsStore = defineStore('plot-details', () => {
  const plot = ref<Plot | null>(null);
  const categorySummaries = ref<PlantCategorySummary[]>([]);
  const cultureById = ref<Record<string, Culture>>({});
  const weather = ref<WeatherForecast | null>(null);
  const isLoading = ref(true);
  const hasLoadError = ref(false);
  const categoryPlants = ref<
    Partial<Record<CultureCategory, CategoryPlantsState>>
  >({});
  const loadedPlotId = ref<string | null>(null);

  const isNotFound = computed(
    () =>
      loadedPlotId.value !== null &&
      !isLoading.value &&
      !hasLoadError.value &&
      plot.value === null,
  );

  async function loadPlotDetails(plotId: string): Promise<void> {
    const repository = useGardenRepository();
    isLoading.value = true;
    hasLoadError.value = false;

    try {
      const [loadedPlot, summaries, cultures, plotWeather] = await Promise.all([
        repository.getPlot(plotId),
        repository.getPlantCategorySummaries(plotId),
        repository.getCultures(),
        repository.getCurrentWeather(plotId),
      ]);

      plot.value = loadedPlot;
      categorySummaries.value = summaries;
      cultureById.value = Object.fromEntries(
        cultures.map((culture) => [culture.id, culture]),
      );
      weather.value = plotWeather;
      categoryPlants.value = {};
      loadedPlotId.value = plotId;
    } catch (error) {
      console.error('Не удалось загрузить детали участка', error);
      plot.value = null;
      categorySummaries.value = [];
      cultureById.value = {};
      weather.value = null;
      categoryPlants.value = {};
      loadedPlotId.value = null;
      hasLoadError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  function setCategoryPlants(
    category: CultureCategory,
    state: CategoryPlantsState,
  ): void {
    categoryPlants.value = { ...categoryPlants.value, [category]: state };
  }

  async function loadPlantsPage(category: CultureCategory): Promise<void> {
    if (loadedPlotId.value === null) {
      return;
    }

    const repository = useGardenRepository();
    const current = categoryPlants.value[category];

    setCategoryPlants(category, {
      plants: current?.plants ?? [],
      nextPageToken: current?.nextPageToken,
      isLoading: true,
      hasLoadError: false,
      loaded: current?.loaded ?? false,
    });

    try {
      const page = await repository.getPlantsByPlotCategory(
        loadedPlotId.value,
        category,
        { pageToken: current?.loaded ? current.nextPageToken : undefined },
      );

      setCategoryPlants(category, {
        plants:
          current?.loaded === true
            ? [...current.plants, ...page.plants]
            : page.plants,
        nextPageToken: page.nextPageToken,
        isLoading: false,
        hasLoadError: false,
        loaded: true,
      });
    } catch (error) {
      console.error('Не удалось загрузить посадки категории', error);
      setCategoryPlants(category, {
        plants: current?.plants ?? [],
        nextPageToken: current?.nextPageToken,
        isLoading: false,
        hasLoadError: true,
        loaded: current?.loaded ?? false,
      });
    }
  }

  async function loadCategory(category: CultureCategory): Promise<void> {
    const current = categoryPlants.value[category];

    if (current?.loaded || current?.isLoading) {
      return;
    }

    await loadPlantsPage(category);
  }

  async function loadMorePlants(category: CultureCategory): Promise<void> {
    const current = categoryPlants.value[category];

    if (!current?.loaded || current.isLoading || !current.nextPageToken) {
      return;
    }

    await loadPlantsPage(category);
  }

  return {
    plot,
    categorySummaries,
    cultureById,
    weather,
    isLoading,
    hasLoadError,
    isNotFound,
    categoryPlants,
    loadPlotDetails,
    loadCategory,
    loadMorePlants,
  };
});
