import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent } from 'vue';
import { createI18n } from 'vue-i18n';
import { createMemoryHistory, createRouter } from 'vue-router';
import { createVuetify } from 'vuetify';
import { VApp } from 'vuetify/components';
import AppBottomNavigation from '~/shared/components/AppBottomNavigation.vue';
import ru from '~/i18n/locales/ru.json';

const navigationItems = [
  { path: '/', label: 'Сегодня' },
  { path: '/garden', label: 'Сад' },
  { path: '/settings', label: 'Настройки' },
];

const NavigationTestHost = defineComponent({
  components: { AppBottomNavigation, VApp },
  template: '<v-app><AppBottomNavigation /></v-app>',
});

async function mountNavigation(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: navigationItems.map((item) => ({
      path: item.path,
      component: { template: '<div />' },
    })),
  });
  await router.push(path);
  await router.isReady();

  return mount(NavigationTestHost, {
    global: {
      plugins: [
        router,
        createVuetify(),
        createI18n({ legacy: false, locale: 'ru', messages: { ru } }),
      ],
    },
  });
}

describe('AppBottomNavigation', () => {
  it('renders all navigation items with their target routes', async () => {
    const wrapper = await mountNavigation('/');
    const links = wrapper.findAll('a');

    expect(links).toHaveLength(navigationItems.length);
    expect(links.map((link) => link.text())).toEqual(
      navigationItems.map((item) => item.label),
    );
    expect(links.map((link) => link.attributes('href'))).toEqual(
      navigationItems.map((item) => item.path),
    );
  });

  it.each(navigationItems)(
    'marks only $label as active on $path',
    async ({ path, label }) => {
      const wrapper = await mountNavigation(path);
      const activeLinks = wrapper.findAll('a.v-btn--active');

      expect(activeLinks).toHaveLength(1);
      expect(activeLinks[0]?.text()).toBe(label);
    },
  );
});
