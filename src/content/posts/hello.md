---
title: "Hello, world"
description: "The first post: what this blog is for and how to add new ones."
pubDatetime: 2026-09-11T22:00:00+05:00
tags:
  - notes
---

This is the first post. The blog runs on [Astro](https://astro.build/) with the
[AstroPaper](https://github.com/satnaing/astro-paper) theme and is published on GitHub Pages.

## Table of contents

## Adding a new post

Create a file at `src/content/posts/your-post.md`. The file name becomes the post
URL, so keep it lowercase and hyphenated. Every post starts with a frontmatter block:

```markdown
---
title: "Post title"
description: "A short summary for the post list and search engines."
pubDatetime: 2026-09-20T12:00:00+05:00
tags:
  - engineering
---
```

Only `title`, `description` and `pubDatetime` are required. Get a field wrong and the
build fails with a readable error, which is exactly what you want.

## Useful optional fields

| Field | What it does |
| --- | --- |
| `featured` | pins the post to the Featured block on the home page |
| `draft` | keeps the post out of the build while you write it |
| `modDatetime` | shows an updated date next to the publish date |
| `tags` | groups posts, defaults to `others` |
| `ogImage` | a custom social image instead of the generated one |

A post dated in the future stays out of the build until that time arrives. That is
scheduled publishing, not a bug.

## What the theme gives you

Full text search runs without a server, the index is built at build time.
Social images are generated per post. Dark mode toggles from the header and
remembers the choice.

The `## Table of contents` line above expands into a table of contents when present.
