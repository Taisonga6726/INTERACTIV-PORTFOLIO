# ARCHIVE-MAP — карта архива проекта

Дата: 2026-06-12  
Проект: **INTERACTIV PORTFOLIO**  
Production: `https://interactiv-portfolio.vercel.app` (не изменялся в этой задаче)

---

## Принципы архивирования

1. **Ничего не удалялось** — файлы только **перемещены** в `archive/`.
2. **Пути в `portfolio.html` не менялись** — сайт использует те же URL.
3. **GitHub / Vercel не трогались** — изменения только локально.
4. В архив попали **только неактивные** материалы, у которых уже есть копия в рабочей структуре (`images/`, `js/`, `docs/qa/`) или в предыдущем снимке архива.

---

## Финальная структура `archive/`

```
archive/
├── phase1-backup/          # Манифест и FILE-MAP Фазы 1
├── phase2-backup/          # Манифест Фазы 2 (миграция путей)
├── phase3a-backup/         # Манифест Фазы 3A (удалённые дубликаты из корня)
├── old-images/
│   ├── hero-variants/      # Черновики chapka/header (Фаза 1)
│   ├── hero-working-copies/ # Перенесённые копии из images/hero/
│   ├── logo-variants/      # Альтернативные логотипы
│   ├── ui-working-copies/  # Перенесённые копии из images/ui/
│   ├── portfolio-working-copies/ # Перенесённые копии из images/portfolio/
│   └── qa-root-duplicates/ # QA-кадры из корня (дубли docs/qa/)
├── old-video/              # 6 mp4 (копии video/)
├── old-files/              # Артефакты Playwright из legacy-папки
└── root-snapshots/
    ├── phase1-root-snapshot/    # Полный снимок корня на момент Фазы 1
    └── root-inactive-after-3a/  # Неактивные файлы из корня (после 3A)
```

### Объёмы (локально)

| Папка | Файлов | ~Размер |
|-------|--------|---------|
| `phase1-backup/` | 2 | < 1 MB |
| `phase2-backup/` | 1 | < 1 MB |
| `phase3a-backup/` | 1 | < 1 MB |
| `old-images/` | 90 | ~208 MB |
| `old-video/` | 6 | ~37 MB |
| `old-files/` | 4 | ~3 MB |
| `root-snapshots/` | 98 | ~222 MB |

**Перемещено в этой задаче:** 91 файл + реорганизация `root-snapshot` → `root-snapshots/phase1-root-snapshot`.

Журнал перемещений: `docs/qa/archive-run-log.json`

---

## Содержимое по разделам

### `phase1-backup/`

| Файл | Зачем |
|------|-------|
| `MANIFEST.md` | Описание Фазы 1 (commit `4f0352a`) |
| `FILE-MAP.md` | Копия карты файлов на момент Фазы 1 |

**Почему перенесено:** документация этапа, не нужна сайту.  
**Можно удалить в будущем:** только после внешнего бэкапа документации.

---

### `phase2-backup/`

| Файл | Зачем |
|------|-------|
| `MANIFEST.md` | Список изменённых путей (commits `1dc7e7f`, `b8c6773`) |

**Почему:** фиксация миграции путей к `images/` и `js/`.  
**Можно удалить:** да, если история есть в git.

---

### `phase3a-backup/`

| Файл | Зачем |
|------|-------|
| `MANIFEST.md` | 9 файлов, удалённых из корня в 3A, и где лежат копии |

**Почему:** страховка на случай отката до состояния до 3A.  
**Можно удалить:** после подтверждения, что копии в `images/`, `js/` и `root-snapshots/` достаточны.

---

### `old-images/hero-variants/`

Черновики баннеров: `chapka*`, `header-chapka*`, `header-hero*`, `header-final*`, `Я … на банер!.png`, `без меня ВАУ .jpg`.

**Почему:** не используются в HTML; активный баннер — `images/hero/chapka-21x9-active.jpg`.  
**Можно удалить в будущем:** да, если `root-snapshots/phase1-root-snapshot/` сохранён.

---

### `old-images/hero-working-copies/`

Копии из `images/hero/`, перенесённые при архивировании (все варианты chapka/header кроме активного).

**Почему:** дублировали `hero-variants/` и `phase1-root-snapshot/`.  
**Можно удалить:** да, это третьи копии — оставить `hero-variants/` или `phase1-root-snapshot/`.

---

### `old-images/logo-variants/` и `ui-working-copies/`

Альтернативные логотипы: `logo_luxury_final.png`, `logo-tg-luxury.png`, `logo_bez.png`, `logo_tg_final.png`, `logo-sign.*`, `ЛОГОТИП.jpg`.

**Почему:** сайт использует только `logo-tg.png` и `sign-tanya.png` из корня.  
**Можно удалить:** частично — luxury-варианты можно убрать после согласования; **не удалять** единственные копии утверждённых логотипов без бэкапа.

---

### `old-images/portfolio-working-copies/`

`baner glav yahta .png`, `iskusstvo .jpg`, `ChatGPT Image …png`.

