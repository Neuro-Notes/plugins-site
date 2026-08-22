---
title: Manifest
description: manifest.json fields, identifier constraints, and versioning.
locale: en
order: 3
---

# Manifest

Required fields are `id`, `name`, `version`, and `apiVersion`. A safe relative
`entry` is also required for community runtimes.

- `id`: 2–80 characters using lowercase Latin letters, digits, `.`, `_`, `-`.
- `version`: a SemVer-like version such as `1.2.0` or `1.2.0-beta.1`.
- `apiVersion`: the current client accepts only the string `1`.
- `runtime`: `worker`, `iframe`, or `system`; community plugins should use
  `worker`. Other values receive a compatibility warning.
- `activationEvents`: `onStartupFinished`, `onCommand:<id>`, `onFile:<pattern>`,
  or `onView:<id>`.
- `contributes.commands`: up to 64 commands with unique IDs.

`entry` cannot be absolute or contain `..` or backslashes. A marketplace release
tag must match `version`; a leading `v` in the tag is accepted.
