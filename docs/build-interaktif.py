#!/usr/bin/env python3
"""Bangun docs/interaktif.html dari dokumen Markdown di repo ini.

Satu berkas HTML mandiri: tanpa CDN, tanpa server, bisa dibuka lewat file://.
Isinya seluruh dokumen (README + docs/01..08), sidebar, dan pencarian.

Jalankan dari akar repo:  python3 docs/build-interaktif.py
"""

from __future__ import annotations

import html
import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "docs" / "interaktif.html"

# Urutan tampil di sidebar. (path relatif dari akar repo, judul, slug)
DOCS = [
    ("docs/README.md", "Indeks dokumentasi", "indeks"),
    ("README.md", "README monorepo", "readme"),
    ("docs/01-alur-website.md", "01 — Alur website", "01"),
    ("docs/02-arsitektur.md", "02 — Arsitektur kode", "02"),
    ("docs/03-api.md", "03 — Referensi API", "03"),
    ("docs/04-deployment.md", "04 — Deployment", "04"),
    ("docs/05-basis-data.md", "05 — Basis data", "05"),
    ("docs/06-referensi-rute-api.md", "06 — Referensi rute API", "06"),
    ("docs/07-zona-dapur.md", "07 — Zona: dapur & colokan", "07"),
    ("docs/08-rencana-kerja.md", "08 — Rencana kerja & status", "08"),
]

CODE_TOKEN = "\x00C{}\x00"


# ── Inline ──────────────────────────────────────────────────────────────────

def inline(text: str) -> str:
    codes: list[str] = []

    def stash(m: re.Match) -> str:
        codes.append(m.group(1))
        return CODE_TOKEN.format(len(codes) - 1)

    text = re.sub(r"`([^`]+)`", stash, text)
    text = html.escape(text, quote=False)

    # <https://…>
    text = re.sub(
        r"&lt;(https?://[^\s&]+)&gt;",
        r'<a href="\1" target="_blank" rel="noopener">\1</a>',
        text,
    )
    # ![alt](src)
    text = re.sub(r"!\[([^\]]*)\]\(([^)\s]+)\)", r'<img src="\2" alt="\1" loading="lazy">', text)
    # [text](href)
    text = re.sub(
        r"\[([^\]]+)\]\(([^)\s]+)\)",
        lambda m: '<a href="{}">{}</a>'.format(link(m.group(2)), m.group(1)),
        text,
    )
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"(?<!\w)\*([^*\n]+)\*(?!\w)", r"<em>\1</em>", text)
    text = re.sub(r"(?<![\w`])_([^_\n]+)_(?![\w`])", r"<em>\1</em>", text)

    for i, code in enumerate(codes):
        text = text.replace(CODE_TOKEN.format(i), "<code>" + html.escape(code, quote=False) + "</code>")

    return text


LINK_MAP: dict[str, str] = {}


def link(href: str) -> str:
    """Tautan antar-dokumen jadi anchor dalam halaman; sisanya dibiarkan."""
    if href.startswith(("#", "http://", "https://", "mailto:")):
        return href

    raw, _, _frag = href.partition("#")
    for candidate in (raw, raw.lstrip("./"), raw.split("/")[-1], "docs/" + raw.split("/")[-1]):
        target = LINK_MAP.get(candidate)
        if target:
            return "#" + target

    return href


def slug(text: str) -> str:
    text = re.sub(r"`([^`]+)`", r"\1", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"[*_]", "", text)
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-") or "bagian"


# ── Blok ────────────────────────────────────────────────────────────────────

row_split = re.compile(r"(?<!\\)\|")


def table_cells(line: str) -> list[str]:
    line = line.strip()
    if line.startswith("|"):
        line = line[1:]
    if line.endswith("|"):
        line = line[:-1]
    return [c.strip().replace("\\|", "|") for c in row_split.split(line)]


def is_separator(line: str) -> bool:
    core = line.strip().strip("|").strip()
    return bool(core) and set(core) <= set("|-: ") and "-" in core


