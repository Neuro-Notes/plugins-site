---
title: Permissions and security
description: Permission declarations and the effective limits of the current runtime.
locale: en
order: 5
---

# Permissions and security

A manifest can request `vault.read/write/delete/watch`, network origins, AI,
clipboard, editor, and native capabilities. The user can narrow those grants
before a plugin starts.

Declaring a permission does not provide direct access on its own. The current
community Worker does not yet expose host RPC for vault, network, clipboard,
editor, or native APIs. Direct network primitives remain blocked regardless of
the manifest.

Request only the permissions you need and use precise vault globs and network
origins. The marketplace displays every request and separately warns about
capabilities that cannot be used yet.
