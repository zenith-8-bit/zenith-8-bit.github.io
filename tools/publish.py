#!/usr/bin/env python3
"""Rebuild the content index, show local vs GitHub differences, commit and push."""
import argparse, json, re, sys
from datetime import date
from pathlib import Path
try:
    from git import Repo, InvalidGitRepositoryError, GitCommandError
except ImportError:
    sys.exit("Missing dependency. Run: pip install -r requirements.txt")

ROOT = Path(__file__).resolve().parent.parent
C = ROOT / "content"
c = lambda s, n: f"\033[{n}m{s}\033[0m"

def front(p):
    m = re.match(r"---\r?\n(.*?)\r?\n---", p.read_text(encoding="utf8"), re.S)
    d = {}
    for l in (m.group(1).splitlines() if m else []):
        if ":" in l:
            k, v = l.split(":", 1); d[k.strip()] = v.strip()
    d["slug"] = p.stem
    d.setdefault("title", p.stem)
    d.setdefault("date", p.stem[:10])
    body = re.sub(r"^---.*?---\r?\n", "", p.read_text(encoding="utf8"), count=1, flags=re.S)
    d["words"] = len(body.split())
    d["read"] = max(1, round(d["words"] / 220))
    return d

def build_index():
    out = {k: sorted((front(p) for p in (C / k).glob("*.md")), key=lambda d: d["date"], reverse=True)
           for k in ("posts", "journal")}
    (C / "index.json").write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf8")
    print(c(f"index: {len(out['posts'])} posts, {len(out['journal'])} journal entries", 36))

def has(repo, ref):
    try: repo.git.rev_parse("--verify", "-q", ref); return True
    except GitCommandError: return False

def state(repo, br):
    """returns (ahead, behind, unrelated) between HEAD and origin/<br>."""
    rb = f"origin/{br}"
    if not (has(repo, "HEAD") and has(repo, rb)):
        return 0, 0, False
    try:
        repo.git.merge_base("HEAD", rb)
    except GitCommandError:
        return 0, 0, True            # no shared history (e.g. GitHub made its own first commit)
    behind, ahead = map(int, repo.git.rev_list("--left-right", "--count", f"{rb}...HEAD").split())
    return ahead, behind, False

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("-m", help="commit message")
    ap.add_argument("-y", action="store_true", help="no prompts")
    ap.add_argument("--dry", action="store_true", help="show differences only")
    a = ap.parse_args()
    build_index()
    try:
        repo = Repo(ROOT)
    except InvalidGitRepositoryError:
        url = input("Not a git repo yet. GitHub remote URL: ").strip()
        repo = Repo.init(ROOT, initial_branch="main")
        repo.create_remote("origin", url)
    try:
        repo.remotes.origin.fetch()
    except Exception as e:
        print(c(f"fetch failed: {e}", 31))
    br = repo.active_branch.name
    ahead, behind, unrelated = state(repo, br)
    dirty = repo.git.status("--porcelain")
    print(f"\nbranch {br}: {c(f'{ahead} ahead', 32)}, {c(f'{behind} behind', 33)} GitHub"
          + (c("  (histories unrelated, will merge)", 33) if unrelated else ""))
    if dirty:
        print(c("\nlocal changes not on GitHub:", 1)); print(dirty)
    elif not (ahead or behind or unrelated or not has(repo, f"origin/{br}")):
        return print(c("\nin sync with GitHub. nothing to do.", 32))
    if a.dry:
        return
    if not a.y and input("\nsync with GitHub? [Y/n] ").lower() == "n":
        return
    if dirty:
        n = len(dirty.splitlines())
        default = f"update {date.today()} ({n} files)"
        msg = a.m or ("" if a.y else input(f"commit message [{default}]: ").strip()) or default
        repo.git.add("-A"); repo.git.commit("-m", msg)
    ahead, behind, unrelated = state(repo, br)       # re-check after committing
    try:
        if unrelated:
            print(c("merging GitHub's history (your local files win conflicts)...", 33))
            repo.git.pull("--no-rebase", "--allow-unrelated-histories", "-X", "ours", "--no-edit", "origin", br)
        elif behind:
            print(c("GitHub has newer commits, rebasing...", 33))
            repo.git.pull("--rebase", "origin", br)
        repo.git.push("-u", "origin", br)
    except GitCommandError as e:
        sys.exit(c(f"git failed:\n{e.stderr}", 31))
    print(c("pushed. Pages updates in about a minute.", 32))

if __name__ == "__main__":
    main()
