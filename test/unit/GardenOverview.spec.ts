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
import GardenOverview from '~/modules/plots/garden/components/GardenOverview.vue';

const { repositoryRef } = vi.hoisted(() => ({
  repositoryRef: { current: null as GardenRepository | null },
}));

mockNuxtImport('useGardenRepository', () => () => repositoryRef.current);

const OverviewTestHost = defineComponent({
  components: { GardenOverview, VApp },
  template: '<v-app><GardenOverview /></v-app>',
});

async function mountOverview(repository: GardenRepository) {
  repositoryRef.current = repository;
  setActivePinia(createPinia());

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/garden', component: { template: '<div />' } },
      { path: '/settings', component: { template: '<div />' } },
      { path: '/plots/new', component: { template: '<div />' } },
    ],
  });
  await router.push('/garden');
  await router.isReady();

  return mount(OverviewTestHost, {
    global: {
      plugins: [
        router,
        createVuetify(),
        createI18n({ legacy: false, locale: 'ru', messages: { ru } }),
      ],
    },
  });
}

describe('GardenOverview', () => {
  beforeEach(() => {
    repositoryRef.current = null;
  });

  it('shows a loading indicator while data is loading', async () => {
    const wrapper = await mountOverview(new MockGardenRepository());

    expect(wrapper.text()).toContain('Загружаем ваш сад');
    expect(wrapper.find('.v-progress-circular').exists()).toBe(true);
  });

  it('renders profile, CTA and plot cards with their weather', async () => {
    const wrapper = await mountOverview(new MockGardenRepository());
    await flushPromises();

    expect(wrapper.text()).toContain('Привет, Евгений!');
    expect(wrapper.find('a[href="/settings"]').exists()).toBe(true);

    const cta = wrapper.find('a[href="/plots/new"]');
    expect(cta.exists()).toBe(true);
    expect(cta.text()).toContain('Добавить участок');

    const cards = wrapper.findAll('.v-card');
    expect(cards).toHaveLength(2);
    expect(cards[0]?.attributes('href')).toBe('/plots/dacha');
    expect(cards[0]?.text()).toContain('Дача');
    expect(cards[0]?.text()).toContain('Новая Усмань');
    expect(cards[0]?.text()).toContain('+18 °C');
    expect(cards[1]?.attributes('href')).toBe('/plots/home');
    expect(cards[1]?.text()).toContain('Дом');
    expect(cards[1]?.text()).toContain('+16 °C');
  });

  it('shows an understandable fallback for a plot without weather', async () => {
    const repository = new MockGardenRepository();
    await repository.createPlot({ name: 'Теплица', locationLabel: 'За домом' });
    const wrapper = await mountOverview(repository);
    await flushPromises();

    const cards = wrapper.findAll('.v-card');
    expect(cards).toHaveLength(3);
    expect(cards[2]?.text()).toContain('Теплица');
    expect(cards[2]?.text()).toContain('Погода пока недоступна');
    expect(cards[2]?.text()).not.toContain('°C');
  });

  it('shows an empty state with a working CTA', async () => {
    const repository = new MockGardenRepository();
    repository.getPlots = () => Promise.resolve([]);
    const wrapper = await mountOverview(repository);
    await flushPromises();

    expect(wrapper.text()).toContain('У вас пока нет участков');
    expect(wrapper.findAll('.v-card')).toHaveLength(0);
    expect(wrapper.find('a[href="/plots/new"]').exists()).toBe(true);
  });

  it('shows an error message instead of a partial list', async () => {
    const repository = new MockGardenRepository();
    repository.getPlots = () => Promise.reject(new Error('fail'));
    const wrapper = await mountOverview(repository);
    await flushPromises();

    expect(wrapper.text()).toContain('Не удалось загрузить данные сада');
    expect(wrapper.findAll('.v-card')).toHaveLength(0);
    expect(wrapper.text()).not.toContain('Дача');
  });

  it('links plot cards to details without unsupported controls', async () => {
    const wrapper = await mountOverview(new MockGardenRepository());
    await flushPromises();

    expect(wrapper.html()).not.toMatch(
      /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u,
    );
    const cards = wrapper.findAll('.v-card');
    for (const card of cards) {
      expect(card.element.tagName).toBe('A');
      expect(card.find('button').exists()).toBe(false);
    }
    expect(wrapper.text()).not.toContain('Редактировать');
  });
});
