import type {
  CareEvent,
  Culture,
  CultureCategory,
  GardenRepository,
  NewPlotInput,
  Plant,
  PlantCategorySummary,
  PlantsPage,
  PlantsPageRequest,
  Plot,
  UserProfile,
  WeatherForecast,
} from '~/domain/garden';
import careEventsData from './mock/care-events.json';
import culturesData from './mock/cultures.json';
import plantsData from './mock/plants.json';
import plotsData from './mock/plots.json';
import profileData from './mock/profile.json';
import weatherData from './mock/weather.json';

const plants = plantsData as Plant[];
const cultures = culturesData as Culture[];
const careEvents = careEventsData as CareEvent[];
const profile: UserProfile = profileData;
const weatherByPlot = weatherData as {
  dacha: WeatherForecast;
  home: WeatherForecast;
  [plotId: string]: WeatherForecast | undefined;
};

const cultureNameById = new Map(
  cultures.map((culture) => [culture.id, culture.name]),
);

const DEFAULT_PLANTS_PAGE_SIZE = 10;

export class MockGardenRepository implements GardenRepository {
  private readonly plots: Plot[] = structuredClone(plotsData);
  private plotCounter = 0;

  getProfile(): Promise<UserProfile> {
    return Promise.resolve(structuredClone(profile));
  }

  getPlots(): Promise<Plot[]> {
    return Promise.resolve(structuredClone(this.plots));
  }

  getPlot(id: string): Promise<Plot | null> {
    const plot = this.plots.find((candidate) => candidate.id === id);

    return Promise.resolve(plot ? structuredClone(plot) : null);
  }

  createPlot(input: NewPlotInput): Promise<Plot> {
    const name = input.name.trim();
    const locationLabel = input.locationLabel.trim();

    if (!name || !locationLabel) {
      return Promise.reject(
        new Error('Название и локация участка обязательны'),
      );
    }

    this.plotCounter += 1;
    const plot: Plot = {
      id: `plot-${String(this.plotCounter)}`,
      name,
      locationLabel,
    };
    this.plots.push(plot);

    return Promise.resolve(structuredClone(plot));
  }

  getPlant(id: string): Promise<Plant | null> {
    const plant = plants.find((candidate) => candidate.id === id);

    return Promise.resolve(plant ? structuredClone(plant) : null);
  }

  getPlantCategorySummaries(plotId: string): Promise<PlantCategorySummary[]> {
    const countByCategory = new Map<CultureCategory, number>();

    for (const plant of plants) {
      if (plant.plotId !== plotId) {
        continue;
      }
      const category = cultures.find(
        (culture) => culture.id === plant.cultureId,
      )?.category;
      if (!category) {
        continue;
      }
      countByCategory.set(category, (countByCategory.get(category) ?? 0) + 1);
    }

    const summaries: PlantCategorySummary[] = [
      ...countByCategory.entries(),
    ].map(([category, count]) => ({ category, count }));

    return Promise.resolve(structuredClone(summaries));
  }

  getPlantsByPlotCategory(
    plotId: string,
    category: CultureCategory,
    page: PlantsPageRequest = {},
  ): Promise<PlantsPage> {
    const pageSize = page.pageSize ?? DEFAULT_PLANTS_PAGE_SIZE;
    const offset = page.pageToken ? Number.parseInt(page.pageToken, 10) : 0;

    const sorted = plants
      .filter((plant) => plant.plotId === plotId)
      .filter(
        (plant) =>
          cultures.find((culture) => culture.id === plant.cultureId)
            ?.category === category,
      )
      .sort((first, second) => {
        const byCulture = (
          cultureNameById.get(first.cultureId) ?? ''
        ).localeCompare(cultureNameById.get(second.cultureId) ?? '', 'ru');

        return byCulture !== 0 ? byCulture : first.id.localeCompare(second.id);
      });

    const pagePlants = sorted.slice(offset, offset + pageSize);
    const nextOffset = offset + pageSize;
    const result: PlantsPage = { plants: structuredClone(pagePlants) };
    if (nextOffset < sorted.length) {
      result.nextPageToken = String(nextOffset);
    }

    return Promise.resolve(result);
  }

  getCultures(): Promise<Culture[]> {
    return Promise.resolve(structuredClone(cultures));
  }

  getCurrentWeather(plotId: string): Promise<WeatherForecast | null> {
    const weather = weatherByPlot[plotId];

    return Promise.resolve(weather ? structuredClone(weather) : null);
  }

  getCareEvents(plotId: string): Promise<CareEvent[]> {
    const plotCareEvents = careEvents
      .filter((event) => event.plotId === plotId)
      .sort((first, second) =>
        second.performedAt.localeCompare(first.performedAt),
      );

    return Promise.resolve(structuredClone(plotCareEvents));
  }
}
