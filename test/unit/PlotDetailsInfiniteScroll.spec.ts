import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, nextTick } from 'vue';
import { createI18n } from 'vue-i18n';
import { createMemoryHistory, createRouter } from 'vue-router';
import { createVuetify } from 'vuetify';
import { VApp } from 'vuetify/components';
import { MockGardenRepository } from '~/data/mock-garden-repository';
import type {
  CultureCategory,
  GardenRepository,
  Plant,
  PlantsPage,
} from '~/domain/garden';
import ru from '~/i18n/locales/ru.json';
import PlotDetails from '~/modules/plots/components/PlotDetails.vue';

const { repositoryRef } = vi.hoisted(() => ({
  repositoryRef: { current: null as GardenRepository | null },
}));

mockNuxtImport('useGardenRepository', () => () => repositoryRef.current);

class IntersectingObserverStub {
  private readonly callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }
  observe(target: Element) {
    this.callback(
      [{ isIntersecting: true, target } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('IntersectionObserver', IntersectingObserverStub);
window.HTMLElement.prototype.scrollIntoView = vi.fn();

const DetailsTestHost = defineComponent({
  components: { PlotDetails, VApp },
  template: '<v-app><PlotDetails /></v-app>',
});

async function mountDetails(repository: GardenRepository) {
  repositoryRef.current = repository;
  setActivePinia(createPinia());

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/garden', component: { template: '<div />' } },
      { path: '/plots/:plotId', component: { template: '<div />' } },
    ],
  });
  await router.push('/plots/dacha');
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

async function settle(milliseconds = 400) {
  await flushPromises();
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
  await flushPromises();
}

function pagedRepository(pagesCount: number): GardenRepository {
  const repository = new MockGardenRepository();
  repository.getPlantCategorySummaries = () =>
    Promise.resolve([{ category: 'fruit-berry', count: pagesCount }]);
  repository.getPlantsByPlotCategory = (
    _plotId: string,
    _category: CultureCategory,
    page?: { pageToken?: string },
  ): Promise<PlantsPage> => {
    const index = page?.pageToken ? Number(page.pageToken) : 0;
    const plant: Plant = {
      id: `plant-${String(index)}`,
      plotId: 'dacha',
      cultureId: 'apple',
      quantity: 1,
      createdAt: '2026-01-01T00:00:00Z',
    };
    const result: PlantsPage = { plants: [plant] };
    if (index + 1 < pagesCount) {
      result.nextPageToken = String(index + 1);
    }
    return Promise.resolve(result);
  };
  return repository;
}

function twoCategoryRepository(pagesCount: number): GardenRepository {
  const paged = pagedRepository(pagesCount);
  const pagedPlants = paged.getPlantsByPlotCategory;
  paged.getPlantCategorySummaries = () =>
    Promise.resolve([
      { category: 'fruit-berry', count: pagesCount },
      { category: 'vegetable', count: 1 },
    ]);
  paged.getPlantsByPlotCategory = (plotId, category, page) =>
    category === 'vegetable'
      ? new MockGardenRepository().getPlantsByPlotCategory(
          plotId,
          category,
          page,
        )
      : pagedPlants(plotId, category, page);
  return paged;
}

describe('PlotDetails infinite scroll', () => {
  it('hides the loader after the only page is loaded', async () => {
    const wrapper = await mountDetails(new MockGardenRepository());
    await settle(50);

    await wrapper.findAll('.v-expansion-panel-title')[1]?.trigger('click');
    await settle(50);

    const panel = wrapper.findAll('.v-expansion-panel')[1];
    expect(wrapper.text()).toContain('Томат Бычье сердце');
    expect(
      panel?.find('.v-infinite-scroll .v-progress-circular').exists(),
    ).toBe(false);
    expect(panel?.text()).not.toContain('Показать ещё');
  });

  it('auto-loads three pages and then shows the manual action', async () => {
    const wrapper = await mountDetails(pagedRepository(5));
    await settle(50);

    await wrapper.findAll('.v-expansion-panel-title')[0]?.trigger('click');
    await settle(800);

    expect(wrapper.findAll('.v-list-item')).toHaveLength(4);
    expect(wrapper.text()).toContain('Показать ещё');

    const showMore = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Показать ещё'));
    await showMore?.trigger('click');
    await settle(100);

    expect(wrapper.findAll('.v-list-item')).toHaveLength(5);
    expect(wrapper.text()).not.toContain('Показать ещё');
  });

  it('resumes auto-loading after collapse and reopen', async () => {
    const wrapper = await mountDetails(pagedRepository(5));
    await settle(50);

    const title = wrapper.findAll('.v-expansion-panel-title')[0];
    await title?.trigger('click');
    await settle(800);
    expect(wrapper.text()).toContain('Показать ещё');

    await title?.trigger('click');
    await settle(100);
    await title?.trigger('click');
    await settle(800);

    expect(wrapper.findAll('.v-list-item')).toHaveLength(5);
    expect(wrapper.text()).not.toContain('Показать ещё');
  });

  it('resumes auto-loading after switching to another section and back', async () => {
    const wrapper = await mountDetails(twoCategoryRepository(5));
    await settle(50);

    const titles = wrapper.findAll('.v-expansion-panel-title');
    await titles[0]?.trigger('click');
    await settle(800);
    expect(wrapper.text()).toContain('Показать ещё');

    await titles[1]?.trigger('click');
    await settle(200);
    expect(wrapper.text()).toContain('Томат Бычье сердце');

    await titles[0]?.trigger('click');
    await settle(800);

    const panel = wrapper.findAll('.v-expansion-panel')[0];
    expect(panel?.findAll('.v-list-item')).toHaveLength(5);
    expect(panel?.text()).not.toContain('Показать ещё');
  });
});
