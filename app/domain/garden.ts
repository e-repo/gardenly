export interface Plant {
  id: string;
  cultureId: string;
  variety?: string;
  customName?: string;
  plantedYear?: number;
  locationNote?: string;
  quantity: number;
  photoUrl?: string;
  createdAt: string;
}

export interface Culture {
  id: string;
  name: string;
  emoji: string;
  category: 'tree' | 'bush' | 'berry' | 'flower';
  commonVarieties: string[];
}

export interface Task {
  id: string;
  plantId: string;
  type:
    'pruning' | 'feeding' | 'treatment' | 'watering' | 'inspection' | 'other';
  title: string;
  reason: string;
  instructions: string[];
  warning?: string;
  dueDate: string;
  dueWindow: number;
  status: 'pending' | 'done' | 'skipped' | 'postponed';
  completedAt?: string;
}

export interface Settings {
  region: string;
  notificationsEnabled: boolean;
  notificationTime: string;
}

export interface WeatherForecast {
  temperature: number;
  condition: 'sunny' | 'partly-cloudy' | 'cloudy' | 'rain';
}

export interface GardenRepository {
  getPlants(): Promise<Plant[]>;
  getPlant(id: string): Promise<Plant | null>;
  getTodayTasks(): Promise<Task[]>;
  getTasksByPlant(plantId: string): Promise<Task[]>;
  getCultures(): Promise<Culture[]>;
  getSettings(): Promise<Settings>;
  getTodayWeather(): Promise<WeatherForecast>;
}
