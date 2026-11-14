import type {
  Culture,
  GardenRepository,
  Plant,
  Settings,
  Task,
  WeatherForecast,
} from '~/domain/garden';
import culturesData from './mock/cultures.json';
import plantsData from './mock/plants.json';
import settingsData from './mock/settings.json';
import tasksData from './mock/tasks.json';
import weatherData from './mock/weather.json';

type MockTask = Omit<Task, 'dueDate' | 'completedAt'> & {
  dueOffsetDays: number;
  completedToday?: boolean;
};

const plants = plantsData as Plant[];
const cultures = culturesData as Culture[];
const tasks = tasksData as MockTask[];
const settings = settingsData;
const weather = weatherData as WeatherForecast;

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

  getPlants(): Promise<Plant[]> {
    return Promise.resolve(structuredClone(plants));
  }

  getPlant(id: string): Promise<Plant | null> {
    const plant = plants.find((candidate) => candidate.id === id);

    return Promise.resolve(plant ? structuredClone(plant) : null);
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

  getTodayWeather(): Promise<WeatherForecast> {
    return Promise.resolve(structuredClone(weather));
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
