# Gardenly

«Персональный агроном» — мобильное приложение для садоводов-любителей, которое отвечает на вопрос: **«Что нужно сделать с моим садом сегодня?»**

## Стек

Nuxt 4 · Vue 3 · TypeScript · SPA · Vuetify 3 · Pinia. На первом этапе данные локальные, доступ к ним — через `GardenRepository`.

## Документация

- [Продуктовое ТЗ](docs/personal-agronom-mvp.md)
- [Конституция проекта](openspec/constitution.md)
- [Инструкции для AI-агентов](AGENTS.md)
- Активные изменения: `openspec/changes/`
- Спецификации реализованной системы: `openspec/specs/`

## Текущий статус

Приложение ещё не реализовано. Подготовлен change `bootstrap-app`: каркас Nuxt, основная навигация, feature-first архитектура, ESLint, Vitest и обязательные проверки качества.

Полезные команды OpenSpec:

```bash
openspec list
openspec status --change bootstrap-app
openspec validate bootstrap-app --strict
```
