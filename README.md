# Portfolio

Static site, no build step. All content lives in `content/` and is edited from a terminal studio.

## The studio

```bash
pip install -r requirements.txt
python tools/zen.py            # interactive studio (arrow keys + enter)
```

| Menu | Edits |
| --- | --- |
| Notes / Journal | `content/posts/*.md`, `content/journal/*.md` (opens your `$EDITOR` for the body) |
| Projects | `content/projects.json` (with a longer "how it works" write-up) |
| Reading list | `content/reading.json` (status, rating, your take) |
| Shared blogs | `content/shared.json` |
| Main page content | `content/site.json`: name, about, interests, experiments, background, now, contacts |
| Live preview | local server at http://localhost:8000 |
| Publish | rebuilds `content/index.json`, shows the diff, commits and pushes |

Shortcuts: `zen.py post`, `zen.py journal`, `zen.py serve`, `zen.py publish`, and `--fast` to skip the intro.
Ctrl-C in any prompt goes back one level. Set `EDITOR` (e.g. `export EDITOR=nvim`) to choose your editor.

`python tools/publish.py` still works on its own (`-m "msg"`, `-y`, `--dry`).

## Markdown in notes

Headings (a table of contents appears at 3+), lists, task lists, tables, quotes, rules, images, links and fenced code with a copy button. Front matter: `title`, `date`, `summary`, `tags` (journal: `mood`). Reading time is computed automatically.

## Hosting

Repo named `zenith-8-bit.github.io`, Settings > Pages > Deploy from branch `main` / root.
