import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MockGardenRepository } from '~/data/mock-garden-repository';
import type { GardenRepository } from '~/domain/garden';
import { usePlotsStore } from '~/modules/plots/store';

const { repositoryRef } = vi.hoisted(() => ({
  repositoryRef: { current: null as GardenRepository | null },
}));

mockNuxtImport('useGardenRepository', () => () => repositoryRef.current);

function useRepository(repository: GardenRepository) {
  repositoryRef.current = repository;
}

function repositoryWith(
  override: Partial<Record<keyof GardenRepository, unknown>>,
): GardenRepository {
  return Object.assign(new MockGardenRepository(), override);
}

beforeEach(() => {
  setActivePinia(createPinia());
});

describe('plots store', () => {
  it('loads profile, plots and weather per plot', async () => {
    useRepository(new MockGardenRepository());
    const store = usePlotsStore();

    await store.loadGarden();

    expect(store.profile?.displayName).toBe('Евгений');
    expect(store.plots.map((plot) => plot.id)).toEqual(['dacha', 'home']);
    expect(store.weatherByPlotId).toEqual({
      dacha: { temperature: 18, condition: 'partly-cloudy' },
      home: { temperature: 16, condition: 'cloudy' },
    });
    expect(store.isLoading).toBe(false);
    expect(store.hasLoadError).toBe(false);
  });

  it('loads an empty plot list without weather requests', async () => {
    useRepository(
      repositoryWith({
        getPlots: () => Promise.resolve([]),
        getCurrentWeather: () => {
          throw new Error('must not be called');
        },
      }),
    );
    const store = usePlotsStore();

    await store.loadGarden();

    expect(store.plots).toEqual([]);
    expect(store.weatherByPlotId).toEqual({});
    expect(store.hasLoadError).toBe(false);
  });

  it.each([
    { getProfile: () => Promise.reject(new Error('fail')) },
    { getPlots: () => Promise.reject(new Error('fail')) },
    { getCurrentWeather: () => Promise.reject(new Error('fail')) },
  ])(
    'reports an error and clears data when a request fails: %j',
    async (override) => {
      useRepository(repositoryWith(override));
      const store = usePlotsStore();

      await store.loadGarden();

      expect(store.hasLoadError).toBe(true);
      expect(store.isLoading).toBe(false);
      expect(store.profile).toBeNull();
      expect(store.plots).toEqual([]);
      expect(store.weatherByPlotId).toEqual({});
    },
  );

  it('replaces previous data after a failed reload', async () => {
    const repository = new MockGardenRepository();
    useRepository(repository);
    const store = usePlotsStore();
    await store.loadGarden();

    repository.getPlots = () => Promise.reject(new Error('fail'));
    await store.loadGarden();

    expect(store.hasLoadError).toBe(true);
    expect(store.plots).toEqual([]);
    expect(store.profile).toBeNull();
  });

  it('appends a created plot with unavailable weather', async () => {
    useRepository(new MockGardenRepository());
    const store = usePlotsStore();
    await store.loadGarden();

    const created = await store.createPlot({
      name: 'Теплица',
      locationLabel: 'За домом',
    });

    expect(created).toBe(true);
    expect(store.plots.map((plot) => plot.name)).toEqual([
      'Дача',
      'Дом',
      'Теплица',
    ]);
    expect(store.weatherByPlotId[store.plots[2]?.id ?? '']).toBeNull();
    expect(store.isCreating).toBe(false);
    expect(store.hasCreateError).toBe(false);
  });

  it('keeps the current state when creation fails', async () => {
    useRepository(
      repositoryWith({
        createPlot: () => Promise.reject(new Error('fail')),
      }),
    );
    const store = usePlotsStore();
    await store.loadGarden();

    const created = await store.createPlot({ name: ' ', locationLabel: ' ' });

    expect(created).toBe(false);
    expect(store.hasCreateError).toBe(true);
    expect(store.isCreating).toBe(false);
    expect(store.plots.map((plot) => plot.id)).toEqual(['dacha', 'home']);
    expect(store.weatherByPlotId['dacha']).toEqual({
      temperature: 18,
      condition: 'partly-cloudy',
    });
  });
});
