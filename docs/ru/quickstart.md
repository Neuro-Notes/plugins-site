---
title: Быстрый старт
description: Минимальная структура и команда для первого worker-плагина.
locale: ru
order: 2
---

# Быстрый старт

Создайте директорию плагина:

```text
my-plugin/
├── manifest.json
└── main.js
```

Минимальный manifest:

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "apiVersion": "1",
  "runtime": "worker",
  "entry": "main.js",
  "activationEvents": ["onStartupFinished"],
  "contributes": {
    "commands": [{ "id": "my-plugin.hello", "title": "My Plugin: Hello" }]
  }
}
```

Entry-файл:

```js
globalThis.neuroNotesPlugin = {
  activate(context) {
    context.commands.registerCommand({
      id: 'my-plugin.hello',
      title: 'My Plugin: Hello',
      run(name = 'Neuro Notes') {
        return `Hello, ${name}`
      }
    })
  }
}
```

Для ручной установки скопируйте всю директорию в
`/.nnotes/plugins/my-plugin`, откройте настройки плагинов, обновите список,
проверьте permissions и включите плагин.
