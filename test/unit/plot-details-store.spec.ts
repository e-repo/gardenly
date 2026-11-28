import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toRaw } from 'vue';
import { MockGardenRepository } from '~/data/mock-garden-repository';
import type { GardenRepository, Plant, PlantsPage } from '~/domain/garden';
import { usePlotDetailsStore } from '~/modules/plots/plot-details/store';

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

describe('plot details store', () => {
  it('loads plot, category summaries, cultures and weather', async () => {
    useRepository(new MockGardenRepository());
    const store = usePlotDetailsStore();

    await store.loadPlotDetails('dacha');

    expect(store.plot?.name).toBe('Дача');
    expect(store.categorySummaries).toHaveLength(4);
    expect(store.cultureById['apple']?.name).toBe('Яблоня');
    expect(store.weather).toEqual({
      temperature: 18,
      condition: 'partly-cloudy',
    });
    expect(store.isLoading).toBe(false);
    expect(store.hasLoadError).toBe(false);
    expect(store.isNotFound).toBe(false);
  });

  it('reports not found for an unknown plot without an error', async () => {
    useRepository(new MockGardenRepository());
    const store = usePlotDetailsStore();

    await store.loadPlotDetails('missing-plot');

    expect(store.isNotFound).toBe(true);
    expect(store.hasLoadError).toBe(false);
    expect(store.isLoading).toBe(false);
    expect(store.plot).toBeNull();
    expect(store.categorySummaries).toEqual([]);
  });

  it('loads a plot without plants', async () => {
    useRepository(new MockGardenRepository());
    const store = usePlotDetailsStore();

    await store.loadPlotDetails('home');

    expect(store.plot?.name).toBe('Дом');
    expect(store.categorySummaries).toEqual([]);
    expect(store.isNotFound).toBe(false);
  });

  it.each([
    { getPlot: () => Promise.reject(new Error('fail')) },
    { getPlantCategorySummaries: () => Promise.reject(new Error('fail')) },
    { getCultures: () => Promise.reject(new Error('fail')) },
    { getCurrentWeather: () => Promise.reject(new Error('fail')) },
  ])(
    'reports an error and clears data when a request fails: %j',
    async (override) => {
      useRepository(repositoryWith(override));
      const store = usePlotDetailsStore();

      await store.loadPlotDetails('dacha');

      expect(store.hasLoadError).toBe(true);
      expect(store.isLoading).toBe(false);
      expect(store.isNotFound).toBe(false);
      expect(store.plot).toBeNull();
      expect(store.categorySummaries).toEqual([]);
      expect(store.cultureById).toEqual({});
      expect(store.weather).toBeNull();
    },
  );

  it('loads category plants once on first expand', async () => {
    const repository = new MockGardenRepository();
    useRepository(repository);
    const loadSpy = vi.spyOn(repository, 'getPlantsByPlotCategory');
    const store = usePlotDetailsStore();
    await store.loadPlotDetails('dacha');

    await store.loadCategory('fruit-berry');
    await store.loadCategory('fruit-berry');

    expect(loadSpy).toHaveBeenCalledTimes(1);
    const state = store.categoryPlants['fruit-berry'];
    expect(state?.loaded).toBe(true);
    expect(state?.plants).toHaveLength(10);
    expect(state?.plants[0]?.cultureId).toBe('cherry');
    expect(state?.nextPageToken).toBeDefined();
  });

  it('appends the next page on loadMorePlants', async () => {
    let calls = 0;
    const repository = repositoryWith({
      getPlantsByPlotCategory: (): Promise<PlantsPage> => {
        calls += 1;
        return Promise.resolve(
          calls === 1
            ? {
                plants: [
                  {
                    id: 'plant-1',
                    plotId: 'dacha',
                    cultureId: 'apple',
                    quantity: 1,
                    createdAt: '2026-01-01T00:00:00Z',
                  },
                ],
                nextPageToken: 'next',
              }
            : {
                plants: [
                  {
                    id: 'plant-2',
                    plotId: 'dacha',
                    cultureId: 'apple',
                    quantity: 2,
                    createdAt: '2026-01-02T00:00:00Z',
                  },
                ],
              },
        );
      },
    });
    useRepository(repository);
    const store = usePlotDetailsStore();
    await store.loadPlotDetails('dacha');

    await store.loadCategory('fruit-berry');
    await store.loadMorePlants('fruit-berry');
    await store.loadMorePlants('fruit-berry');

    const state = store.categoryPlants['fruit-berry'];
    expect(calls).toBe(2);
    expect(state?.plants.map((plant) => plant.id)).toEqual([
      'plant-1',
      'plant-2',
    ]);
    expect(state?.nextPageToken).toBeUndefined();
  });

  it('keeps a category error local to the section', async () => {
    useRepository(
      repositoryWith({
        getPlantsByPlotCategory: () => Promise.reject(new Error('fail')),
      }),
    );
    const store = usePlotDetailsStore();
    await store.loadPlotDetails('dacha');

    await store.loadCategory('fruit-berry');

    const state = store.categoryPlants['fruit-berry'];
    expect(state?.hasLoadError).toBe(true);
    expect(state?.isLoading).toBe(false);
    expect(state?.plants).toEqual([]);
    expect(store.hasLoadError).toBe(false);
    expect(store.plot?.name).toBe('Дача');
  });

  it('does not load categories before plot details are loaded', async () => {
    const repository = new MockGardenRepository();
    useRepository(repository);
    const loadSpy = vi.spyOn(repository, 'getPlantsByPlotCategory');
    const store = usePlotDetailsStore();

    await store.loadCategory('fruit-berry');

    expect(loadSpy).not.toHaveBeenCalled();
    expect(store.categoryPlants['fruit-berry']).toBeUndefined();
  });
});

