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
import PlotDetails from '~/modules/plots/plot-details/components/PlotDetails.vue';
import { usePlotDetailsStore } from '~/modules/plots/plot-details/store';

const { repositoryRef } = vi.hoisted(() => ({
  repositoryRef: { current: null as GardenRepository | null },
}));

mockNuxtImport('useGardenRepository', () => () => repositoryRef.current);

class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('IntersectionObserver', IntersectionObserverStub);
window.HTMLElement.prototype.scrollIntoView = vi.fn();

const DetailsTestHost = defineComponent({
  components: { PlotDetails, VApp },
  template: '<v-app><PlotDetails /></v-app>',
});

async function mountDetails(repository: GardenRepository, plotId: string) {
  repositoryRef.current = repository;
  setActivePinia(createPinia());

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/garden', component: { template: '<div />' } },
      { path: '/plots/:plotId', component: { template: '<div />' } },
      { path: '/plots/:plotId/plants/new', component: { template: '<div />' } },
    ],
  });
  await router.push(`/plots/${plotId}`);
  await router.isReady();

  return mount(DetailsTestHost, {
    global: {
      plugins: [
        router,
        createVuetify(),
        createI18n({ legacy: false, locale: 'ru', messages: { ru } }),
      ],
    },
  });
}

describe('PlotDetails', () => {
  beforeEach(() => {
    repositoryRef.current = null;
    vi.setSystemTime(new Date('2026-11-22T12:00:00Z'));
  });

  it('shows a loading indicator while data is loading', async () => {
    const wrapper = await mountDetails(new MockGardenRepository(), 'dacha');

    expect(wrapper.text()).toContain('Загружаем участок');
    expect(wrapper.find('.v-progress-circular').exists()).toBe(true);
  });

  it('renders header and collapsed category sections in fixed order', async () => {
    const wrapper = await mountDetails(new MockGardenRepository(), 'dacha');
    await flushPromises();

    const text = wrapper.text();
    expect(text).toContain('Дача');
    expect(text).toContain('Новая Усмань');
    expect(text).toContain('+18 °C');
    expect(wrapper.find('a[href="/garden"]').exists()).toBe(true);

    const sections = [
      'Плодовые и ягодные культуры',
      'Огород',
      'Лиственные и хвойные',
      'Цветы',
    ];
    const positions = sections.map((name) => text.indexOf(name));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions]).toEqual([...positions].sort((a, b) => a - b));

    expect(text).toContain('· 32');
    expect(wrapper.findAll('.v-expansion-panel--active')).toHaveLength(0);
    expect(text).not.toContain('Антоновка');
  });

  it('loads category plants on first expand', async () => {
    const wrapper = await mountDetails(new MockGardenRepository(), 'dacha');
    await flushPromises();

    const titles = wrapper.findAll('.v-expansion-panel-title');
    await titles[0]?.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('Вишня Молодёжная');
    expect(wrapper.text()).toContain('Груша Чижовская');
    expect(wrapper.text()).toContain('6 лет');
    expect(wrapper.text()).toContain('1 шт.');
    expect(wrapper.text()).toContain('у калитки');
  });

  it('collapses the previous section when another one expands', async () => {
    const wrapper = await mountDetails(new MockGardenRepository(), 'dacha');
    await flushPromises();

    const titles = wrapper.findAll('.v-expansion-panel-title');
    await titles[0]?.trigger('click');
    await flushPromises();
    await titles[1]?.trigger('click');
    await flushPromises();

    const active = wrapper.findAll('.v-expansion-panel--active');
    expect(active).toHaveLength(1);
    expect(active[0]?.text()).toContain('Огород');
    expect(wrapper.text()).toContain('Томат Бычье сердце');
  });

  it('shows an empty composition message for a plot without plants', async () => {
    const wrapper = await mountDetails(new MockGardenRepository(), 'home');
    await flushPromises();

    expect(wrapper.text()).toContain('Дом');
    expect(wrapper.text()).toContain('На этом участке пока нет посадок');
    expect(wrapper.findAll('.v-expansion-panel')).toHaveLength(0);
  });

  it('shows not found for an unknown plot', async () => {
    const wrapper = await mountDetails(
      new MockGardenRepository(),
      'missing-plot',
    );
    await flushPromises();

    expect(wrapper.text()).toContain('Участок не найден');
    expect(wrapper.find('a[href="/garden"]').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('Дача');
  });

  it('shows an error message instead of partial content', async () => {
    const repository = new MockGardenRepository();
    repository.getCultures = () => Promise.reject(new Error('fail'));
    const wrapper = await mountDetails(repository, 'dacha');
    await flushPromises();

    expect(wrapper.text()).toContain('Не удалось загрузить данные участка');
    expect(wrapper.findAll('.v-expansion-panel')).toHaveLength(0);
    expect(wrapper.text()).not.toContain('Новая Усмань');
  });

  it('does not use emoji or unsupported controls', async () => {
    const wrapper = await mountDetails(new MockGardenRepository(), 'dacha');
    await flushPromises();

    await wrapper.findAll('.v-expansion-panel-title')[0]?.trigger('click');
    await flushPromises();

    expect(wrapper.html()).not.toMatch(
      /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u,
    );
    expect(wrapper.text()).not.toContain('Редактировать');
    expect(wrapper.text()).not.toContain('Удалить');
    expect(wrapper.text()).not.toContain('История');
  });
});

describe('PlotDetails add plant', () => {
  it('links to plant creation below the categories', async () => {
    const wrapper = await mountDetails(new MockGardenRepository(), 'dacha');
    await flushPromises();

    const link = wrapper.find('a[href="/plots/dacha/plants/new"]');
    expect(link.exists()).toBe(true);
    expect(link.text()).toContain('Добавить растение');
  });

  it('offers the first plant action in an empty composition', async () => {
    const wrapper = await mountDetails(new MockGardenRepository(), 'home');
    await flushPromises();

    const link = wrapper.find('a[href="/plots/home/plants/new"]');
    expect(link.exists()).toBe(true);
    expect(link.text()).toContain('Добавить растение');
  });

  it('shows a created plant in its section with an updated count', async () => {
    const wrapper = await mountDetails(new MockGardenRepository(), 'dacha');
    await flushPromises();
    const store = usePlotDetailsStore();

    await store.createPlant({
      plotId: 'dacha',
      cultureId: 'tomato',
      variety: 'Сливка',
      plantedYear: 2020,
    });
    await flushPromises();
    await wrapper.findAll('.v-expansion-panel-title')[1]?.trigger('click');
    await flushPromises();

    const active = wrapper.find('.v-expansion-panel--active');
    expect(active.text()).toContain('Огород');
    expect(active.text()).toContain('· 2');
    expect(active.text()).toContain('Томат Сливка');
  });
});
