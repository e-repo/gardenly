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

## Запуск и проверки

```bash
npm install
npm run dev
```

Обязательные проверки качества:

```bash
npm run audit
npm run audit:production
npm run lint
npm run format:check
npm run typecheck
npm run test
npm run build
```

Команды audit проверяют соответственно полное и production-дерево зависимостей. Любое известное замечание блокирует завершение change. При замечании сначала изучи `npm audit`, затем примени совместимое обновление или обоснованный override и повтори все проверки. Не используй `npm audit fix --force`: он может молча изменить мажорные версии или откатить принятый стек.

Pre-commit hook ограничивает обычный коммит 40 файлами. Только для инициализации репозитория можно явно установить `GARDENLY_ALLOW_LARGE_INIT_COMMIT=1`; для обычных коммитов изменения следует разделять.

## Текущий статус

Реализован мобильный каркас Nuxt с русской локалью, тремя основными разделами и нижней навигацией. Настроены feature-first структура, ESLint, Prettier, Vitest и обязательные проверки качества.

Полезные команды OpenSpec:

```bash
openspec list
openspec status --change bootstrap-app
openspec validate bootstrap-app --strict
```

## Проверка мобильного интерфейса

### Chrome DevTools

Для ежедневной проверки использовать **Chrome DevTools → Toggle device toolbar / Device Toolbar** и задавать ширину 390 px. Это подходит для вёрстки, touch-событий и общего mobile layout, но не является эмуляцией Android или WebView.

### Реальный телефон без APK

Запустить dev-сервер с доступом из локальной сети:

```bash
npm run dev -- --host 0.0.0.0
```

На телефоне, подключённом к той же Wi-Fi сети, открыть в Chrome `http://<IP-компьютера>:3000`.

### Android-эмулятор

Для полноценной проверки Android использовать **Android Studio → Device Manager** и создать или запустить виртуальное устройство. В Chrome эмулятора открыть `http://10.0.2.2:3000`: этот адрес указывает на компьютер, где запущен dev-сервер.

Расширение VS Code не требуется: оно в основном запускает тот же Android-эмулятор. Для текущего Nuxt SPA достаточно Chrome и реального телефона по Wi-Fi, а Android Studio нужен при полноценной проверке Android. После добавления Capacitor нативную оболочку можно будет запускать из Android Studio кнопкой **Run**, без ручной установки APK.