**Почему:** не подключены в HTML (галерея — Unsplash).  
**Можно удалить:** да, при наличии копий в `phase1-root-snapshot/`.

---

### `old-images/qa-root-duplicates/`

QA-кадры анимации шапки из корня (`header-anim-check-frame*.png`).

**Почему:** полные копии есть в `docs/qa/`.  
**Можно удалить:** да, `docs/qa/` — основной QA-архив.

---

### `old-video/`

6 mp4: hero, avatars, portfolio (копии `video/`).

**Почему:** видео не используется в текущем HTML.  
**Можно удалить:** только по отдельному решению — может понадобиться для будущих секций.

---

### `old-files/`

Артефакты Playwright из родительской legacy-папки.

**Почему:** мусорные пути, не относятся к сайту.  
**Можно удалить:** да, после проверки что `docs/qa/` содержит нужные кадры.

---

### `root-snapshots/phase1-root-snapshot/`

Полный снимок всех медиа из корня **до Фазы 2** (включая удалённые в 3A файлы).

**Почему:** главная страховка отката.  
**Можно удалить:** **НЕТ** без внешнего бэкапа на диск/облако.

---

### `root-snapshots/root-inactive-after-3a/`

~45 неактивных файлов из корня: chapka/header черновики, luxury-логотипы, QA-gif, `logo-sign.*`, `iskusstvo .jpg` и т.д.

**Почему:** корень очищен для работы; копии уже были в archive/docs.  
**Можно удалить:** частично в Фазе 3B/3C — **не сейчас**.

---

## Активные файлы (используются сайтом)

| Путь | Назначение |
|------|------------|
| `portfolio.html` | Главная страница |
| `vercel.json` | Конфиг деплоя |
| `logo-tg.png` | Логотип в шапке |
| `sign-tanya.png` | Подпись в шапке |
| `images/hero/chapka-21x9-active.jpg` | Hero banner 21:9 |
| `images/islands/icon-vizual.png` | Остров «Визуал» |
| `images/islands/icon-video.png` | Остров «Видео» |
| `images/islands/icon-content.png` | Остров «Контент» |
| `images/islands/icon-vibe-coding.png` | Остров «Вайб-кодинг» |
| `images/islands/icon-gpt-agent.png` | Остров «GPT-агенты» |
| `images/islands/music.png` | Остров «Музыка» |
| `js/splash-cursor.js` | Splash-эффект курсора |
| Unsplash URL (в JS) | Галерея работ |

**QA (не в production HTML):** `js/anim-check.js`

---

## Резерв (не в HTML, но намеренно сохранены)

| Расположение | Содержимое | Статус |
|--------------|------------|--------|
| `docs/qa/` | Кадры анимации шапки №12.4, luxury-gif, скриншоты проверок | Основной QA-архив |
| `docs/FILE-MAP.md` | Карта файлов проекта | Документация |
| `video/` | 6 mp4 для будущего использования | Рабочий резерв |
| `images/avatars/`, `images/portfolio/`, `images/ui/` | Пустые папки (зарезервированы) | Структура |
| `css/`, `audio/` | Пустые папки | Зарезервированы |
| `archive/` (весь) | См. разделы выше | Холодное хранение |

**HTML-комментарии RESERVE** в `portfolio.html` ссылаются на старые имена chapka — файлы лежат в `archive/old-images/` и `archive/root-snapshots/`.

---

## Критически важные файлы (нельзя удалять)

| Приоритет | Файлы | Почему |
|-----------|-------|--------|
| 🔴 Критично | `portfolio.html`, `vercel.json` | Сайт и деплой |
| 🔴 Критично | `images/hero/chapka-21x9-active.jpg` | Утверждённая шапка |
| 🔴 Критично | `images/islands/*.png`, `music.png` | 6 островов на главной |
| 🔴 Критично | `js/splash-cursor.js` | Splash-cursor |
| 🔴 Критично | `logo-tg.png`, `sign-tanya.png` | Брендинг в шапке |
| 🟠 Страховка | `archive/root-snapshots/phase1-root-snapshot/` | Полный откат медиа |
| 🟠 Страховка | `docs/qa/` | История QA анимации шапки |
| 🟡 Рабочий резерв | `video/`, `js/anim-check.js` | Будущие фичи и тесты |

---

## Что нельзя удалять без отдельного подтверждения

- Все **активные** файлы из таблицы выше
- `archive/root-snapshots/phase1-root-snapshot/`
- `docs/qa/` (единственный полный QA-набор)
- `video/` (пока не решено иное)
- Любые файлы, на которые есть **RESERVE**-комментарии в HTML, без обновления комментариев

---

## Состояние корня после архивирования

```
INTERACTIV PORTFOLIO/
├── portfolio.html
├── vercel.json
├── logo-tg.png
├── sign-tanya.png
├── images/          # только 7 активных ассетов + пустые подпапки
├── js/
├── video/
├── docs/
└── archive/
```

Локальная проверка после архивирования: **10/10 ассетов HTTP 200**, 6 островов, splash-cursor OK, **0 ошибок консоли**.
