import { describe, expect, it } from 'vitest';
import { MockGardenRepository } from '~/data/mock-garden-repository';

function createRepository() {
  return new MockGardenRepository();
}

describe('MockGardenRepository', () => {
  it('returns the initial garden with plant details', async () => {
    const repository = createRepository();

    const plants = await repository.getPlantsByPlot('dacha');

    expect(
      plants.map(
        ({
          id,
          plotId,
          cultureId,
          variety,
          plantedYear,
          locationNote,
          quantity,
        }) => ({
          id,
          plotId,
          cultureId,
          variety,
          plantedYear,
          locationNote,
          quantity,
        }),
      ),
    ).toEqual([
      {
        id: 'apple-antonovka',
        plotId: 'dacha',
        cultureId: 'apple',
        variety: 'Антоновка',
        plantedYear: 2018,
        locationNote: 'у забора',
        quantity: 1,
      },
      {
        id: 'pear-lada',
        plotId: 'dacha',
        cultureId: 'pear',
        variety: 'Лада',
        plantedYear: 2021,
        locationNote: 'рядом с яблоней',
        quantity: 1,
      },
      {
        id: 'cherry-molodezhnaya',
        plotId: 'dacha',
        cultureId: 'cherry',
        variety: 'Молодёжная',
        plantedYear: 2020,
        locationNote: 'у калитки',
        quantity: 1,
      },
      {
        id: 'black-currant',
        plotId: 'dacha',
        cultureId: 'black-currant',
        variety: undefined,
        plantedYear: 2023,
        locationNote: 'ряд 2',
        quantity: 3,
      },
    ]);
  });

  it('returns a known plant and null for an unknown id', async () => {
    const repository = createRepository();

    const plant = await repository.getPlant('pear-lada');

    expect(plant?.id).toBe('pear-lada');
    expect(plant?.variety).toBe('Лада');
    await expect(repository.getPlant('missing-plant')).resolves.toBeNull();
  });

  it('returns the culture catalog', async () => {
    const repository = createRepository();

    const cultures = await repository.getCultures();

    expect(cultures.map((culture) => culture.id)).toEqual([
      'apple',
      'pear',
      'cherry',
      'black-currant',
    ]);
    expect(cultures.map((culture) => culture.name)).toEqual([
      'Яблоня',
      'Груша',
      'Вишня',
      'Смородина чёрная',
    ]);
    expect(cultures.every((culture) => !('emoji' in culture))).toBe(true);
  });

  it('returns independent snapshots for every read method', async () => {
    const repository = createRepository();

    const plots = await repository.getPlots();
    const plant = await repository.getPlant('apple-antonovka');
    const plants = await repository.getPlantsByPlot('dacha');
    const cultures = await repository.getCultures();
    const weather = await repository.getCurrentWeather('dacha');
    const careEvents = await repository.getCareEvents('dacha');

    plots.forEach((plot) => {
      plot.locationLabel = 'изменено';
    });
    if (plant) {
      plant.locationNote = 'изменено';
    }
    plants.forEach((item) => {
      item.quantity = 99;
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
      (await repository.getPlots()).map((plot) => plot.locationLabel),
    ).toEqual(['Новая Усмань', 'Воронеж, Железнодорожный район']);
    expect((await repository.getPlant('apple-antonovka'))?.locationNote).toBe(
      'у забора',
    );
    expect(
      (await repository.getPlantsByPlot('dacha')).map((item) => item.quantity),
    ).toEqual([1, 1, 1, 3]);
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

  it('returns all and only plants belonging to the requested plot', async () => {
    const repository = createRepository();

    const plants = await repository.getPlantsByPlot('dacha');

    expect(plants.map((plant) => plant.id)).toEqual([
      'apple-antonovka',
      'pear-lada',
      'cherry-molodezhnaya',
      'black-currant',
    ]);
    expect(plants.every((plant) => plant.plotId === 'dacha')).toBe(true);
    await expect(repository.getPlantsByPlot('home')).resolves.toEqual([]);
    await expect(repository.getPlantsByPlot('missing-plot')).resolves.toEqual(
      [],
    );
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
