import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';
import { createI18n } from 'vue-i18n';
import { createMemoryHistory, createRouter } from 'vue-router';
import { createVuetify } from 'vuetify';
import { VApp, VAutocomplete, VSelect, VTextField } from 'vuetify/components';
import { MockGardenRepository } from '~/data/mock-garden-repository';
import type { GardenRepository } from '~/domain/garden';
import ru from '~/i18n/locales/ru.json';
import PlantCreateForm from '~/modules/plots/plant-create/components/PlantCreateForm.vue';
import { usePlotDetailsStore } from '~/modules/plots/plot-details/store';

const { repositoryRef } = vi.hoisted(() => ({
  repositoryRef: { current: null as GardenRepository | null },
}));

mockNuxtImport('useGardenRepository', () => () => repositoryRef.current);

vi.stubGlobal('visualViewport', {
  scale: 1,
  offsetLeft: 0,
  offsetTop: 0,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
});

const FormTestHost = defineComponent({
  components: { PlantCreateForm, VApp },
  props: { plotId: { type: String, required: true } },
  template: '<v-app><PlantCreateForm :plot-id="plotId" /></v-app>',
});

async function mountForm(repository: GardenRepository, plotId = 'dacha') {
  repositoryRef.current = repository;
  setActivePinia(createPinia());
  const store = usePlotDetailsStore();
  await store.loadPlotDetails(plotId);

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/garden', component: { template: '<div />' } },
      { path: '/plots/:plotId', component: { template: '<div />' } },
      { path: '/plots/:plotId/plants/new', component: { template: '<div />' } },
    ],
  });
  await router.push(`/plots/${plotId}/plants/new`);
  await router.isReady();

  const wrapper = mount(FormTestHost, {
    attachTo: document.body,
    props: { plotId },
    global: {
      plugins: [
        router,
        createVuetify(),
        createI18n({ legacy: false, locale: 'ru', messages: { ru } }),
      ],
    },
  });
  await flushPromises();

  return { wrapper, router, store };
}

async function selectCulture(
  wrapper: ReturnType<typeof mount>,
  cultureId: string,
): Promise<void> {
  wrapper.findComponent(VAutocomplete).vm.$emit('update:modelValue', cultureId);
  await flushPromises();
}

function field(wrapper: ReturnType<typeof mount>, label: string) {
  return wrapper
    .findAllComponents(VTextField)
    .find((candidate) => candidate.props('label') === label);
}

async function fillRequiredFields(
  wrapper: ReturnType<typeof mount>,
): Promise<void> {
  await selectCulture(wrapper, 'apple');
  wrapper.findComponent(VSelect).vm.$emit('update:modelValue', 'Антоновка');
  await field(wrapper, 'Год посадки')?.find('input').setValue('2020');
  await flushPromises();
}