def convert(md: str, slug_prefix: str) -> tuple[str, list[tuple[int, str, str]]]:
    lines = md.split("\n")
    out: list[str] = []
    heads: list[tuple[int, str, str]] = []
    used: set[str] = set()
    i = 0
    n = len(lines)

    def uniq(base: str) -> str:
        cand, k = base, 2
        while cand in used:
            cand = f"{base}-{k}"
            k += 1
        used.add(cand)
        return cand

    while i < n:
        line = lines[i]

        # Fenced code
        if line.lstrip().startswith("```"):
            lang = line.lstrip()[3:].strip()
            fence_indent = len(line) - len(line.lstrip())
            i += 1
            buf = []
            while i < n and not lines[i].lstrip().startswith("```"):
                buf.append(lines[i][fence_indent:] if lines[i].startswith(" " * fence_indent) else lines[i])
                i += 1
            i += 1
            cls = f' class="language-{html.escape(lang)}"' if lang else ""
            out.append(f"<pre><code{cls}>{html.escape(chr(10).join(buf))}</code></pre>")
            continue

        # Blank
        if not line.strip():
            i += 1
            continue

        # Horizontal rule
        if re.fullmatch(r"\s*(-{3,}|\*{3,}|_{3,})\s*", line):
            out.append("<hr>")
            i += 1
            continue

        # Heading
        m = re.match(r"^(#{1,6})\s+(.*?)\s*#*\s*$", line)
        if m:
            level = len(m.group(1))
            text = m.group(2)
            hid = f"{slug_prefix}--{uniq(slug(text))}"
            heads.append((level, re.sub(r"[`*_]", "", text), hid))
            out.append(
                f'<h{level} id="{hid}">{inline(text)}'
                f'<a class="anchor" href="#{hid}" aria-label="Tautan ke bagian ini">#</a></h{level}>'
            )
            i += 1
            continue

        # Table
        if "|" in line and i + 1 < n and "|" in lines[i + 1] and is_separator(lines[i + 1]):
            head = table_cells(line)
            i += 2
            body = []
            while i < n and lines[i].strip() and "|" in lines[i]:
                body.append(table_cells(lines[i]))
                i += 1
            th = "".join(f"<th>{inline(c)}</th>" for c in head)
            rows = []
            for r in body:
                r = (r + [""] * len(head))[: len(head)]
                rows.append("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>")
            out.append(f'<div class="table-wrap"><table><thead><tr>{th}</tr></thead><tbody>{"".join(rows)}</tbody></table></div>')
            continue

        # Blockquote
        if line.lstrip().startswith(">"):
            buf = []
            while i < n and lines[i].lstrip().startswith(">"):
                buf.append(re.sub(r"^\s*>\s?", "", lines[i]))
                i += 1
            inner = " ".join(x.strip() for x in buf if x.strip())
            out.append(f"<blockquote>{inline(inner)}</blockquote>")
            continue

        # List (unordered / ordered), with nesting by indentation
        if re.match(r"^\s*([-*+]|\d+[.)])\s+", line):
            items: list[tuple[int, str, bool]] = []
            while i < n:
                lm = re.match(r"^(\s*)([-*+]|\d+[.)])\s+(.*)$", lines[i])
                if not lm:
                    if lines[i].strip() and items:
                        items[-1] = (items[-1][0], items[-1][1] + " " + lines[i].strip(), items[-1][2])
                        i += 1
                        continue
                    break
                indent = len(lm.group(1).replace("\t", "    "))
                items.append((indent, lm.group(3), lm.group(2)[0].isdigit()))
                i += 1

            def render(idx: int, indent: int) -> tuple[str, int]:
                ordered = items[idx][2]
                tag = "ol" if ordered else "ul"
                parts = [f"<{tag}>"]
                while idx < len(items):
                    cur_indent, text, _ = items[idx]
                    if cur_indent < indent:
                        break
                    if cur_indent > indent:
                        sub, idx = render(idx, cur_indent)
                        parts.append(sub)
                        continue
                    idx += 1
                    nxt = items[idx][0] if idx < len(items) else -1
                    if nxt > cur_indent:
                        sub, idx = render(idx, nxt)
                        parts.append(f"<li>{inline(text)}{sub}</li>")
                    else:
                        parts.append(f"<li>{inline(text)}</li>")
                parts.append(f"</{tag}>")
                return "".join(parts), idx

            rendered = render(0, items[0][0])[0] if items else ""
            out.append(rendered)
            continue

        # Paragraph
        buf = [line.strip()]
        i += 1
        while i < n and lines[i].strip() and not re.match(
            r"^(\s*([-*+]|\d+[.)])\s+|\s*#{1,6}\s|\s*>|\s*```|\s*(-{3,}|\*{3,})\s*$)", lines[i]
        ):
            buf.append(lines[i].strip())
            i += 1
        out.append(f"<p>{inline(' '.join(buf))}</p>")

    return "\n".join(out), heads


