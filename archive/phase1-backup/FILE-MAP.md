# FILE-MAP — Фаза 1 (безопасная реструктуризация)

Дата: 2026-06-08  
Корень проекта: **INTERACTIV PORTFOLIO**  
GitHub: `Taisonga6726/INTERACTIV-PORTFOLIO`  
Vercel: `https://interactiv-portfolio.vercel.app`

---

## 1. Активные файлы (используются сайтом СЕЙЧАС)

Оригиналы **остаются в корне** — пути в `portfolio.html` не менялись.

| Корневой путь | Назначение | Организованная копия |
|---------------|------------|----------------------|
| `chapka 21 на 9.jpg` | Hero banner 21:9 (утверждён) | `images/hero/chapka-21x9-active.jpg` |
| `logo-tg.png` | Логотип TG | `images/ui/logo-tg.png` |
| `sign-tanya.png` | Подпись | `images/ui/sign-tanya.png` |
| `icon-vizual.png` | Остров «Визуал» | `images/islands/icon-vizual.png` |
| `icon-video.png` | Остров «Видео» | `images/islands/icon-video.png` |
| `icon-content.png` | Остров «Контент» | `images/islands/icon-content.png` |
| `icon-vibe-coding.png` | Остров «Вайб-кодинг» | `images/islands/icon-vibe-coding.png` |
| `icon-gpt-agent.png` | Остров «GPT-агенты» | `images/islands/icon-gpt-agent.png` |
| `music.png` | Остров «Музыка» | `images/islands/music.png` |
| `splash-cursor.js` | Splash-эффект курсора | `js/splash-cursor.js` |
| `portfolio.html` | Главная страница | *(не копировался — единственный экземпляр)* |
| `vercel.json` | Конфиг деплоя | *(не копировался)* |

Галерея в JS использует **Unsplash URL** — локальных путей нет.

**Проверка после Фазы 1:** JS-ошибок нет, битых изображений нет.

---

## 2. Дубликаты (оригинал в корне + организованная копия)

### Активные дубликаты (нужны до Фазы 2)
- 9 изображений островов/hero/ui — корень + `images/`
- `splash-cursor.js` — корень + `js/`
- `anim-check.js` — корень + `js/` (QA-скрипт, не в HTML)

### Неактивные дубликаты (корень + категория + archive)
- Все `chapka*`, `header-*` черновики — корень + `images/hero/` + `archive/old-images/hero-variants/`
- Логотипы — корень + `images/ui/` + `archive/old-images/logo-variants/`
- QA-кадры — корень + `docs/qa/`
- Полный снимок корня — `archive/old-images/root-snapshot/`
- Видео (6 файлов) — `video/` + `archive/old-video/` (оригиналы в родительской `video/` не тронуты)

### Тройные копии логотипов
- `logo-tg.png` = `logo_tg_final.png` (одинаковый размер 36509 байт) — кандидат на объединение в Фазе 2

---

## 3. Архив (`archive/`)

| Папка | Содержимое |
|-------|------------|
| `archive/old-images/hero-variants/` | Старые chapka, header-chapka, header-hero, header-final |
| `archive/old-images/logo-variants/` | Альтернативные логотипы |
| `archive/old-images/root-snapshot/` | Полная копия всех медиа из корня на момент Фазы 1 |
| `archive/old-video/` | Копии всех 6 mp4 |
| `archive/old-files/` | Артефакт `Users...` (Playwright) из родительской папки |

---

## 4. Документация и QA (`docs/`)

| Папка | Содержимое |
|-------|------------|
| `docs/qa/` | header-anim-*, header-luxury-*, luxury-gif-frames/ |
| `docs/FILE-MAP.md` | Этот файл |

---

## 5. Видео (`video/`)

| Папка | Файлы |
|-------|-------|
| `video/hero/` | `в работу  шапка 01.mp4` |
| `video/avatars/` | `var 01.mp4`, `vargrok.mp4` |
| `video/portfolio/` | `в работу.mp4`, `в работу 01.mp4`, `ВАУ В РАБОТУ !.mp4` |

---

## 6. Пустые папки (зарезервированы)

- `css/` — CSS сейчас inline в portfolio.html
- `audio/` — локальных аудио пока нет
- `images/avatars/` — под будущие аватары

---

## 7. Кандидаты на удаление (только после Фазы 2 и вашего подтверждения)

### Из корня (после обновления путей в HTML)
- Все неактивные `chapka*`, `header-*` (~40 файлов)
- QA-скриншоты `header-anim-*`, `header-luxury-*` в корне
- `luxury-gif-frames/` в корне (копия есть в `docs/qa/`)
- Дубли логотипов: `logo_tg_final.png`, `logo_bez.png`, `logo_luxury_final.png`, `logo-tg-luxury.png`
- `anim-check.js` в корне (останется в `js/`)

### Из родительской папки `ПОРТФОЛИО интерактив ВСЕ РАБОТЫ`
- Вся папка может стать legacy после перехода на INTERACTIV PORTFOLIO
- `node_modules/`, `Users*` артефакт, дублирующий `.git`

### Не удалять
- Активный `chapka 21 на 9.jpg` до переключения пути
- `portfolio.html`, `vercel.json`, `splash-cursor.js` до Фазы 2

---

## 8. Фаза 2 (после подтверждения)

1. Обновить пути в `portfolio.html` → `index.html`
2. Упростить `vercel.json`
3. Убрать дубликаты из корня
4. Commit + push → автодеплой Vercel