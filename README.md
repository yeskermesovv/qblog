# qblog

A personal blog built with [Astro](https://astro.build/) and the
[AstroPaper](https://github.com/satnaing/astro-paper) theme, published on GitHub Pages:
https://yeskermesovv.github.io/qblog/

## Local development

Requires Node 22.12 or newer.

```
npm install
npm run dev      # http://localhost:4321/qblog
npm run build    # type check, build and search index
npm run preview  # serve the built site
```

## Writing

Posts live in `src/content/posts/` as `.md` or `.mdx` files. The file name becomes
the post URL. Required frontmatter: `title`, `description` and `pubDatetime`.

```markdown
---
title: "Post title"
description: "A short summary for the post list and search engines."
pubDatetime: 2026-09-20T12:00:00+05:00
tags:
  - engineering
---
```

A post dated in the future stays out of the build until that time arrives, which is
how the theme does scheduled publishing. Use `draft: true` for work in progress.

A `## Table of contents` line in the body expands into a table of contents.

Standalone pages such as About live in `src/content/pages/`.

## Layout of the project

| Path | Purpose |
| --- | --- |
| `astro-paper.config.ts` | title, description, author, socials, theme features |
| `astro.config.ts` | base path, locale, Markdown plugins |
| `src/i18n/lang/en.ts` | every interface string |
| `src/pages/index.astro` | home page copy |
| `src/styles/` | colors and typography |
| `public/` | files copied to the site root as is |

## Deploying

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the site and
publishes it to GitHub Pages. The source under Settings then Pages is set to GitHub Actions.

The site is served from the `/qblog` subfolder, handled by `base` in `astro.config.ts`.
The theme is base aware through `src/utils/withBase.ts`, so never hardcode `href="/posts"`.

## License

AstroPaper is MIT licensed, see `LICENSE`.
