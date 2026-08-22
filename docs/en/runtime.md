---
title: Runtime and lifecycle
description: Activation, deactivation, commands, timeouts, and the Worker sandbox.
locale: en
order: 4
---

# Runtime and lifecycle

The entry file must assign `globalThis.neuroNotesPlugin`. Its
`activate(context)` method runs during activation and the optional
`deactivate()` method runs when the plugin stops.

`context.commands.registerCommand({ id, title, description?, run })` returns a
disposable. All subscriptions are disposed in reverse order. Activation has a
five-second timeout and command execution has a fifteen-second timeout.

The Worker does not inherit the page DOM or network APIs. Community settings,
iframe runtime, and vault/network/editor/clipboard/native RPC are not available
yet. Their manifest fields remain valid for future compatibility and produce
warnings today.
