import type {
  CareEvent,
  Culture,
  GardenRepository,
  NewPlotInput,
  Plant,
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

export class MockGardenRepository implements GardenRepository {
  private readonly plots: Plot[] = structuredClone(plotsData);
  private plotCounter = 0;

  getProfile(): Promise<UserProfile> {
    return Promise.resolve(structuredClone(profile));
  }

  getPlots(): Promise<Plot[]> {
    return Promise.resolve(structuredClone(this.plots));
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

  getPlantsByPlot(plotId: string): Promise<Plant[]> {
    const plotPlants = plants.filter((plant) => plant.plotId === plotId);

    return Promise.resolve(structuredClone(plotPlants));
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
