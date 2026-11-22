import { describe, expect, it } from 'vitest';
import type { CultureCategory } from '~/domain/garden';
import { MockGardenRepository } from '~/data/mock-garden-repository';

function createRepository() {
  return new MockGardenRepository();
}

describe('MockGardenRepository', () => {
  it('returns the initial garden across all categories', async () => {
    const repository = createRepository();

    async function readAllPages(category: CultureCategory) {
      const plants = [];
      let pageToken: string | undefined;
      do {
        const page = await repository.getPlantsByPlotCategory(
          'dacha',
          category,
          { pageToken },
        );
        plants.push(...page.plants);
        pageToken = page.nextPageToken;
      } while (pageToken !== undefined);
      return plants;
    }

    const fruitBerry = await readAllPages('fruit-berry');
    const vegetable = await readAllPages('vegetable');
    const ornamental = await readAllPages('ornamental');
    const flower = await readAllPages('flower');

    expect(fruitBerry).toHaveLength(32);
    expect(vegetable).toHaveLength(1);
    expect(ornamental).toHaveLength(1);
    expect(flower).toHaveLength(1);

    const all = [...fruitBerry, ...vegetable, ...ornamental, ...flower];
    expect(all.every((plant) => plant.plotId === 'dacha')).toBe(true);
    expect(new Set(all.map((plant) => plant.id)).size).toBe(all.length);

    const apple = fruitBerry.find((plant) => plant.id === 'apple-antonovka');
    expect(apple).toMatchObject({
      cultureId: 'apple',
      variety: 'Антоновка',
      plantedYear: 2018,
      locationNote: 'у забора',
      quantity: 1,
    });
  });

  it('returns a known plant and null for an unknown id', async () => {
    const repository = createRepository();

    const plant = await repository.getPlant('pear-lada');

    expect(plant?.id).toBe('pear-lada');
    expect(plant?.variety).toBe('Лада');
    await expect(repository.getPlant('missing-plant')).resolves.toBeNull();
  });

  it('returns the culture catalog covering all categories', async () => {
    const repository = createRepository();

    const cultures = await repository.getCultures();

    expect(cultures.map((culture) => culture.id)).toEqual([
      'apple',
      'pear',
      'cherry',
      'black-currant',
      'tomato',
      'maple',
      'rose',
    ]);

    const allowed: CultureCategory[] = [
      'fruit-berry',
      'vegetable',
      'ornamental',
      'flower',
    ];
    expect(
      cultures.every((culture) => allowed.includes(culture.category)),
    ).toBe(true);
    expect(new Set(cultures.map((culture) => culture.category))).toEqual(
      new Set(allowed),
    );
    expect(cultures.every((culture) => !('emoji' in culture))).toBe(true);
  });

  it('returns independent snapshots for every read method', async () => {
    const repository = createRepository();

    const plots = await repository.getPlots();
    const plot = await repository.getPlot('dacha');
    const plant = await repository.getPlant('apple-antonovka');
    const page = await repository.getPlantsByPlotCategory(
      'dacha',
      'fruit-berry',
    );
    const summaries = await repository.getPlantCategorySummaries('dacha');
    const cultures = await repository.getCultures();
    const weather = await repository.getCurrentWeather('dacha');
    const careEvents = await repository.getCareEvents('dacha');

    plots.forEach((item) => {
      item.locationLabel = 'изменено';
    });
    if (plot) {
      plot.name = 'изменено';
    }
    if (plant) {
      plant.locationNote = 'изменено';
    }
    page.plants.forEach((item) => {
      item.quantity = 99;
    });
    summaries.forEach((item) => {
      item.count = 99;
    });
    cultures.forEach((culture) => {
      culture.commonVarieties = [];
    });
    if (weather) {
      weather.temperature = -50;
    }
    careEvents.forEach((event) => {
      event.note = 'изменено';
    });

    expect(
      (await repository.getPlots()).map((item) => item.locationLabel),
    ).toEqual(['Новая Усмань', 'Воронеж, Железнодорожный район']);
    expect((await repository.getPlot('dacha'))?.name).toBe('Дача');
    expect((await repository.getPlant('apple-antonovka'))?.locationNote).toBe(
      'у забора',
    );
    expect(
      (
        await repository.getPlantsByPlotCategory('dacha', 'fruit-berry')
      ).plants.every((item) => item.quantity !== 99),
    ).toBe(true);
    expect(
      (await repository.getPlantCategorySummaries('dacha')).find(
        (summary) => summary.category === 'fruit-berry',
      )?.count,
    ).toBe(32);
    expect(
      (await repository.getCultures()).every(
        (culture) => culture.commonVarieties.length > 0,
      ),
    ).toBe(true);
    expect((await repository.getCurrentWeather('dacha'))?.temperature).toBe(18);
    expect(
      (await repository.getCareEvents('dacha')).some(
        (event) => event.note === 'изменено',
      ),
    ).toBe(false);
  });

  it('returns plots with distinct locations', async () => {
    const repository = createRepository();

    await expect(repository.getPlots()).resolves.toEqual([
      {
        id: 'dacha',
        name: 'Дача',
        locationLabel: 'Новая Усмань',
      },
      {
        id: 'home',
        name: 'Дом',
        locationLabel: 'Воронеж, Железнодорожный район',
      },
    ]);
  });

  it('returns a known plot and null for an unknown id', async () => {
    const repository = createRepository();

    await expect(repository.getPlot('dacha')).resolves.toEqual({
      id: 'dacha',
      name: 'Дача',
      locationLabel: 'Новая Усмань',
    });
    await expect(repository.getPlot('missing-plot')).resolves.toBeNull();
  });

  it('returns a created plot by id', async () => {
    const repository = createRepository();

    const created = await repository.createPlot({
      name: 'Теплица',
      locationLabel: 'За домом',
    });

    await expect(repository.getPlot(created.id)).resolves.toEqual({
      id: created.id,
      name: 'Теплица',
      locationLabel: 'За домом',
    });
  });

  it('returns category summaries with exact plant counts', async () => {
    const repository = createRepository();

    const summaries = await repository.getPlantCategorySummaries('dacha');

    expect(summaries).toEqual(
      expect.arrayContaining([
        { category: 'fruit-berry', count: 32 },
        { category: 'vegetable', count: 1 },
        { category: 'ornamental', count: 1 },
        { category: 'flower', count: 1 },
      ]),
    );
    expect(summaries).toHaveLength(4);

    await expect(repository.getPlantCategorySummaries('home')).resolves.toEqual(
      [],
    );
    await expect(
      repository.getPlantCategorySummaries('missing-plot'),
    ).resolves.toEqual([]);
  });

  it('returns category plants in stable order for the requested plot only', async () => {
    const repository = createRepository();

    const page = await repository.getPlantsByPlotCategory(
      'dacha',
      'fruit-berry',
    );

    expect(page.plants).toHaveLength(10);
    expect(page.plants.every((plant) => plant.plotId === 'dacha')).toBe(true);
    expect(page.plants.slice(0, 7).map((plant) => plant.cultureId)).toEqual(
      Array(7).fill('cherry'),
    );
    expect(page.plants.slice(7).map((plant) => plant.cultureId)).toEqual(
      Array(3).fill('pear'),
    );
    expect(page.nextPageToken).toBeDefined();

    await expect(
      repository.getPlantsByPlotCategory('home', 'fruit-berry'),
    ).resolves.toEqual({ plants: [] });
    await expect(
      repository.getPlantsByPlotCategory('missing-plot', 'fruit-berry'),
    ).resolves.toEqual({ plants: [] });
  });

  it('paginates category plants without repeats or gaps', async () => {
    const repository = createRepository();

    const first = await repository.getPlantsByPlotCategory(
      'dacha',
      'fruit-berry',
      { pageSize: 2 },
    );
    expect(first.plants.map((plant) => plant.id)).toEqual([
      'cherry-molodezhnaya',
      'cherry-molodezhnaya-2',
    ]);
    expect(first.nextPageToken).toBeDefined();

    const second = await repository.getPlantsByPlotCategory(
      'dacha',
      'fruit-berry',
      { pageSize: 2, pageToken: first.nextPageToken },
    );
    expect(second.plants.map((plant) => plant.id)).toEqual([
      'cherry-molodezhnaya-3',
      'cherry-shokoladnitsa',
    ]);
    expect(second.nextPageToken).toBeDefined();

    const ids = [];
    let pageToken: string | undefined;
    do {
      const page = await repository.getPlantsByPlotCategory(
        'dacha',
        'fruit-berry',
        { pageSize: 5, pageToken },
      );
      ids.push(...page.plants.map((plant) => plant.id));
      pageToken = page.nextPageToken;
    } while (pageToken !== undefined);

    expect(ids).toHaveLength(32);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('returns weather for each plot and null for an unknown id', async () => {
    const repository = createRepository();

    await expect(repository.getCurrentWeather('dacha')).resolves.toEqual({
      temperature: 18,
      condition: 'partly-cloudy',
    });
    await expect(repository.getCurrentWeather('home')).resolves.toEqual({
      temperature: 16,
      condition: 'cloudy',
    });
    await expect(
      repository.getCurrentWeather('missing-plot'),
    ).resolves.toBeNull();
  });

  it('returns plot care events newest first with treatment details', async () => {
    const repository = createRepository();

    const careEvents = await repository.getCareEvents('dacha');

    expect(careEvents.map((event) => event.id)).toEqual([
      'dacha-inspection-2026-05-10',
      'dacha-treatment-2026-04-20',
      'dacha-manual-treatment-2026-04-05',
    ]);
    expect(careEvents.every((event) => event.plotId === 'dacha')).toBe(true);

    const treatment = careEvents.find(
      (event) => event.id === 'dacha-treatment-2026-04-20',
    );
    expect(treatment).toMatchObject({
      plantId: 'apple-antonovka',
      taskId: 'apple-spring-treatment',
      type: 'treatment',
      performedAt: '2026-04-20T07:45:00Z',
      productName: 'Скор',
      dosage: '2 мл на 10 л воды',
      createdAt: '2026-04-20T08:00:00Z',
    });
    await expect(repository.getCareEvents('missing-plot')).resolves.toEqual([]);
  });

  it('returns a manual treatment without a task id', async () => {
    const repository = createRepository();

    const careEvents = await repository.getCareEvents('dacha');
    const manualEvent = careEvents.find(
      (event) => event.id === 'dacha-manual-treatment-2026-04-05',
    );

    expect(manualEvent).toMatchObject({
      type: 'treatment',
      performedAt: '2026-04-05T09:15:00Z',
      productName: 'Скор',
      dosage: '2 мл на 10 л воды',
    });
    expect(manualEvent?.taskId).toBeUndefined();
  });

  it('returns a stable mock user profile', async () => {
    const repository = createRepository();

    await expect(repository.getProfile()).resolves.toEqual({
      id: 'user-evgeny',
      displayName: 'Евгений',
    });
  });

  it('creates a plot with normalized values and appends it last', async () => {
    const repository = createRepository();

    const created = await repository.createPlot({
      name: '  Теплица  ',
      locationLabel: ' Новая Усмань, за домом ',
    });

    expect(created).toEqual({
      id: 'plot-1',
      name: 'Теплица',
      locationLabel: 'Новая Усмань, за домом',
    });
    expect((await repository.getPlots()).map((plot) => plot.id)).toEqual([
      'dacha',
      'home',
      'plot-1',
    ]);
  });

  it('assigns unique ids to repeatedly created plots', async () => {
    const repository = createRepository();

    const first = await repository.createPlot({
      name: 'Теплица',
      locationLabel: 'За домом',
    });
    const second = await repository.createPlot({
      name: 'Балкон',
      locationLabel: 'Квартира',
    });

    expect(first.id).not.toBe(second.id);
    expect((await repository.getPlots()).map((plot) => plot.id)).toEqual([
      'dacha',
      'home',
      first.id,
      second.id,
    ]);
  });

  it.each([
    { name: '', locationLabel: 'За домом' },
    { name: '   ', locationLabel: 'За домом' },
    { name: 'Теплица', locationLabel: '' },
    { name: 'Теплица', locationLabel: '  ' },
  ])(
    'rejects empty values without changing the plot list: %j',
    async (input) => {
      const repository = createRepository();

      await expect(repository.createPlot(input)).rejects.toThrow();
      expect((await repository.getPlots()).map((plot) => plot.id)).toEqual([
        'dacha',
        'home',
      ]);
    },
  );

  it('returns null weather for a newly created plot', async () => {
    const repository = createRepository();

    const created = await repository.createPlot({
      name: 'Теплица',
      locationLabel: 'За домом',
    });

    await expect(repository.getCurrentWeather(created.id)).resolves.toBeNull();
  });

  it('returns an independent snapshot of a created plot', async () => {
    const repository = createRepository();

    const created = await repository.createPlot({
      name: 'Теплица',
      locationLabel: 'За домом',
    });
    created.name = 'изменено';

    const stored = (await repository.getPlots()).find(
      (plot) => plot.id === created.id,
    );
    expect(stored?.name).toBe('Теплица');
  });
});
