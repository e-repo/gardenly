import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';
import { createI18n } from 'vue-i18n';
import { createMemoryHistory, createRouter } from 'vue-router';
import { createVuetify } from 'vuetify';
import { VApp } from 'vuetify/components';
import { MockGardenRepository } from '~/data/mock-garden-repository';
import type { GardenRepository } from '~/domain/garden';
import ru from '~/i18n/locales/ru.json';
import PlotCreateForm from '~/modules/plots/plot-create/components/PlotCreateForm.vue';
import { usePlotsStore } from '~/modules/plots/garden/store';

const { repositoryRef } = vi.hoisted(() => ({
  repositoryRef: { current: null as GardenRepository | null },
}));

mockNuxtImport('useGardenRepository', () => () => repositoryRef.current);

const FormTestHost = defineComponent({
  components: { PlotCreateForm, VApp },
  template: '<v-app><PlotCreateForm /></v-app>',
});

async function mountForm(repository: GardenRepository) {
  repositoryRef.current = repository;
  setActivePinia(createPinia());

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/garden', component: { template: '<div />' } },
      { path: '/plots/new', component: { template: '<div />' } },
    ],
  });
  await router.push('/plots/new');
  await router.isReady();

  const wrapper = mount(FormTestHost, {
    global: {
      plugins: [
        router,
        createVuetify(),
        createI18n({ legacy: false, locale: 'ru', messages: { ru } }),
      ],
    },
  });

  return { wrapper, router };
}

describe('PlotCreateForm', () => {
  beforeEach(() => {
    repositoryRef.current = null;
  });

  it('requires name and location and does not call the repository', async () => {
    const repository = new MockGardenRepository();
    const createPlot = vi.spyOn(repository, 'createPlot');
    const { wrapper } = await mountForm(repository);

    await wrapper.find('form').trigger('submit');

    expect(wrapper.text()).toContain('Введите название участка');
    expect(wrapper.text()).toContain('Введите локацию участка');
    expect(createPlot).not.toHaveBeenCalled();
  });

  it('rejects values consisting only of whitespace', async () => {
    const repository = new MockGardenRepository();
    const createPlot = vi.spyOn(repository, 'createPlot');
    const { wrapper } = await mountForm(repository);

    const inputs = wrapper.findAll('input');
    await inputs[0]?.setValue('   ');
    await inputs[1]?.setValue('  ');
    await wrapper.find('form').trigger('submit');

    expect(wrapper.text()).toContain('Введите название участка');
    expect(createPlot).not.toHaveBeenCalled();
  });

  it('blocks repeated submission while saving', async () => {
    const repository = new MockGardenRepository();
    repository.createPlot = () => new Promise(() => {});
    const { wrapper } = await mountForm(repository);

    const inputs = wrapper.findAll('input');
    await inputs[0]?.setValue('Теплица');
    await inputs[1]?.setValue('За домом');
    await wrapper.find('form').trigger('submit');

    const submit = wrapper.find('button[type="submit"]');
    expect(submit.attributes('disabled')).toBeDefined();
  });

  it('creates a normalized plot and returns to /garden', async () => {
    const repository = new MockGardenRepository();
    const { wrapper, router } = await mountForm(repository);
    const store = usePlotsStore();

    const inputs = wrapper.findAll('input');
    await inputs[0]?.setValue('  Теплица  ');
    await inputs[1]?.setValue(' За домом ');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/garden');
    const created = store.plots.at(-1);
    expect(created?.name).toBe('Теплица');
    expect(created?.locationLabel).toBe('За домом');
    expect(store.weatherByPlotId[created?.id ?? '']).toBeNull();
  });

  it('returns to /garden on cancel without creating a plot', async () => {
    const repository = new MockGardenRepository();
    const createPlot = vi.spyOn(repository, 'createPlot');
    const { wrapper, router } = await mountForm(repository);

    const cancel = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Отмена');
    await cancel?.trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/garden');
    expect(createPlot).not.toHaveBeenCalled();
  });

  it('shows an error and keeps entered values when saving fails', async () => {
    const repository = new MockGardenRepository();
    repository.createPlot = () => Promise.reject(new Error('fail'));
    const { wrapper, router } = await mountForm(repository);

    const inputs = wrapper.findAll('input');
    await inputs[0]?.setValue('Теплица');
    await inputs[1]?.setValue('За домом');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(wrapper.text()).toContain('Не удалось сохранить участок');
    expect(router.currentRoute.value.path).toBe('/plots/new');
    expect((inputs[0]?.element as HTMLInputElement).value).toBe('Теплица');
    expect((inputs[1]?.element as HTMLInputElement).value).toBe('За домом');
  });
});