# ── Susun dokumen ───────────────────────────────────────────────────────────

def main() -> None:
    sections: list[str] = []
    nav: list[str] = []

    for path, title, doc_slug in DOCS:
        file = ROOT / path
        if not file.exists():
            raise SystemExit(f"dokumen tidak ditemukan: {path}")
        LINK_MAP[path] = f"doc-{doc_slug}"
        LINK_MAP[path.split("/")[-1]] = f"doc-{doc_slug}"

    for path, title, doc_slug in DOCS:
        md = (ROOT / path).read_text(encoding="utf-8")
        body, heads = convert(md, f"doc-{doc_slug}")

        toc = []
        for level, text, hid in heads:
            if level > 3:
                continue
            toc.append(
                f'<a class="toc-link lvl{level}" href="#{hid}" data-doc="doc-{doc_slug}">{html.escape(text)}</a>'
            )

        nav.append(
            '<div class="nav-doc" data-doc="doc-{s}">'
            '<a class="nav-title" href="#doc-{s}">{t}</a>'
            '<div class="nav-toc">{toc}</div>'
            "</div>".format(s=doc_slug, t=html.escape(title), toc="".join(toc))
        )
        sections.append(
            f'<section class="doc" id="doc-{doc_slug}" data-title="{html.escape(title)}">{body}</section>'
        )

    page = (
        TEMPLATE.replace("__NAV__", "\n".join(nav))
        .replace("__CONTENT__", "\n".join(sections))
        .replace("__CSS__", CSS)
        .replace("__VTITLE__", "Dokumentasi Website Topup")
        .replace("__COUNT__", str(len(DOCS)))
        .replace("__DATE__", date.today().isoformat())
    )

    OUT.write_text(page, encoding="utf-8")
    print(f"OK  {OUT.relative_to(ROOT)}  ({len(page) / 1024:.0f} KB, {len(DOCS)} dokumen)")


