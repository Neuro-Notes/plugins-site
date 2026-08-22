---
title: Разрешения и безопасность
description: Декларация permissions и фактические ограничения текущего runtime.
locale: ru
order: 5
---

# Разрешения и безопасность

Manifest может запрашивать `vault.read/write/delete/watch`, список network
origins, AI, clipboard, editor и native capabilities. Пользователь может
сузить grants перед запуском.

Декларация permission не предоставляет прямой доступ сама по себе. В текущем
community Worker host RPC для vault, network, clipboard, editor и native API
ещё отсутствует. Прямые сетевые примитивы заблокированы независимо от manifest.

Запрашивайте только необходимые permissions и используйте точные vault globs и
network origins. Marketplace показывает все запросы и отдельно предупреждает о
возможностях, которые пока нельзя использовать.
