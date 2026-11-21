export interface Plot {
  id: string;
  name: string;
  locationLabel: string;
}

export interface NewPlotInput {
  name: string;
  locationLabel: string;
}

export interface UserProfile {
  id: string;
  displayName: string;
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

export interface WeatherForecast {
  temperature: number;
  condition: 'sunny' | 'partly-cloudy' | 'cloudy' | 'rain';
}

export interface GardenRepository {
  getProfile(): Promise<UserProfile>;
  getPlots(): Promise<Plot[]>;
  createPlot(input: NewPlotInput): Promise<Plot>;
  getPlant(id: string): Promise<Plant | null>;
  getPlantsByPlot(plotId: string): Promise<Plant[]>;
  getCultures(): Promise<Culture[]>;
  getCurrentWeather(plotId: string): Promise<WeatherForecast | null>;
  getCareEvents(plotId: string): Promise<CareEvent[]>;
}
