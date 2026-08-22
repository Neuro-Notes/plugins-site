---
title: Runtime и lifecycle
description: Активация, деактивация, команды, таймауты и sandbox Worker.
locale: ru
order: 4
---

# Runtime и lifecycle

Entry-файл должен присвоить объект `globalThis.neuroNotesPlugin`. Его метод
`activate(context)` вызывается при активации, а необязательный `deactivate()` —
при остановке.

`context.commands.registerCommand({ id, title, description?, run })` возвращает
disposable. Все subscriptions освобождаются в обратном порядке. Активация
ограничена пятью секундами, выполнение команды — пятнадцатью.

Worker не наследует DOM и сетевые API страницы. Настройки community-плагина,
iframe runtime, vault/network/editor/clipboard/native RPC пока не реализованы.
Поля разрешены схемой для совместимости будущих версий, но отображаются как
warnings.
