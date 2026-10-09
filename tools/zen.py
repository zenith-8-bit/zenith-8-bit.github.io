#!/usr/bin/env python3
"""zen - interactive terminal studio for this portfolio.

    python tools/zen.py            open the studio
    python tools/zen.py post       new note, straight into the editor
    python tools/zen.py journal    new journal entry
    python tools/zen.py serve      live preview at http://localhost:8000
    python tools/zen.py publish    rebuild index, commit, push
"""
import argparse, functools, http.server, json, os, re, shutil, subprocess, sys, tempfile, threading, time, webbrowser
from datetime import date
from pathlib import Path

try:
    import questionary
    from questionary import Style
    from rich import box
    from rich.align import Align
    from rich.console import Console, Group
    from rich.live import Live
    from rich.markdown import Markdown
    from rich.panel import Panel
    from rich.progress import BarColumn, Progress, SpinnerColumn, TextColumn
    from rich.table import Table
    from rich.text import Text
except ImportError:
    sys.exit("Missing dependencies. Run: pip install -r requirements.txt")

sys.path.insert(0, str(Path(__file__).parent))
import publish as pub

ROOT, C = pub.ROOT, pub.C
AMBER, CYAN, DIM = "#FFC845", "#5FD0D4", "grey50"
con = Console()
STYLE = Style([
    ("qmark", f"fg:{AMBER} bold"), ("question", "bold"), ("answer", f"fg:{CYAN} bold"),
    ("pointer", f"fg:{AMBER} bold"), ("highlighted", f"fg:{AMBER} bold"), ("selected", f"fg:{CYAN}"),
    ("instruction", "fg:#6b6b6b"), ("separator", "fg:#444444"), ("text", ""),
])

class Back(Exception):
    """Raised when the user hits Ctrl-C / Esc in a prompt: go one level up."""

def ask(q):
    r = q.ask()
    if r is None:
        raise Back
    return r

def select(msg, choices, **kw):
    return ask(questionary.select(msg, choices=choices, style=STYLE, qmark="◆", pointer="❯",
                                  instruction="(↑↓ move, enter select, ctrl-c back)", **kw))

def text(msg, default="", **kw):
    return ask(questionary.text(msg, default=default, style=STYLE, qmark="◆", **kw)).strip()

def confirm(msg, default=True):
    return ask(questionary.confirm(msg, default=default, style=STYLE, qmark="◆"))

# ───────────────────────── look & feel ─────────────────────────
LOGO = r"""
 ______  ______ _   _ ___ _____ _   _
|___  / |  ____| \ | |_ _|_   _| | | |
   / /  | |__  |  \| || |  | | | |_| |
  / /   |  __| | . ` || |  | | |  _  |
 / /__  | |____| |\  || |  | | | | | |
/_____| |______|_| \_|___| |_| |_| |_|
"""

def sweep(t, pos):
    """colour a string with an amber→cyan sweep that follows pos (0..1)."""
    out = Text()
    for i, ch in enumerate(t):
        d = abs(i / max(len(t), 1) - pos)
        out.append(ch, style=f"bold {AMBER}" if d < .12 else (CYAN if d < .3 else DIM))
    return out

def intro(fast=False):
    con.clear()
    lines = LOGO.strip("\n").splitlines()
    if fast or not con.is_terminal:
        con.print(Text(LOGO, style=f"bold {AMBER}"))
        return
    with Live(console=con, refresh_per_second=30, transient=False) as live:
        for f in range(24):
            pos = f / 23
            live.update(Align.center(Group(*[sweep(l, pos) for l in lines])))
            time.sleep(.025)
    with Progress(SpinnerColumn(style=AMBER), TextColumn("[progress.description]{task.description}"),
                  BarColumn(bar_width=28, complete_style=CYAN, finished_style=AMBER), transient=True, console=con) as p:
        t = p.add_task("loading content", total=5)
        for what in ("site", "projects", "reading", "shared", "notes"):
            p.update(t, description=f"loading {what}", advance=1)
            time.sleep(.12)

def dirty_count():
    try:
        out = subprocess.run(["git", "status", "--porcelain"], cwd=ROOT, capture_output=True, text=True).stdout
        return len([l for l in out.splitlines() if l.strip()])
    except Exception:
        return 0

