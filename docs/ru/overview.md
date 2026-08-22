---
title: Обзор API v1
description: Что представляет собой community-плагин Neuro Notes и какие возможности доступны сейчас.
locale: ru
order: 1
---

# Обзор API v1

Community-плагин — это директория внутри `/.nnotes/plugins/<plugin-id>` с
`manifest.json` и JavaScript entry-файлом. Плагины выключены по умолчанию и
запускаются в отдельном Web Worker после явного включения пользователем.

Текущий Worker runtime позволяет регистрировать и выполнять команды. Прямой
доступ к `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource` и
`importScripts` заблокирован. Manifest уже описывает будущие permissions и
contributions, но площадка помечает ещё не подключённые возможности warnings.

Marketplace не запускает код плагина и не хранит архивы. Он проверяет manifest
и existence entry-файла в опубликованном GitHub release, после чего заявка
проходит ручную модерацию.
