---
title: Публикация через GitHub
description: Требования к repository, release и процессу ручной модерации.
locale: ru
order: 6
---

# Публикация через GitHub

1. Разместите исходники в публичном GitHub repository.
2. Создайте published release с tag `v<manifest.version>` или
   `<manifest.version>`.
3. Убедитесь, что manifest и entry-файл существуют на этом tag.
4. Войдите подтверждённым аккаунтом Neuro Notes и отправьте repository, tag и
   путь к manifest.
5. Изучите compatibility warnings и отправьте заявку модератору.

Marketplace получает manifest и metadata через GitHub REST API, фиксирует
commit SHA и никогда не исполняет entry-файл. После одобрения версия становится
immutable; новая версия или изменение описания проходит отдельную модерацию.
