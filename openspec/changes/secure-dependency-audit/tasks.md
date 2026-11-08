# Tasks

## 1. Безопасное дерево зависимостей

- [ ] 1.1 Добавить в `package.json` точечные overrides `deepmerge@4.1.2`, `glob@14.0.4`, `minimatch@11.0.5` и команды `audit`/`audit:production` с `--audit-level=low`; выполнить `npm install`. Проверка: `npm ls deepmerge glob minimatch --all` показывает выбранные версии без ошибок, `npm run audit` и `npm run audit:production` сообщают о нуле замечаний, а Nuxt 4, ESLint 10, TypeScript ESLint 8 и Vue Test Utils 2.5 сохранены.
- [ ] 1.2 Проверить совместимость overrides до изменения постоянных правил: выполнить `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm run test`, `npm run build` и браузерный smoke-сценарий трёх основных маршрутов. Проверка: все команды проходят, страницы и touch-навигация работают без изменения продуктового поведения; при ошибке overrides откатываются, а design пересматривается.

## 2. Постоянные правила и документация

- [ ] 2.1 После успешной проверки совместимости добавить `npm run audit` и `npm run audit:production` в обязательные quality gates `openspec/constitution.md`, явно зафиксировать блокирование при любом замечании и запрет `--force` в проверяющих командах; дополнить `README.md` этими командами и безопасным порядком разбора audit. Проверка: документы содержат одинаковые команды и правила, `npm run format:check` проходит.

## 3. Интеграционная проверка

- [ ] 3.1 Выполнить `npm run audit`, `npm run audit:production`, `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm run test` и `npm run build` на итоговом дереве. Проверка: все семь команд завершаются успешно, оба audit сообщают о нуле замечаний, production-сборка по-прежнему содержит три основных маршрута.
