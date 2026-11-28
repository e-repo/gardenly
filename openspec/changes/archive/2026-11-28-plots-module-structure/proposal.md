# Proposal

## Why

`app/modules/plots/components/` смешивает три фичи (обзор сада, детали участка, создание участка) — уже 10 файлов, а `add-plant` и `edit-plant` добавят ещё. Навигация по модулю деградирует.

## What Changes

- Разнести модуль `plots` по фичам: `garden/` (обзор, свои `components/` и `store.ts`), `plot-details/` (детальный экран, свои `components/` и `store.ts`), `plot-create/` (форма создания).
- Общие внутри модуля `weather.ts` и `plants.ts` остаются в корне `app/modules/plots/`.
- Обновить импорты в страницах и тестах. Поведение, публичные контракты и имена Pinia-store не меняются.

Целевая структура:

```text
app/modules/plots/
├── garden/                    # экран «Мой сад»
│   ├── components/            # GardenOverview, GardenContent, GardenLoading,
│   │                          # GardenLoadError, PlotCard
│   └── store.ts               # бывший store.ts
├── plot-details/              # детальный экран
│   ├── components/            # PlotDetails, PlotDetailsContent, PlotDetailsLoading,
│   │                          # PlotDetailsLoadError, PlotNotFound, PlantListItem
│   └── store.ts               # бывший plot-details-store.ts (имя store в Pinia не меняется)
├── plot-create/
│   └── components/            # PlotCreateForm
├── weather.ts                 # общее внутри модуля: используется и в garden, и в details
└── plants.ts                  # категории/иконки: понадобятся и add-plant
```

## Capabilities

Чистый рефакторинг без изменения наблюдаемого поведения — спеки не затрагиваются (`skip_specs: true`).

## Impact

- Только перемещение файлов и правка импортов в `app/` и `test/`.
- Выполняется после архива `plot-details` и до apply `add-plant`, чтобы не переносить новые файлы дважды.