def dashboard():
    n = lambda p: len(list((C / p).glob("*.md")))
    j = lambda f: len(load(f, []))
    stats = Table.grid(padding=(0, 3))
    cells = [("notes", n("posts")), ("journal", n("journal")), ("projects", j("projects")),
             ("books", j("reading")), ("blogs", j("shared"))]
    stats.add_row(*[Text(str(v), style=f"bold {AMBER}", justify="center") for _, v in cells])
    stats.add_row(*[Text(k, style=DIM, justify="center") for k, _ in cells])
    d = dirty_count()
    sync = Text(f"● {d} unpublished change{'s' * (d != 1)}", style=AMBER) if d else Text("● in sync with GitHub", style=CYAN)
    con.print(Panel(Group(Align.center(stats), Text(""), Align.center(sync)),
                    title=f"[bold]{load('site', {}).get('name', 'Zenith')}[/] studio", border_style=DIM, box=box.ROUNDED, padding=(1, 4)))

def banner(title, sub=""):
    con.print()
    con.print(Text("◆ ", style=AMBER) + Text(title, style="bold") + (Text(f"  {sub}", style=DIM) if sub else Text("")))
    con.print(Text("─" * 52, style=DIM))

def done(msg):
    con.print(Text("✓ ", style=CYAN) + Text(msg))
    time.sleep(.35)

def working(msg, fn, secs=.4):
    with con.status(f"[{AMBER}]{msg}", spinner="dots12", spinner_style=AMBER):
        r = fn()
        time.sleep(secs)
    return r

# ───────────────────────── storage ─────────────────────────
def load(name, default):
    p = C / f"{name}.json"
    return json.loads(p.read_text(encoding="utf8")) if p.exists() else default

def save(name, data):
    (C / f"{name}.json").write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf8")

def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-") or "untitled"

def edit_text(initial="", suffix=".md", hint=""):
    """open $EDITOR on a temp file; fall back to a pasted multi-line prompt."""
    ed = os.environ.get("VISUAL") or os.environ.get("EDITOR") or next((e for e in ("nano", "vim", "vi", "notepad") if shutil.which(e)), None)
    if not ed:
        return ask(questionary.text(f"{hint or 'Text'} (esc then enter to finish)", default=initial, multiline=True, style=STYLE))
    with tempfile.NamedTemporaryFile("w+", suffix=suffix, delete=False, encoding="utf8") as f:
        f.write(initial)
        path = f.name
    try:
        subprocess.run(ed.split() + [path])
        return Path(path).read_text(encoding="utf8").strip("\n")
    finally:
        os.unlink(path)

# ───────────────────────── generic list editor ─────────────────────────
# field = (key, label, kind) ; kind: text | tags | editor | choice:a,b,c
def ask_field(f, cur):
    key, label, kind = f
    if kind == "tags":
        v = text(f"{label}", ", ".join(cur) if isinstance(cur, list) else (cur or ""))
        return [t.strip() for t in v.split(",") if t.strip()]
    if kind == "editor":
        con.print(Text(f"  ↳ opening your editor for “{label}”…", style=DIM))
        return edit_text(cur or "", hint=label)
    if kind.startswith("choice:"):
        opts = kind[7:].split(",")
        return select(label, opts, default=cur if cur in opts else opts[0])
    return text(label, cur or "")

def summary_row(item, cols):
    out = []
    for c in cols:
        v = item.get(c, "")
        out.append(", ".join(v) if isinstance(v, list) else str(v))
    return out

