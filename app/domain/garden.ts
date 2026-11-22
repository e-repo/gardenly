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

export type CultureCategory =
  'fruit-berry' | 'vegetable-garden' | 'woody-ornamental' | 'flower';

export interface Culture {
  id: string;
  name: string;
  category: CultureCategory;
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

export interface PlantCategorySummary {
  category: CultureCategory;
  count: number;
}

export interface PlantsPage {
  plants: Plant[];
  nextPageToken?: string;
}

export interface PlantsPageRequest {
  pageSize?: number;
  pageToken?: string;
}

export interface GardenRepository {
  getProfile(): Promise<UserProfile>;
  getPlots(): Promise<Plot[]>;
  getPlot(id: string): Promise<Plot | null>;
  createPlot(input: NewPlotInput): Promise<Plot>;
  getPlant(id: string): Promise<Plant | null>;
  getPlantCategorySummaries(plotId: string): Promise<PlantCategorySummary[]>;
  getPlantsByPlotCategory(
    plotId: string,
    category: CultureCategory,
    page?: PlantsPageRequest,
  ): Promise<PlantsPage>;
  getCultures(): Promise<Culture[]>;
  getCurrentWeather(plotId: string): Promise<WeatherForecast | null>;
  getCareEvents(plotId: string): Promise<CareEvent[]>;
}
