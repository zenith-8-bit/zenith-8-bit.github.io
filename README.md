# Portfolio

Static site, no build step. Edit only `content/`:

- `site.json` name, tagline, about, now, contacts
- `projects.json`, `reading.json`, `shared.json` lists
- `posts/*.md` your blog, `journal/*.md` your journal (front matter: title, date, summary, tags / mood)

Publish: `pip install -r requirements.txt` then `python tools/publish.py` (`-m "msg"`, `-y`, `--dry`).
Hosting: repo named `zenith-8-bit.github.io`, Settings > Pages > Deploy from branch `main` / root.
Preview locally: `python -m http.server`.
