# Tasks

## 1. Фича обзора сада

- [x] 1.1 Перенести `GardenOverview`, `GardenContent`, `GardenLoading`, `GardenLoadError`, `PlotCard` в `app/modules/plots/garden/components/`, а `store.ts` — в `app/modules/plots/garden/store.ts`; обновить внутренние импорты и `app/pages/garden.vue`, не меняя логику. Проверить, что все шесть файлов находятся на новых местах, а экспорты и Pinia-ID `plots` прежние.
- [x] 1.2 Обновить import-path в `test/unit/GardenOverview.spec.ts` и `test/unit/plots-store.spec.ts`; прогнать `npm run test -- test/unit/GardenOverview.spec.ts test/unit/plots-store.spec.ts` и убедиться, что оба набора проходят без изменения тестовых сценариев.

## 2. Фича деталей участка

- [x] 2.1 Перенести `PlotDetails`, `PlotDetailsContent`, `PlotDetailsLoading`, `PlotDetailsLoadError`, `PlotNotFound`, `PlantListItem` в `app/modules/plots/plot-details/components/`, а `plot-details-store.ts` — в `app/modules/plots/plot-details/store.ts`; обновить внутренние импорты и `app/pages/plots/[plotId].vue`. Проверить, что экспорты, Pinia-ID `plot-details` и импорты общих `weather.ts`/`plants.ts` сохранены.
- [x] 2.2 Обновить import-path в `test/unit/PlotDetails.spec.ts`, `test/unit/PlotDetailsInfiniteScroll.spec.ts` и `test/unit/plot-details-store.spec.ts`; прогнать `npm run test -- test/unit/PlotDetails.spec.ts test/unit/PlotDetailsInfiniteScroll.spec.ts test/unit/plot-details-store.spec.ts` и убедиться, что все наборы проходят без изменения тестовых сценариев.

## 3. Фича создания участка

- [x] 3.1 Перенести `PlotCreateForm.vue` в `app/modules/plots/plot-create/components/`, обновить его импорт `usePlotsStore` из `garden/store` и импорт формы в `app/pages/plots/new.vue`. Проверить, что поведение формы и маршрут `/plots/new` не изменились.
- [x] 3.2 Обновить import-path в `test/unit/PlotCreateForm.spec.ts`; прогнать `npm run test -- test/unit/PlotCreateForm.spec.ts` и убедиться, что набор проходит без изменения тестовых сценариев.

## 4. Интеграционные проверки

- [x] 4.1 Проверить поиском отсутствие ссылок на `~/modules/plots/components`, `~/modules/plots/store` и `~/modules/plots/plot-details-store`, отсутствие старого каталога `components/` и соответствие итоговой структуры `design.md`; прогнать quality gates: `npm run audit`, `npm run audit:production`, `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm run test`, `npm run build` — все команды должны завершиться успешно.
- [x] 4.2 Выполнить Chrome smoke-сценарий на ширине 390 px: открыть `/garden`, перейти к созданию участка и проверить отмену и успешное создание, открыть карточку участка, раскрыть категорию посадок и вернуться в сад. Убедиться, что навигация, отображение и действия работают как до перемещения, без ошибок в консоли.
