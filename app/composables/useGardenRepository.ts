import type { GardenRepository } from '~/domain/garden';

export function useGardenRepository(): GardenRepository {
  return useNuxtApp().$gardenRepository;
}
