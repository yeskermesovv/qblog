---
title: "Expensium: tracking expenses by talking to your phone"
description: "A voice-driven expense tracker that runs entirely in the browser, parses spoken Russian and Kazakh, and works offline."
pubDatetime: 2026-09-12T01:00:00+05:00
tags:
  - side-projects
  - javascript
featured: true
---

Every expense tracker I tried died the same way. Not because it was bad, but because
logging a coffee took six taps, and six taps is more than a coffee is worth. So I
built [Expensium](https://yeskermesovv.github.io/expensium/): you press the
microphone, say what you spent, and the entry appears.

Say "вчера потратил тысячу двести на такси" and you get 1200 ₸, category transport,
dated yesterday. No forms, no dropdowns.

## Table of contents

## No server, no account, no LLM

The whole thing runs in the browser. Speech recognition is the browser's own Web
Speech API. Entries live in local storage on the device. There is no backend to sign
up for and nothing leaves the phone unless you ask it to.

The parser is hand written too. No model call, no API key, just string matching in
about a thousand lines of JavaScript. That sounds like the boring choice until you
notice it costs nothing per entry, works with no signal, and returns an answer before
you lift your thumb.

## Understanding spoken numbers

This is the part that took the most work. Speech recognition does not hand you digits.
It hands you words, and Russian numerals decline.

The number parser carries a table of spoken forms mapping to values, including the
case endings, so "двух", "двое" and "два" all land on 2. It handles multipliers the
same way, which is how "тысяча двести" becomes 1200 and "полторы тысячи" becomes 1500.
Kazakh numerals go through the same path, so "екі жүз елу" works too.

Then there was a bug I did not see coming. Speech recognition likes to insert thousands
separators on its own, so a phrase came back as "1 500" or "1.000.000". The parser read
that dot as a decimal point and a two thousand tenge lunch became two tenge. The fix is
a regex that glues digit groups back together before anything else looks at the string.

## Categories for free

Categories match on word prefixes rather than whole words. It is a small decision that
pays for itself constantly: "такси" matches "такси", "кофе" matches "кофейня", and
every grammatical case of a Russian noun matches without being listed. The keyword
lists carry local chains as well, so Magnum, Galmart and Anvar route to groceries the
same way a supermarket name would.

Income is separated from spending by looking at which word did the work. Verbs like
"получил" get stripped out of the description, nouns like "зарплата" stay in, so
"получил зарплату" files as income described simply as salary.

## Currency and language

The default currency is tenge, because that is where I live. Eight currencies are
recognised from speech, each with its spoken forms and slang, so "баксов" resolves to
dollars and "деревянных" to rubles. Recognition language switches between Russian and
Kazakh in settings.

## Sync that does not get in the way

Local storage stays the source of truth. That is deliberate. The app has to work on the
metro with no signal, and an app that needs a round trip before it will record a coffee
is the app I already abandoned once.

Cloud sync is optional. Connect a free Supabase project and you get Google sign in plus
sync across devices, guarded by row level security so each account only ever sees its
own rows. Every entry carries a last edited timestamp, sync pushes what changed and
pulls what is new, and the later edit wins on conflict.

Deletes were the subtle case. Actually removing a row means the deletion never reaches
your other phone, which happily syncs the entry back. So deletes leave a tombstone that
sticks around for three months and then gets cleaned up.

Sync fires on sign in, a second and a half after an edit, once a minute, when the window
regains focus, and when the network comes back.

## Installing it

The build output is plain static files, so it deploys anywhere. It ships as a progressive
web app with a service worker, meaning Add to Home Screen gives you a real icon that opens
offline.

One constraint worth knowing if you fork it: microphone access requires HTTPS or localhost.
Testing on a phone over a local IP address will not work, the browser simply refuses.

## The stack

React 18 and Vite 5 on the front, Supabase for the optional cloud, GitHub Pages for
hosting. Three runtime dependencies total.

The source is at [github.com/yeskermesovv/expensium](https://github.com/yeskermesovv/expensium),
and the app itself is live at [yeskermesovv.github.io/expensium](https://yeskermesovv.github.io/expensium/).
It is Russian and Kazakh only for now. English recognition is mostly a matter of writing
another numeral table, which is a fine excuse for a follow up post.
