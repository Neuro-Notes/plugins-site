---
title: Manifest
description: Поля manifest.json, ограничения идентификаторов и versioning.
locale: ru
order: 3
---

# Manifest

Обязательные поля: `id`, `name`, `version`, `apiVersion`. Для community runtime
также обязателен безопасный относительный `entry`.

- `id`: 2–80 символов, lowercase latin, цифры, `.`, `_`, `-`.
- `version`: SemVer-подобная версия, например `1.2.0` или `1.2.0-beta.1`.
- `apiVersion`: для текущего клиента только строка `1`.
- `runtime`: `worker`, `iframe` или `system`; для community-плагинов используйте
  `worker`. Остальные значения получают compatibility warning.
- `activationEvents`: `onStartupFinished`, `onCommand:<id>`, `onFile:<pattern>`
  или `onView:<id>`.
- `contributes.commands`: до 64 команд с уникальными ID.

`entry` не может быть абсолютным, содержать `..` или обратные слеши. Release tag
в marketplace должен совпадать с `version`; ведущий `v` в tag допускается.
