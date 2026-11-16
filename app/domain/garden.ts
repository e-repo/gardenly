export interface Plot {
  id: string;
  name: string;
  locationLabel: string;
}

export interface Plant {
  id: string;
  plotId: string;
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

export type CareWorkType =
  | 'pruning'
  | 'feeding'
  | 'treatment'
  | 'watering'
  | 'inspection'
  | 'transplanting'
  | 'other';

export interface CareEvent {
  id: string;
  plotId: string;
  plantId?: string;
  taskId?: string;
  type: CareWorkType;
  performedAt: string;
  productName?: string;
  dosage?: string;
  note?: string;
  photoUrl?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  plantId: string;
  type: CareWorkType;
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
  getPlots(): Promise<Plot[]>;
  getPlants(): Promise<Plant[]>;
  getPlant(id: string): Promise<Plant | null>;
  getPlantsByPlot(plotId: string): Promise<Plant[]>;
  getTodayTasks(): Promise<Task[]>;
  getTasksByPlant(plantId: string): Promise<Task[]>;
  getCultures(): Promise<Culture[]>;
  getSettings(): Promise<Settings>;
  getCurrentWeather(plotId: string): Promise<WeatherForecast | null>;
  getTodayWeather(): Promise<WeatherForecast>;
  getCareEvents(plotId: string): Promise<CareEvent[]>;
}
