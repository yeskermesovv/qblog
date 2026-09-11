# qblog

Личный блог на [Astro](https://astro.build/) с темой
[AstroPaper](https://github.com/satnaing/astro-paper), опубликованный на GitHub Pages:
https://yeskermesovv.github.io/qblog/

## Локальная разработка

Нужен Node 22.12 или новее.

```
npm install
npm run dev      # http://localhost:4321/qblog
npm run build    # проверка типов, сборка и индекс поиска
npm run preview  # посмотреть собранный сайт
```

## Как писать

Записи лежат в `src/content/posts/` в виде файлов `.md` или `.mdx`.
Имя файла становится адресом записи. Обязательные поля frontmatter: `title`,
`description` и `pubDatetime`; остальные необязательные.

```markdown
---
title: "Заголовок записи"
description: "Короткое описание для списка и поисковиков."
pubDatetime: 2026-09-20T12:00:00+05:00
tags:
  - разработка
---
```

Важно: запись с датой в будущем не попадёт в сборку, пока эта дата не наступит.
Так тема реализует отложенную публикацию. Черновик помечается `draft: true`.

Строчка `## Оглавление` в тексте разворачивается в оглавление записи.

Отдельные страницы вроде «Обо мне» лежат в `src/content/pages/`.

## Что где лежит

| Путь | Назначение |
| --- | --- |
| `astro-paper.config.ts` | название, описание, автор, соцсети, настройки темы |
| `astro.config.ts` | базовый путь, локаль, плагины Markdown |
| `src/i18n/lang/ru.ts` | все надписи интерфейса |
| `src/pages/index.astro` | текст на главной |
| `src/styles/` | цвета и типографика |
| `public/` | файлы, которые копируются в корень сайта как есть |

## Деплой

Push в ветку `main` запускает `.github/workflows/deploy.yml`, который собирает
сайт и публикует его на GitHub Pages. Источник в Settings → Pages выставлен
в GitHub Actions.

Сайт живёт в подпапке `/qblog`, за это отвечает `base` в `astro.config.ts`.
Тема учитывает базовый путь сама через `src/utils/withBase.ts`, поэтому не пиши
`href="/posts"` напрямую.

## Лицензия

Тема AstroPaper распространяется по лицензии MIT, текст лежит в `LICENSE`.
