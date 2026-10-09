---
title: Hello, world
date: 2026-10-09
summary: Why this site exists, how it is built, and how a new note goes from idea to live page in one command.
tags: meta, notes
---
This is the first note on the site, and it doubles as a test page for every kind of content the writing section can show. If you are reading it, the whole pipeline works.

## Why a site at all

My work is scattered across repositories, half-finished experiments and screenshots on my phone. A personal site gives it one address. The notes section is for the part GitHub cannot hold: *why* something was built, what went wrong, and what I would do differently.

> Writing is how I find out whether I understood the thing I just built.

## How it is built

There is no framework and no build step. The site is plain HTML, CSS and a little JavaScript, and everything you read comes from files in `content/`:

- `site.json` holds the home page: name, about, interests, what I am doing now
- `projects.json`, `reading.json` and `shared.json` hold the lists
- `posts/` and `journal/` hold one Markdown file per entry

The page loads those files in the browser and renders them. That keeps hosting free and means the whole site fits in a folder you can read in an afternoon.

## Publishing a note

I never edit those files by hand. A terminal studio does it for me:

```bash
pip install -r requirements.txt
python tools/zen.py post      # write a note, opens your editor
python tools/zen.py publish   # rebuild index, commit, push
```

Behind the scenes `publish.py` regenerates `content/index.json`, which lists every entry with its date, summary and reading time, then commits and pushes to GitHub Pages. About a minute later the note is live.

## What Markdown supports here

| Feature | Syntax |
| --- | --- |
| Headings | `##` and `###` |
| Emphasis | `**bold**`, `*italic*`, `~~strike~~` |
| Lists | `-` for bullets, `1.` for numbers |
| Code | triple backticks, with a copy button |
| Links and images | `[text](url)` and `![alt](path)` |

Headings become a table of contents when a note has three or more of them, and the reading time is worked out from the word count.

---

## What comes next

1. Replace this note with something real
2. Fill in the reading list and the blogs I follow
3. Write up the projects that deserve a long-form story, starting with the sensor crates and the Chrome extension

Delete this file whenever you like. The site will not miss it.