describe('plot details store createPlant', () => {
  it('updates the category count and invalidates its loaded pages', async () => {
    useRepository(new MockGardenRepository());
    const store = usePlotDetailsStore();
    await store.loadPlotDetails('dacha');
    await store.loadCategory('fruit-berry');
    expect(store.categoryPlants['fruit-berry']?.loaded).toBe(true);

    const created = await store.createPlant({
      plotId: 'dacha',
      cultureId: 'apple',
      variety: 'Антоновка',
      plantedYear: 2020,
    });

    expect(created).toBe(true);
    expect(
      store.categorySummaries.find(
        (summary) => summary.category === 'fruit-berry',
      )?.count,
    ).toBe(33);
    expect(store.categoryPlants['fruit-berry']).toBeUndefined();
    expect(store.isCreating).toBe(false);
    expect(store.hasCreateError).toBe(false);
  });

  it('adds a summary when the first plant category appears', async () => {
    useRepository(new MockGardenRepository());
    const store = usePlotDetailsStore();
    await store.loadPlotDetails('home');

    const created = await store.createPlant({
      plotId: 'home',
      cultureId: 'rose',
      variety: 'Фламентанц',
      plantedYear: 2020,
    });

    expect(created).toBe(true);
    expect(store.categorySummaries).toEqual([{ category: 'flower', count: 1 }]);
  });

  it('keeps the screen state when creation fails', async () => {
    useRepository(
      repositoryWith({
        createPlant: () => Promise.reject(new Error('fail')),
      }),
    );
    const store = usePlotDetailsStore();
    await store.loadPlotDetails('dacha');
    await store.loadCategory('fruit-berry');
    const summaries = structuredClone(toRaw(store.categorySummaries));
    const categoryPlants = structuredClone(toRaw(store.categoryPlants));

    const created = await store.createPlant({
      plotId: 'dacha',
      cultureId: 'apple',
      variety: 'Антоновка',
      plantedYear: 2020,
    });

    expect(created).toBe(false);
    expect(store.hasCreateError).toBe(true);
    expect(store.isCreating).toBe(false);
    expect(store.plot?.name).toBe('Дача');
    expect(store.categorySummaries).toEqual(summaries);
    expect(store.categoryPlants).toEqual(categoryPlants);
  });

  it('blocks a repeated submit while creation is pending', async () => {
    let finishCreate!: (plant: Plant) => void;
    const createSpy = vi.fn(
      () =>
        new Promise<Plant>((resolve) => {
          finishCreate = resolve;
        }),
    );
    useRepository(repositoryWith({ createPlant: createSpy }));
    const store = usePlotDetailsStore();
    await store.loadPlotDetails('dacha');

    const first = store.createPlant({
      plotId: 'dacha',
      cultureId: 'apple',
      variety: 'Антоновка',
      plantedYear: 2020,
    });
    expect(store.isCreating).toBe(true);
    const second = await store.createPlant({
      plotId: 'dacha',
      cultureId: 'apple',
      variety: 'Антоновка',
      plantedYear: 2020,
    });

    expect(second).toBe(false);
    expect(createSpy).toHaveBeenCalledTimes(1);
    finishCreate({
      id: 'plant-1',
      plotId: 'dacha',
      cultureId: 'apple',
      quantity: 1,
      createdAt: '2026-01-01T00:00:00Z',
    });
    await expect(first).resolves.toBe(true);
    expect(store.isCreating).toBe(false);
  });
});
