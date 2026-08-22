---
title: Quick start
description: Minimal directory structure and command registration for a Worker plugin.
locale: en
order: 2
---

# Quick start

Create a plugin directory:

```text
my-plugin/
├── manifest.json
└── main.js
```

Minimal manifest:

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

Entry file:

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

For manual installation, copy the entire directory to
`/.nnotes/plugins/my-plugin`, open plugin settings, refresh the list, inspect
permissions, and enable the plugin.
