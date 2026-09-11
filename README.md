# qblog

Личный блог на [Astro](https://astro.build/), опубликованный на GitHub Pages:
https://yeskermesovv.github.io/qblog

## Локальная разработка

Нужен Node 22 или новее.

```
npm install
npm run dev      # http://localhost:4321/qblog
npm run build    # сборка в ./dist
npm run preview  # посмотреть собранный сайт
```

## Как писать

Записи лежат в `src/content/blog/` в виде файлов `.md` или `.mdx`.
Имя файла становится адресом записи. Обязательные поля frontmatter: `title`,
`description`, `pubDate`; необязательные: `heroImage`, `updatedDate`.
Схема описана в `src/content.config.ts` — при ошибке в полях сборка упадёт с
понятным сообщением.

Картинки для записей кладутся в `src/assets/` и подключаются относительным
путём, например `../../assets/blog-placeholder-1.jpg`.

## Что где лежит

| Путь | Назначение |
| --- | --- |
| `src/consts.ts` | название блога, описание, автор, ссылка на GitHub |
| `src/pages/index.astro` | главная страница |
| `src/pages/about.astro` | страница «Обо мне» |
| `src/components/` | шапка, подвал, метатеги |
| `src/layouts/BlogPost.astro` | шаблон страницы записи |
| `src/styles/global.css` | общие стили |
| `public/` | файлы, которые копируются в корень сайта как есть |

## Деплой

Push в ветку `main` запускает `.github/workflows/deploy.yml`, который собирает
сайт и публикует его на GitHub Pages. В настройках репозитория Settings → Pages
источник должен быть выставлен в **GitHub Actions**.

Сайт живёт в подпапке `/qblog`, поэтому внутренние ссылки строятся через
хелпер `withBase()` из `src/utils/url.ts`. Не пиши `href="/blog"` напрямую —
такая ссылка сломается на продакшене.