TEMPLATE = """<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>__VTITLE__</title>
<meta name="robots" content="noindex">
<style>
__CSS__
</style>
</head>
<body>
<header class="topbar">
  <button id="menu" class="icon-btn" aria-label="Buka daftar isi">☰</button>
  <a class="brand" href="#doc-indeks">Website Topup <span>· dokumentasi</span></a>
  <div class="search">
    <input id="q" type="search" placeholder="Cari…  (tekan / atau Ctrl+K)" autocomplete="off" spellcheck="false" aria-label="Cari dokumentasi">
    <button id="clear" class="icon-btn" aria-label="Bersihkan" hidden>×</button>
  </div>
  <button id="theme" class="icon-btn" aria-label="Ganti tema">◐</button>
</header>

<div class="layout">
  <nav id="nav" aria-label="Daftar isi">
    <div id="results" hidden></div>
    <div id="nav-list">
      <p class="nav-hint">__COUNT__ dokumen · diperbarui __DATE__</p>
      __NAV__
    </div>
  </nav>

  <main id="content">
    __CONTENT__
  </main>
</div>

<script>
(function () {
  "use strict";

  var q = document.getElementById("q");
  var clearBtn = document.getElementById("clear");
  var results = document.getElementById("results");
  var navList = document.getElementById("nav-list");
  var nav = document.getElementById("nav");
  var content = document.getElementById("content");
  var flashTimer = null;

  /* ── Index pencarian: dibangun dari DOM, bukan dari berkas terpisah ── */
  var UNITS = [];
  var heads = content.querySelectorAll("h1, h2, h3, h4");
  var currentDoc = "";
  var currentTitle = "";
  var currentHeading = "";
  var currentId = "";

  var all = content.querySelectorAll("section.doc");
  all.forEach(function (doc) {
    currentDoc = doc.dataset.title || "";
    var walker = document.createTreeWalker(doc, NodeFilter.SHOW_ELEMENT, null);
    var node = doc;
    var stack = [];
    (function visit(el) {
      var kids = el.children;
      for (var i = 0; i < kids.length; i++) {
        var child = kids[i];
        var tag = child.tagName.toLowerCase();
        if (/^h[1-4]$/.test(tag)) {
          stack = stack.slice(0, parseInt(tag[1], 10) - 1);
          stack[parseInt(tag[1], 10) - 1] = child.textContent.replace("#", "").trim();
          UNITS.push({ el: child, doc: currentDoc, path: stack.filter(Boolean).join(" › "), text: child.textContent.replace("#", "").trim(), kind: "judul" });
        } else if (tag === "p" || tag === "li" || tag === "tr" || tag === "blockquote") {
          var t = child.textContent.replace(/\\s+/g, " ").trim();
          if (t) UNITS.push({ el: child, doc: currentDoc, path: stack.filter(Boolean).join(" › "), text: t, kind: "" });
        }
        if (child.children.length) visit(child);
      }
    })(doc);
  });

  /* ── Pencarian ── */
  function norm(s) {
    return s.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
  }
  var NORM = UNITS.map(function (u) { return norm(u.text); });

  function escapeHtml(s) {
    return s.replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; });
  }

  function snippet(text, needle) {
    var i = norm(text).indexOf(needle);
    if (i < 0) return escapeHtml(text.slice(0, 160));
    var from = Math.max(0, i - 60);
    var to = Math.min(text.length, i + needle.length + 110);
    var pre = (from > 0 ? "… " : "") + text.slice(from, i);
    var mid = text.slice(i, i + needle.length);
    var post = text.slice(i + needle.length, to) + (to < text.length ? " …" : "");
    return escapeHtml(pre) + "<mark>" + escapeHtml(mid) + "</mark>" + escapeHtml(post);
  }

  function runSearch(term) {
    var needle = norm(term.trim());
    if (needle.length < 2) {
      results.hidden = true;
      results.innerHTML = "";
      navList.hidden = false;
      unhighlight();
      return;
    }

    var hits = [];
    for (var i = 0; i < UNITS.length && hits.length < 60; i++) {
      var at = NORM[i].indexOf(needle);
      if (at < 0) continue;
      hits.push({ u: UNITS[i], at: at, weight: (UNITS[i].kind === "judul" ? 0 : 1) * 1000 + at });
    }
    hits.sort(function (a, b) { return a.weight - b.weight; });

    navList.hidden = true;
    results.hidden = false;
    results.innerHTML =
      '<p class="nav-hint">' + hits.length + " hasil" + (hits.length === 60 ? "+" : "") + "</p>" +
      hits.map(function (h, idx) {
        return (
          '<button class="hit" data-unit="' + UNITS.indexOf(h.u) + '"' + (idx === 0 ? ' data-first="1"' : "") + ">" +
          '<span class="hit-doc">' + escapeHtml(h.u.doc) + "</span>" +
          '<span class="hit-path">' + escapeHtml(h.u.path || "") + "</span>" +
          '<span class="hit-text">' + snippet(h.u.text, needle) + "</span>" +
          "</button>"
        );
      }).join("");
  }

  function goTo(unitIndex) {
    var u = UNITS[unitIndex];
    if (!u) return;
    u.el.scrollIntoView({ behavior: "smooth", block: "center" });
    if (u.el.tagName.match(/^H[1-4]$/)) {
      history.replaceState(null, "", "#" + u.el.id);
    }
    if (flashTimer) clearTimeout(flashTimer);
    u.el.classList.add("flash");
    flashTimer = setTimeout(function () { u.el.classList.remove("flash"); }, 1600);
  }

  function unhighlight() {
    content.querySelectorAll("mark.ms").forEach(function (m) {
      var parent = m.parentNode;
      parent.replaceChild(document.createTextNode(m.textContent), m);
      parent.normalize();
    });
  }

  /* Sorot seluruh kecocokan di dokumen yang sedang tampil. */
  function highlight(term) {
    unhighlight();
    var needle = term.trim();
    if (needle.length < 2) return;
    var rx = new RegExp(needle.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&"), "gi");
    var walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (node.parentNode.closest("pre, code, mark")) return NodeFilter.FILTER_REJECT;
        return rx.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var targets = [];
    while (walker.nextNode()) targets.push(walker.currentNode);
    targets.forEach(function (node) {
      var frag = document.createDocumentFragment();
      var rest = node.nodeValue;
      var m;
      rx.lastIndex = 0;
      var last = 0;
      while ((m = rx.exec(rest)) !== null) {
        frag.appendChild(document.createTextNode(rest.slice(last, m.index)));
        var mark = document.createElement("mark");
        mark.className = "ms";
        mark.textContent = m[0];
        frag.appendChild(mark);
        last = m.index + m[0].length;
        if (m[0].length === 0) break;
      }
      frag.appendChild(document.createTextNode(rest.slice(last)));
      node.parentNode.replaceChild(frag, node);
    });
  }

  var debounce = null;
  q.addEventListener("input", function () {
    clearBtn.hidden = !q.value;
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(function () {
      runSearch(q.value);
      highlight(q.value);
    }, 120);
  });

  q.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { q.value = ""; q.dispatchEvent(new Event("input")); q.blur(); }
    if (e.key === "Enter") {
      var first = results.querySelector('[data-first="1"]');
      if (first) goTo(parseInt(first.dataset.unit, 10));
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      var hits = Array.prototype.slice.call(results.querySelectorAll(".hit"));
      if (!hits.length) return;
      e.preventDefault();
      var idx = hits.indexOf(document.activeElement);
      var next = e.key === "ArrowDown" ? idx + 1 : idx - 1;
      if (next < 0) next = hits.length - 1;
      if (next >= hits.length) next = 0;
      hits[next].focus();
    }
  });

  results.addEventListener("click", function (e) {
    var btn = e.target.closest(".hit");
    if (btn) goTo(parseInt(btn.dataset.unit, 10));
  });

  clearBtn.addEventListener("click", function () {
    q.value = "";
    q.dispatchEvent(new Event("input"));
    q.focus();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && document.activeElement !== q) { e.preventDefault(); q.focus(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); q.focus(); q.select(); }
  });

  /* ── Tema ── */
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem("docs-theme"); } catch (err) {}
  function applyTheme(t) {
    root.dataset.theme = t;
    try { localStorage.setItem("docs-theme", t); } catch (err) {}
  }
  if (saved) applyTheme(saved);
  document.getElementById("theme").addEventListener("click", function () {
    applyTheme(root.dataset.theme === "dark" ? "light" : "dark");
  });

  /* ── Navigasi ── */
  document.getElementById("menu").addEventListener("click", function () {
    document.body.classList.toggle("nav-open");
  });

  nav.addEventListener("click", function (e) {
    if (e.target.closest("a")) {
      document.body.classList.remove("nav-open");
    }
  });

  /* Sorot dokumen yang sedang dilihat. */
  var seen = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      document.querySelectorAll(".nav-doc").forEach(function (d) {
        d.classList.toggle("active", d.dataset.doc === entry.target.id);
      });
    });
  }, { rootMargin: "-10% 0px -80% 0px" });
  all.forEach(function (d) { seen.observe(d); });

  if (location.hash) {
    var target = document.querySelector(location.hash.replace(/[^\\w-]/g, ""));
    if (target) target.scrollIntoView();
  }

  var last = "";
  window.addEventListener("scroll", function () {
    var links = content.querySelectorAll("h1, h2, h3");
    var active = "";
    for (var i = 0; i < links.length; i++) {
      var el = links[i];
      if (el.getBoundingClientRect().top < 120) active = el.id;
    }
    if (active === last) return;
    last = active;
    document.querySelectorAll(".toc-link").forEach(function (a) {
      a.classList.toggle("current", a.getAttribute("href") === "#" + active);
    });
  }, { passive: true });
})();
</script>
</body>
</html>
"""