def manage(name, title, fields, cols, sort_key=None):
    while True:
        con.clear(); banner(title, f"content/{name}.json")
        data = load(name, [])
        t = Table(box=box.SIMPLE_HEAD, header_style=f"bold {CYAN}", border_style=DIM, pad_edge=False)
        t.add_column("#", style=DIM, justify="right")
        for c in cols:
            t.add_column(c, overflow="ellipsis", max_width=34, no_wrap=True)
        for i, it in enumerate(data, 1):
            t.add_row(str(i), *summary_row(it, cols))
        con.print(t if data else Text("  nothing here yet", style=DIM))
        try:
            act = select("What now?", ["Add new", "Edit one", "Move up / down", "Delete one", "← Back"])
        except Back:
            return
        try:
            if act == "← Back":
                return
            if act == "Add new":
                item = {}
                for f in fields:
                    item[f[0]] = ask_field(f, "")
                data.insert(0, item) if confirm("Put it at the top of the list?", True) else data.append(item)
                save(name, data); done("added")
            elif data:
                idx = select("Which one?", [questionary.Choice(f"{i + 1}. {d.get(cols[0], '?')}", i) for i, d in enumerate(data)])
                if act == "Edit one":
                    for f in fields:
                        data[idx][f[0]] = ask_field(f, data[idx].get(f[0], ""))
                    save(name, data); done("saved")
                elif act == "Delete one":
                    if confirm(f"Delete “{data[idx].get(cols[0])}”?", False):
                        data.pop(idx); save(name, data); done("deleted")
                else:
                    to = select("Move to position", [questionary.Choice(str(i + 1), i) for i in range(len(data))], default=idx)
                    data.insert(to, data.pop(idx)); save(name, data); done("moved")
        except Back:
            continue

# ───────────────────────── markdown entries ─────────────────────────
def read_entry(p):
    raw = p.read_text(encoding="utf8")
    m = re.match(r"---\r?\n(.*?)\r?\n---\r?\n?(.*)", raw, re.S)
    meta = pub.front(p)
    return meta, (m.group(2) if m else raw).strip("\n")

def write_entry(p, meta, body, keys):
    head = "\n".join(f"{k}: {meta[k]}" for k in keys if meta.get(k))
    p.write_text(f"---\n{head}\n---\n{body.strip()}\n", encoding="utf8")

def entries(kind, title, keys, extra):
    folder = C / kind
    folder.mkdir(parents=True, exist_ok=True)
    while True:
        con.clear(); banner(title, f"content/{kind}/*.md")
        files = sorted(folder.glob("*.md"), reverse=True)
        t = Table(box=box.SIMPLE_HEAD, header_style=f"bold {CYAN}", border_style=DIM, pad_edge=False)
        for h in ("date", "title", "words"):
            t.add_column(h, no_wrap=True, overflow="ellipsis", max_width=40)
        for p in files:
            m, b = read_entry(p)
            t.add_row(m["date"], m["title"], str(len(b.split())))
        con.print(t if files else Text("  no entries yet", style=DIM))
        try:
            act = select("What now?", ["Write new", "Edit one", "Preview one", "Delete one", "← Back"])
        except Back:
            return
        if act == "← Back":
            return
        try:
            if act == "Write new":
                new_entry(kind, keys, extra); continue
            if not files:
                continue
            p = select("Which one?", [questionary.Choice(f"{f.stem}", f) for f in files])
            if act == "Edit one":
                edit_entry(p, keys, extra)
            elif act == "Preview one":
                con.clear(); m, b = read_entry(p)
                con.print(Panel(Markdown(b), title=m["title"], border_style=CYAN, padding=(1, 3)))
                questionary.press_any_key_to_continue("press any key", style=STYLE).ask()
            elif confirm(f"Delete {p.name}?", False):
                p.unlink(); done("deleted")
        except Back:
            continue

def meta_prompts(meta, extra):
    meta["title"] = text("Title", meta.get("title", ""))
    meta["date"] = text("Date (YYYY-MM-DD)", meta.get("date") or str(date.today()))
    for k, label in extra:
        meta[k] = text(label, meta.get(k, ""))
    return meta

def new_entry(kind, keys, extra):
    meta = meta_prompts({}, extra)
    slug = f"{meta['date']}-{slugify(meta['title'])}" if kind == "posts" else meta["date"]
    p = C / kind / f"{slug}.md"
    if p.exists() and not confirm(f"{p.name} exists. Overwrite?", False):
        return
    body = edit_text("", hint="Body")
    write_entry(p, meta, body, keys)
    working("rebuilding index", pub.build_index, .3)
    done(f"wrote {p.relative_to(ROOT)}")

def edit_entry(p, keys, extra):
    meta, body = read_entry(p)
    what = select("Edit", ["Body (editor)", "Title & details", "Both"])
    if what != "Body (editor)":
        meta = meta_prompts(meta, extra)
    if what != "Title & details":
        body = edit_text(body, hint="Body")
    write_entry(p, meta, body, keys)
    done("saved")

