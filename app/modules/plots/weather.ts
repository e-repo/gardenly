import type { WeatherForecast } from '~/domain/garden';

const weatherIcons: Record<WeatherForecast['condition'], string> = {
  sunny: 'mdi-weather-sunny',
  'partly-cloudy': 'mdi-weather-partly-cloudy',
  cloudy: 'mdi-weather-cloudy',
  rain: 'mdi-weather-rainy',
};

export function weatherIcon(condition: WeatherForecast['condition']): string {
  return weatherIcons[condition];
}

export function formatTemperature(temperature: number): string {
  const sign = temperature > 0 ? '+' : '';

  return `${sign}${String(temperature)} °C`;
}