CSS = """
:root{
  --bg:#f7f7f5; --panel:#ffffff; --ink:#1c1c1a; --muted:#6b6b66; --line:#e3e3dd;
  --accent:#7a3ff2; --accent-soft:#f0e9ff; --code-bg:#f2f1ee; --mark:#ffe9a8;
  --radius:12px; --mono:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;
  --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
}
:root[data-theme="dark"]{
  --bg:#141413; --panel:#1c1c1a; --ink:#ececea; --muted:#a1a19a; --line:#2f2f2c;
  --accent:#b79bff; --accent-soft:#2a2340; --code-bg:#232320; --mark:#5a4a12;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{
  margin:0; background:var(--bg); color:var(--ink); font-family:var(--sans);
  font-size:15.5px; line-height:1.7; -webkit-text-size-adjust:100%;
}
a{color:var(--accent); text-decoration:none}
a:hover{text-decoration:underline}

/* Topbar */
.topbar{
  position:sticky; top:0; z-index:30; display:flex; gap:10px; align-items:center;
  padding:10px 16px; background:color-mix(in srgb, var(--panel) 88%, transparent);
  backdrop-filter:saturate(160%) blur(8px); border-bottom:1px solid var(--line);
}
.brand{font-weight:700; letter-spacing:-.01em; color:var(--ink)}
.brand span{color:var(--muted); font-weight:500}
.icon-btn{
  border:1px solid var(--line); background:var(--panel); color:var(--ink);
  border-radius:10px; width:36px; height:36px; font-size:16px; cursor:pointer; line-height:1;
}
.icon-btn:hover{border-color:var(--accent)}
#menu{display:none}
.search{position:relative; margin-left:auto; flex:0 1 380px; display:flex; align-items:center}
.search input{
  width:100%; padding:9px 36px 9px 12px; border-radius:10px; border:1px solid var(--line);
  background:var(--bg); color:var(--ink); font:inherit; font-size:14px;
}
.search input:focus{outline:2px solid var(--accent-soft); border-color:var(--accent)}
#clear{position:absolute; right:4px; width:28px; height:28px; border:0; background:transparent}

/* Layout */
.layout{display:grid; grid-template-columns:320px minmax(0,1fr); gap:0; align-items:start}
#nav{
  position:sticky; top:57px; height:calc(100vh - 57px); overflow:auto; padding:16px 12px 48px;
  border-right:1px solid var(--line); background:var(--panel);
}
.nav-hint{color:var(--muted); font-size:11.5px; text-transform:uppercase; letter-spacing:.08em; margin:6px 8px 12px}
.nav-doc{margin:0 0 10px; padding:4px 0; border-radius:var(--radius)}
.nav-doc.active{background:var(--accent-soft)}
.nav-title{display:block; padding:6px 10px; font-weight:650; color:var(--ink); font-size:14px}
.nav-toc{display:flex; flex-direction:column}
.toc-link{padding:3px 10px 3px 22px; font-size:13px; color:var(--muted); border-left:2px solid transparent; margin-left:10px}
.toc-link.lvl3{padding-left:34px; font-size:12.5px}
.toc-link:hover{color:var(--ink); text-decoration:none}
.toc-link.current{color:var(--accent); border-left-color:var(--accent); font-weight:600}

#content{max-width:920px; padding:28px 40px 120px; min-width:0}
.doc{padding-bottom:48px; margin-bottom:48px; border-bottom:1px solid var(--line)}
.doc:last-child{border-bottom:0}

/* Isi */
h1,h2,h3,h4{line-height:1.3; letter-spacing:-.01em; scroll-margin-top:76px; position:relative}
h1{font-size:1.9em; margin:.2em 0 .6em; padding-bottom:.3em; border-bottom:1px solid var(--line)}
h2{font-size:1.4em; margin:1.8em 0 .5em}
h3{font-size:1.12em; margin:1.6em 0 .4em; color:var(--muted); text-transform:none}
h4{font-size:1em; margin:1.3em 0 .3em}
p{margin:.7em 0}
.anchor{opacity:0; margin-left:.4em; font-weight:400; color:var(--muted); font-size:.8em}
h1:hover .anchor,h2:hover .anchor,h3:hover .anchor,h4:hover .anchor{opacity:1}
ul,ol{margin:.6em 0 .6em 1.3em; padding:0}
li{margin:.25em 0}
li>ul,li>ol{margin:.2em 0 .2em 1.1em}
code{background:var(--code-bg); padding:.15em .4em; border-radius:6px; font-family:var(--mono); font-size:.88em}
pre{background:var(--code-bg); border:1px solid var(--line); border-radius:var(--radius); padding:14px 16px; overflow:auto; margin:1em 0}
pre code{background:none; padding:0; font-size:12.8px; line-height:1.6; white-space:pre}
blockquote{margin:1em 0; padding:.6em 1em; border-left:3px solid var(--accent); background:var(--accent-soft); border-radius:0 var(--radius) var(--radius) 0}
blockquote p{margin:0}
hr{border:0; border-top:1px solid var(--line); margin:2em 0}
.table-wrap{overflow-x:auto; margin:1em 0}
table{border-collapse:collapse; width:100%; font-size:13.6px}
th,td{border:1px solid var(--line); padding:8px 10px; text-align:left; vertical-align:top}
th{background:var(--code-bg); font-weight:650}
tbody tr:nth-child(even){background:color-mix(in srgb, var(--code-bg) 45%, transparent)}
img{max-width:100%}
mark{background:var(--mark); color:inherit; border-radius:3px; padding:0 .1em}
.flash{animation:flash 1.6s ease-out}
@keyframes flash{0%{background:var(--accent-soft)}100%{background:transparent}}

/* Hasil pencarian */
#results{display:flex; flex-direction:column; gap:4px}
.hit{
  text-align:left; border:1px solid transparent; background:transparent; color:var(--ink);
  border-radius:10px; padding:8px 10px; cursor:pointer; font:inherit; font-size:13px;
  display:flex; flex-direction:column; gap:2px;
}
.hit:hover,.hit:focus{border-color:var(--accent); outline:none; background:var(--accent-soft)}
.hit-doc{font-size:11px; text-transform:uppercase; letter-spacing:.06em; color:var(--accent); font-weight:650}
.hit-path{font-size:11px; color:var(--muted)}
.hit-text{color:var(--ink); font-size:12.6px; line-height:1.5}

@media (max-width:960px){
  #menu{display:inline-flex; align-items:center; justify-content:center}
  .layout{grid-template-columns:1fr}
  #nav{position:fixed; inset:57px auto 0 0; width:300px; transform:translateX(-102%); transition:transform .2s ease; z-index:25}
  body.nav-open #nav{transform:none; box-shadow:0 10px 40px rgba(0,0,0,.18)}
  #content{padding:20px 18px 100px}
}
@media print{
  .topbar,#nav{display:none} .layout{grid-template-columns:1fr} #content{max-width:none; padding:0}
  .doc{page-break-after:always; border:0}
}
"""

if __name__ == "__main__":
    main()
