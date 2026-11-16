import type {
  CareEvent,
  Culture,
  GardenRepository,
  Plant,
  Plot,
  Settings,
  Task,
  WeatherForecast,
} from '~/domain/garden';
import careEventsData from './mock/care-events.json';
import culturesData from './mock/cultures.json';
import plantsData from './mock/plants.json';
import plotsData from './mock/plots.json';
import settingsData from './mock/settings.json';
import tasksData from './mock/tasks.json';
import weatherData from './mock/weather.json';

type MockTask = Omit<Task, 'dueDate' | 'completedAt'> & {
  dueOffsetDays: number;
  completedToday?: boolean;
};

const plots = plotsData as Plot[];
const plants = plantsData as Plant[];
const cultures = culturesData as Culture[];
const careEvents = careEventsData as CareEvent[];
const tasks = tasksData as MockTask[];
const settings = settingsData;
const weatherByPlot = weatherData as {
  dacha: WeatherForecast;
  home: WeatherForecast;
  [plotId: string]: WeatherForecast | undefined;
};

function formatLocalDate(date: Date): string {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getDueDate(now: Date, offsetDays: number): string {
  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + offsetDays);

  return formatLocalDate(dueDate);
}

function formatUtcDateTime(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

export class MockGardenRepository implements GardenRepository {
  constructor(private readonly now: () => Date = () => new Date()) {}

  getPlots(): Promise<Plot[]> {
    return Promise.resolve(structuredClone(plots));
  }

  getPlants(): Promise<Plant[]> {
    return Promise.resolve(structuredClone(plants));
  }

  getPlant(id: string): Promise<Plant | null> {
    const plant = plants.find((candidate) => candidate.id === id);

    return Promise.resolve(plant ? structuredClone(plant) : null);
  }

  getPlantsByPlot(plotId: string): Promise<Plant[]> {
    const plotPlants = plants.filter((plant) => plant.plotId === plotId);

    return Promise.resolve(structuredClone(plotPlants));
  }

  getTodayTasks(): Promise<Task[]> {
    const now = this.now();
    const today = formatLocalDate(now);
    const todayTasks = this.mapTasks(now).filter(
      (task) =>
        (task.status === 'pending' && task.dueDate === today) ||
        (task.status === 'done' && task.completedAt !== undefined),
    );

    return Promise.resolve(todayTasks);
  }

  getTasksByPlant(plantId: string): Promise<Task[]> {
    const plantTasks = this.mapTasks(this.now()).filter(
      (task) => task.plantId === plantId,
    );

    return Promise.resolve(plantTasks);
  }

  getCultures(): Promise<Culture[]> {
    return Promise.resolve(structuredClone(cultures));
  }

  getSettings(): Promise<Settings> {
    return Promise.resolve(structuredClone(settings));
  }

  getCurrentWeather(plotId: string): Promise<WeatherForecast | null> {
    const weather = weatherByPlot[plotId];

    return Promise.resolve(weather ? structuredClone(weather) : null);
  }

  getTodayWeather(): Promise<WeatherForecast> {
    return Promise.resolve(structuredClone(weatherByPlot.dacha));
  }

  getCareEvents(plotId: string): Promise<CareEvent[]> {
    const plotCareEvents = careEvents
      .filter((event) => event.plotId === plotId)
      .sort((first, second) =>
        second.performedAt.localeCompare(first.performedAt),
      );

    return Promise.resolve(structuredClone(plotCareEvents));
  }

  private mapTasks(now: Date): Task[] {
    return tasks.map(({ dueOffsetDays, completedToday, ...task }) => ({
      ...task,
      instructions: [...task.instructions],
      dueDate: getDueDate(now, dueOffsetDays),
      ...(completedToday ? { completedAt: formatUtcDateTime(now) } : {}),
    }));
  }
}