# ───────────────────────── site (main page) ─────────────────────────
def edit_strings(site, key, label):
    while True:
        con.clear(); banner(label, f"site.json › {key}")
        items = site.get(key, [])
        for i, s in enumerate(items, 1):
            con.print(Text(f" {i:>2}. ", style=DIM) + Text(s if len(s) < 90 else s[:87] + "…"))
        try:
            act = select("What now?", ["Add", "Edit", "Delete", "← Back"])
            if act == "← Back":
                return
            if act == "Add":
                items.append(edit_text("", hint=label).strip() if key == "about" else text("New line"))
            elif items:
                i = select("Which?", [questionary.Choice(f"{n + 1}. {s[:60]}", n) for n, s in enumerate(items)])
                if act == "Edit":
                    items[i] = edit_text(items[i], hint=label) if key == "about" else text("Text", items[i])
                elif confirm("Delete it?", False):
                    items.pop(i)
            site[key] = items; stamp(site, key); save("site", site); done("saved")
        except Back:
            return

def stamp(site, key):
    if key == "now":
        site["nowUpdated"] = date.today().strftime("%b %-d, %Y") if os.name != "nt" else date.today().strftime("%b %d, %Y")

def edit_pairs(site, key, label, fields):
    while True:
        con.clear(); banner(label, f"site.json › {key}")
        items = site.get(key, [])
        for i, it in enumerate(items, 1):
            con.print(Text(f" {i:>2}. ", style=DIM) + Text(str(it[fields[0][0]]), style="bold") + Text("  " + str(it[fields[1][0]])[:60], style=DIM))
        try:
            act = select("What now?", ["Add", "Edit", "Delete", "← Back"])
            if act == "← Back":
                return
            if act == "Add":
                items.append({f[0]: ask_field(f, "") for f in fields})
            elif items:
                i = select("Which?", [questionary.Choice(f"{n + 1}. {it[fields[0][0]]}", n) for n, it in enumerate(items)])
                if act == "Edit":
                    for f in fields:
                        items[i][f[0]] = ask_field(f, items[i].get(f[0], ""))
                elif confirm("Delete it?", False):
                    items.pop(i)
            site[key] = items; save("site", site); done("saved")
        except Back:
            return

def edit_contacts(site):
    edit_pairs(site, "contacts", "Contacts", [("label", "Label (GitHub, Email…)", "text"), ("handle", "Handle shown", "text"), ("url", "Link (https:// or mailto:)", "text")])

def site_menu():
    while True:
        con.clear(); banner("Main page", "content/site.json")
        site = load("site", {})
        con.print(Panel(Group(Text(site.get("name", ""), style=f"bold {AMBER}"), Text(site.get("role", "")), Text(site.get("headline", ""), style=DIM)),
                        border_style=DIM, box=box.ROUNDED))
        try:
            c = select("Edit which section?", ["Basics (name, role, headline…)", "About paragraphs", "What I'm into", "Experimenting with",
                                               "Before this", "Now", "Contacts", "← Back"])
            if c == "← Back":
                return
            if c.startswith("Basics"):
                for k, l in (("name", "Name"), ("role", "Role"), ("location", "Location"), ("headline", "Headline"), ("github", "GitHub username")):
                    site[k] = text(l, site.get(k, ""))
                save("site", site); done("saved")
            elif c == "About paragraphs": edit_strings(site, "about", "About paragraphs")
            elif c == "What I'm into": edit_pairs(site, "interests", "What I'm into", [("t", "Title", "text"), ("d", "Description", "text")])
            elif c == "Experimenting with": edit_strings(site, "experiments", "Experimenting with")
            elif c == "Before this": edit_strings(site, "background", "Before this")
            elif c == "Now": edit_strings(site, "now", "Now")
            else: edit_contacts(site)
        except Back:
            return

# ───────────────────────── serve / publish ─────────────────────────
def serve(open_browser=True, port=8000):
    pub.build_index()
    h = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))
    h.log_message = lambda *a, **k: None
    http.server.ThreadingHTTPServer.allow_reuse_address = True
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", port), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    url = f"http://localhost:{port}"
    if open_browser:
        webbrowser.open(url)
    con.print(Panel(Text.assemble(("live preview  ", DIM), (url, f"bold {CYAN}"), ("\nreload the page after saving edits", DIM)), border_style=CYAN, box=box.ROUNDED))
    return srv

