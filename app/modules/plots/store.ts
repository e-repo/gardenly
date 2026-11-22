import { defineStore } from 'pinia';
import type {
  NewPlotInput,
  Plot,
  UserProfile,
  WeatherForecast,
} from '~/domain/garden';

export const usePlotsStore = defineStore('plots', () => {
  const profile = ref<UserProfile | null>(null);
  const plots = ref<Plot[]>([]);
  const weatherByPlotId = ref<Record<string, WeatherForecast | null>>({});
  const isLoading = ref(false);
  const hasLoadError = ref(false);
  const isCreating = ref(false);
  const hasCreateError = ref(false);

  async function loadGarden(): Promise<void> {
    const repository = useGardenRepository();
    isLoading.value = true;
    hasLoadError.value = false;

    try {
      const [loadedProfile, loadedPlots] = await Promise.all([
        repository.getProfile(),
        repository.getPlots(),
      ]);
      const weatherEntries = await Promise.all(
        loadedPlots.map(
          async (plot) =>
            [plot.id, await repository.getCurrentWeather(plot.id)] as const,
        ),
      );

      profile.value = loadedProfile;
      plots.value = loadedPlots;
      weatherByPlotId.value = Object.fromEntries(weatherEntries);
    } catch (error) {
      console.error('Не удалось загрузить сад', error);
      profile.value = null;
      plots.value = [];
      weatherByPlotId.value = {};
      hasLoadError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function createPlot(input: NewPlotInput): Promise<boolean> {
    const repository = useGardenRepository();
    isCreating.value = true;
    hasCreateError.value = false;

    try {
      const created = await repository.createPlot(input);
      plots.value = [...plots.value, created];
      weatherByPlotId.value = { ...weatherByPlotId.value, [created.id]: null };
      return true;
    } catch (error) {
      console.error('Не удалось создать участок', error);
      hasCreateError.value = true;
      return false;
    } finally {
      isCreating.value = false;
    }
  }

  return {
    profile,
    plots,
    weatherByPlotId,
    isLoading,
    hasLoadError,
    isCreating,
    hasCreateError,
    loadGarden,
    createPlot,
  };
});
