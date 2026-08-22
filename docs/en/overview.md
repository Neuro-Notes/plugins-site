---
title: API v1 overview
description: What a Neuro Notes community plugin is and which capabilities work today.
locale: en
order: 1
---

# API v1 overview

A community plugin is a directory under `/.nnotes/plugins/<plugin-id>` containing
`manifest.json` and a JavaScript entry file. Plugins are disabled by default and
run in a dedicated Web Worker after the user explicitly enables them.

The current Worker runtime can register and execute commands. Direct access to
`fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, and `importScripts` is
blocked. The manifest already describes future permissions and contributions,
but the marketplace marks capabilities that are not connected yet with warnings.

The marketplace neither executes plugin code nor stores release archives. It
validates the manifest and entry-file existence in a published GitHub release,
then sends the submission through manual moderation.