def publish_flow():
    con.clear(); banner("Publish", "rebuild index → commit → push")
    working("rebuilding index", pub.build_index, .3)
    subprocess.run([sys.executable, str(Path(__file__).parent / "publish.py"), "--dry"])
    try:
        if not confirm("Sync with GitHub now?", True):
            return
        msg = text("Commit message", f"update {date.today()}")
        subprocess.run([sys.executable, str(Path(__file__).parent / "publish.py"), "-y", "-m", msg])
    except Back:
        return
    questionary.press_any_key_to_continue("press any key", style=STYLE).ask()

# ───────────────────────── main ─────────────────────────
PROJECT_F = [("title", "Title", "text"), ("status", "Status", "choice:live,open source,in progress,prototype,built,dataset,idea"),
             ("blurb", "One-line blurb (shown in lists)", "text"), ("details", "Longer write-up: what, why, how it works", "editor"),
             ("tags", "Tags, comma separated", "tags"), ("year", "Year", "text"), ("url", "Link (blank if none)", "text")]
BOOK_F = [("title", "Title", "text"), ("author", "Author", "text"), ("status", "Status", "choice:reading,next,read"),
          ("rating", "Rating 1-5 (blank to skip)", "text"), ("note", "Your take, a few sentences", "text")]
SHARED_F = [("name", "Site / author", "text"), ("url", "URL", "text"), ("note", "Why it's worth reading", "text"), ("tags", "Tags, comma separated", "tags")]
POST_K, POST_X = ["title", "date", "summary", "tags"], [("summary", "Summary (one or two sentences)"), ("tags", "Tags, comma separated")]
JOURNAL_K, JOURNAL_X = ["title", "date", "mood"], [("mood", "Mood (one word)")]

MENU = [("✎  Notes", "notes"), ("☾  Journal", "journal"), ("▣  Projects", "projects"), ("❏  Reading list", "reading"),
        ("⇄  Shared blogs", "shared"), ("⌂  Main page content", "site"), ("◉  Live preview", "serve"), ("⇪  Publish to GitHub", "publish"), ("✕  Quit", "quit")]

def studio(fast=False):
    intro(fast)
    srv = None
    while True:
        if not fast: con.clear()
        fast = False
        dashboard()
        try:
            c = select("What would you like to do?", [questionary.Choice(l, v) for l, v in MENU])
        except Back:
            c = "quit"
        try:
            if c == "notes": entries("posts", "Notes", POST_K, POST_X); working("rebuilding index", pub.build_index, .2)
            elif c == "journal": entries("journal", "Journal", JOURNAL_K, JOURNAL_X); working("rebuilding index", pub.build_index, .2)
            elif c == "projects": manage("projects", "Projects", PROJECT_F, ["title", "status", "year"])
            elif c == "reading": manage("reading", "Reading list", BOOK_F, ["title", "author", "status"])
            elif c == "shared": manage("shared", "Shared blogs", SHARED_F, ["name", "tags"])
            elif c == "site": site_menu()
            elif c == "serve":
                srv = srv or serve()
                questionary.press_any_key_to_continue("preview running, press any key to go back", style=STYLE).ask()
            elif c == "publish": publish_flow()
            else:
                if srv: srv.shutdown()
                con.print(Text("\nkeep building. ◆\n", style=AMBER)); return
        except Back:
            continue

def main():
    ap = argparse.ArgumentParser(prog="zen")
    ap.add_argument("cmd", nargs="?", choices=["post", "journal", "serve", "publish"])
    ap.add_argument("--fast", action="store_true", help="skip the intro animation")
    a = ap.parse_args()
    try:
        if a.cmd == "post": new_entry("posts", POST_K, POST_X)
        elif a.cmd == "journal": new_entry("journal", JOURNAL_K, JOURNAL_X)
        elif a.cmd == "serve":
            serve(); con.print("ctrl-c to stop")
            while True: time.sleep(1)
        elif a.cmd == "publish": publish_flow()
        else: studio(a.fast)
    except (KeyboardInterrupt, Back):
        con.print("\nbye.")

if __name__ == "__main__":
    main()
