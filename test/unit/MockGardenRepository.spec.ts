import { describe, expect, it } from 'vitest';
import { MockGardenRepository } from '~/data/mock-garden-repository';

function createRepository(now: Date) {
  return new MockGardenRepository(() => new Date(now));
}

describe('MockGardenRepository', () => {
  it('returns the initial garden with plant details', async () => {
    const repository = createRepository(new Date(2026, 4, 10, 9, 30));

    const plants = await repository.getPlants();

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
    const repository = createRepository(new Date(2026, 4, 10, 9, 30));

    const plant = await repository.getPlant('pear-lada');

    expect(plant?.id).toBe('pear-lada');
    expect(plant?.variety).toBe('Лада');
    await expect(repository.getPlant('missing-plant')).resolves.toBeNull();
  });

  it.each([
    {
      now: new Date(2026, 4, 10, 9, 30, 15, 987),
      today: '2026-05-10',
    },
    {
      now: new Date(2027, 10, 3, 23, 45, 59, 999),
      today: '2027-11-03',
    },
  ])(
    'uses the injected local date $today for relative tasks',
    async ({ now, today }) => {
      const repository = createRepository(now);

      const todayTasks = await repository.getTodayTasks();

      expect(todayTasks.map((task) => task.id)).toEqual([
        'apple-spring-treatment',
        'pear-spring-feeding',
        'apple-formative-pruning',
        'currant-old-growth-inspection',
      ]);

      const pendingTasks = todayTasks.filter(
        (task) => task.status === 'pending',
      );
      expect(pendingTasks).toHaveLength(2);
      expect(pendingTasks.map((task) => task.dueDate)).toEqual([today, today]);

      const completedTasks = todayTasks.filter(
        (task) => task.status === 'done',
      );
      const expectedCompletedAt = now.toISOString().replace(/\.\d{3}Z$/, 'Z');
      expect(completedTasks).toHaveLength(2);
      expect(completedTasks.map((task) => task.completedAt)).toEqual([
        expectedCompletedAt,
        expectedCompletedAt,
      ]);
      expect(expectedCompletedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/,
      );
      expect(todayTasks.some((task) => task.id === 'currant-watering')).toBe(
        false,
      );
      expect(todayTasks.some((task) => task.id === 'cherry-inspection')).toBe(
        false,
      );
    },
  );

  it('provides reasons and instructions for recommendations', async () => {
    const repository = createRepository(new Date(2026, 4, 10, 9, 30));

    const todayTasks = await repository.getTodayTasks();

    for (const task of todayTasks) {
      expect(task.reason.length).toBeGreaterThan(0);
      expect(task.instructions.length).toBeGreaterThanOrEqual(3);
      expect(task.dueWindow).toBeGreaterThan(0);
    }
  });

  it('returns all and only tasks belonging to the requested plant', async () => {
    const repository = createRepository(new Date(2026, 4, 10, 9, 30));

    const tasks = await repository.getTasksByPlant('black-currant');

    expect(tasks.map((task) => task.id)).toEqual([
      'currant-watering',
      'currant-old-growth-inspection',
    ]);
    expect(tasks.every((task) => task.plantId === 'black-currant')).toBe(true);
    expect(tasks.map((task) => task.dueDate)).toEqual([
      '2026-05-11',
      '2026-05-08',
    ]);
    await expect(repository.getTasksByPlant('missing-plant')).resolves.toEqual(
      [],
    );
  });

  it('returns cultures, settings and static weather', async () => {
    const repository = createRepository(new Date(2026, 4, 10, 9, 30));

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
    await expect(repository.getSettings()).resolves.toEqual({
      region: 'Подмосковье',
      notificationsEnabled: true,
      notificationTime: '08:00',
    });
    await expect(repository.getTodayWeather()).resolves.toEqual({
      temperature: 18,
      condition: 'partly-cloudy',
    });
  });

  it('returns independent snapshots for every read method', async () => {
    const repository = createRepository(new Date(2026, 4, 10, 9, 30));

    const plants = await repository.getPlants();
    const plant = await repository.getPlant('apple-antonovka');
    const todayTasks = await repository.getTodayTasks();
    const plantTasks = await repository.getTasksByPlant('black-currant');
    const cultures = await repository.getCultures();
    const settings = await repository.getSettings();
    const weather = await repository.getTodayWeather();

    plants.forEach((item) => {
      item.quantity = 99;
    });
    if (plant) {
      plant.locationNote = 'изменено';
    }
    todayTasks.forEach((task) => {
      task.instructions = [];
    });
    plantTasks.forEach((task) => {
      task.title = 'изменено';
    });
    cultures.forEach((culture) => {
      culture.commonVarieties = [];
    });
    settings.region = 'изменено';
    weather.temperature = -50;

    expect((await repository.getPlants()).map((item) => item.quantity)).toEqual(
      [1, 1, 1, 3],
    );
    expect((await repository.getPlant('apple-antonovka'))?.locationNote).toBe(
      'у забора',
    );
    expect(
      (await repository.getTodayTasks()).every(
        (task) => task.instructions.length > 0,
      ),
    ).toBe(true);
    expect(
      (await repository.getTasksByPlant('black-currant')).map(
        (task) => task.title,
      ),
    ).toEqual(['Полить смородину', 'Осмотреть прошлогодние побеги смородины']);
    expect(
      (await repository.getCultures()).every(
        (culture) => culture.commonVarieties.length > 0,
      ),
    ).toBe(true);
    expect((await repository.getSettings()).region).toBe('Подмосковье');
    expect((await repository.getTodayWeather()).temperature).toBe(18);
  });

  it('returns plots with distinct locations', async () => {
    const repository = createRepository(new Date(2026, 4, 10, 9, 30));

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
    const repository = createRepository(new Date(2026, 4, 10, 9, 30));

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
    const repository = createRepository(new Date(2026, 4, 10, 9, 30));

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
    const repository = createRepository(new Date(2026, 4, 10, 9, 30));

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
    const repository = createRepository(new Date(2026, 4, 10, 9, 30));

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

  it('returns independent snapshots for plot read methods', async () => {
    const repository = createRepository(new Date(2026, 4, 10, 9, 30));

    const plots = await repository.getPlots();
    const plants = await repository.getPlantsByPlot('dacha');
    const weather = await repository.getCurrentWeather('dacha');
    const careEvents = await repository.getCareEvents('dacha');

    plots.forEach((plot) => {
      plot.locationLabel = 'изменено';
    });
    plants.forEach((plant) => {
      plant.quantity = 99;
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
    expect(
      (await repository.getPlantsByPlot('dacha')).map(
        (plant) => plant.quantity,
      ),
    ).toEqual([1, 1, 1, 3]);
    expect((await repository.getCurrentWeather('dacha'))?.temperature).toBe(18);
    expect(
      (await repository.getCareEvents('dacha')).some(
        (event) => event.note === 'изменено',
      ),
    ).toBe(false);
  });
});