describe('PlantCreateForm', () => {
  beforeEach(() => {
    repositoryRef.current = null;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('requires culture, variety and planting year', async () => {
    const repository = new MockGardenRepository();
    const createPlant = vi.spyOn(repository, 'createPlant');
    const { wrapper } = await mountForm(repository);

    await wrapper.find('form').trigger('submit');

    expect(wrapper.text()).toContain('Выберите культуру');
    expect(wrapper.text()).toContain('Выберите сорт');
    expect(wrapper.text()).toContain('Введите год посадки');
    expect(createPlant).not.toHaveBeenCalled();
  });

  it('filters the culture catalog by search text', async () => {
    const { wrapper } = await mountForm(new MockGardenRepository());
    const autocomplete = wrapper.findComponent(VAutocomplete);

    await autocomplete.find('input').trigger('focus');
    await autocomplete.find('input').setValue('Ябл');
    await vi.waitFor(() => {
      expect(document.body.textContent).toContain('Яблоня');
    });
    expect(document.body.textContent).not.toContain('Груша');
  });

  it('enables variety only after culture selection and uses its catalog', async () => {
    const { wrapper } = await mountForm(new MockGardenRepository());
    const select = wrapper.findComponent(VSelect);

    expect(select.props('disabled')).toBe(true);
    await selectCulture(wrapper, 'apple');

    expect(select.props('disabled')).toBe(false);
    expect(select.props('items')).toEqual(['Антоновка', 'Мельба', 'Спартак']);
  });

  it('rejects invalid quantity and future planting year', async () => {
    const repository = new MockGardenRepository();
    const createPlant = vi.spyOn(repository, 'createPlant');
    const { wrapper } = await mountForm(repository);
    await selectCulture(wrapper, 'apple');
    wrapper.findComponent(VSelect).vm.$emit('update:modelValue', 'Антоновка');

    await field(wrapper, 'Количество')?.find('input').setValue('0');
    await field(wrapper, 'Год посадки')
      ?.find('input')
      .setValue(String(new Date().getFullYear() + 1));
    await wrapper.find('form').trigger('submit');

    expect(wrapper.text()).toContain(
      'Количество должно быть целым числом не меньше 1',
    );
    expect(wrapper.text()).toContain(
      'Введите корректный год посадки не позднее текущего',
    );
    expect(createPlant).not.toHaveBeenCalled();
  });

  it('blocks repeated submission while saving', async () => {
    const repository = new MockGardenRepository();
    repository.createPlant = () => new Promise(() => {});
    const { wrapper } = await mountForm(repository);
    await fillRequiredFields(wrapper);

    await wrapper.find('form').trigger('submit');

    expect(
      wrapper.find('button[type="submit"]').attributes('disabled'),
    ).toBeDefined();
  });

  it('creates a normalized plant and returns to plot details', async () => {
    const repository = new MockGardenRepository();
    const createPlant = vi.spyOn(repository, 'createPlant');
    const { wrapper, router, store } = await mountForm(repository);
    await selectCulture(wrapper, 'apple');
    wrapper.findComponent(VSelect).vm.$emit('update:modelValue', 'Антоновка');
    await field(wrapper, 'Год посадки')?.find('input').setValue('2020');
    await field(wrapper, 'Место внутри участка')
      ?.find('input')
      .setValue('  у забора  ');
    await field(wrapper, 'Количество')?.find('input').setValue('2');
    await field(wrapper, 'Пользовательское название')
      ?.find('input')
      .setValue('  Любимая яблоня  ');

    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(createPlant).toHaveBeenCalledWith({
      plotId: 'dacha',
      cultureId: 'apple',
      variety: 'Антоновка',
      plantedYear: 2020,
      locationNote: 'у забора',
      quantity: 2,
      customName: 'Любимая яблоня',
    });
    expect(router.currentRoute.value.path).toBe('/plots/dacha');
    expect(
      store.categorySummaries.find(
        (summary) => summary.category === 'fruit-berry',
      )?.count,
    ).toBe(33);
  });

  it.each([
    { customName: 'Аб', valid: false },
    { customName: 'Абв', valid: true },
    { customName: 'А'.repeat(200), valid: true },
    { customName: 'А'.repeat(201), valid: false },
    { customName: '   ', valid: true },
  ])('validates custom name length: %j', async (testCase) => {
    const repository = new MockGardenRepository();
    const createPlant = vi.spyOn(repository, 'createPlant');
    const { wrapper } = await mountForm(repository);
    await fillRequiredFields(wrapper);
    await field(wrapper, 'Пользовательское название')
      ?.find('input')
      .setValue(testCase.customName);

    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(createPlant).toHaveBeenCalledTimes(testCase.valid ? 1 : 0);
    if (!testCase.valid) {
      expect(wrapper.text()).toContain(
        'Название должно содержать от 3 до 200 символов',
      );
    }
  });

  it('returns to plot details on cancel without creating a plant', async () => {
    const repository = new MockGardenRepository();
    const createPlant = vi.spyOn(repository, 'createPlant');
    const { wrapper, router } = await mountForm(repository);

    const cancel = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Отмена'));
    expect(cancel).toBeDefined();
    await cancel?.trigger('click');
    await vi.waitFor(() => {
      expect(router.currentRoute.value.path).toBe('/plots/dacha');
    });
    expect(createPlant).not.toHaveBeenCalled();
  });

  it('shows an error and keeps entered values when saving fails', async () => {
    const repository = new MockGardenRepository();
    repository.createPlant = () => Promise.reject(new Error('fail'));
    const { wrapper, router } = await mountForm(repository);
    await fillRequiredFields(wrapper);
    const customName = field(wrapper, 'Пользовательское название');
    await customName?.find('input').setValue('Любимая яблоня');

    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(wrapper.text()).toContain('Не удалось сохранить посадку');
    expect(router.currentRoute.value.path).toBe('/plots/dacha/plants/new');
    expect((customName?.find('input').element as HTMLInputElement).value).toBe(
      'Любимая яблоня',
    );
    expect(wrapper.findComponent(VAutocomplete).props('modelValue')).toBe(
      'apple',
    );
  });

  it('shows not found instead of the form for an unknown plot', async () => {
    const { wrapper } = await mountForm(
      new MockGardenRepository(),
      'missing-plot',
    );

    expect(wrapper.text()).toContain('Участок не найден');
    expect(wrapper.find('form').exists()).toBe(false);
  });

  it('does not use emoji or unsupported controls', async () => {
    const { wrapper } = await mountForm(new MockGardenRepository());

    expect(wrapper.html()).not.toMatch(
      /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u,
    );
    expect(wrapper.text()).not.toContain('Редактировать');
    expect(wrapper.text()).not.toContain('Удалить');
    expect(wrapper.text()).not.toContain('История');
  });
});
