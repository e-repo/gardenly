import { MockGardenRepository } from '~/data/mock-garden-repository';
import type { GardenRepository } from '~/domain/garden';

export default defineNuxtPlugin(() => {
  const gardenRepository: GardenRepository = new MockGardenRepository();

  return {
    provide: {
      gardenRepository,
    },
  };
});
