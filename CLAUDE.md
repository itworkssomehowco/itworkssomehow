# CLAUDE.md — ItWorksSomehow (Hugo)

Personal DIY blog: PCB design, electronics, embedded, 3D printing. Static site built with **Hugo (extended)**.

## Source of truth
- `assets/css/main.css` — the design system itself: palette, base, components, both themes, responsive, Chroma. It is the spec now; extend it and don't define tokens anywhere else.
- The design came from a Hugo design handoff package (amber CRT / pixel art) that is no longer kept in the repo. If a question can't be answered from the CSS, ask rather than guess a new value.

## Stack rules
- Hugo templates in `layouts/`, flat naming (`home.html`, `list.html`, `page.html`, `taxonomy.html`, `term.html`, `<section>/list.html`, `<section>/page.html`). Partials for every repeated block.
- One stylesheet entry `assets/css/main.css` and one `assets/js/main.js`, both through Hugo Pipes (minify + fingerprint). Nothing in `static/css` or `static/js`.
- JS is vanilla and optional: theme toggle, scanline toggle, notes search/filter, shop filter/modal, mobile menu. The site must stay usable with JS off (category buttons are real taxonomy links).
- No CSS frameworks, no npm runtime deps, no third-party Hugo theme.
- Content stays in Markdown front matter + `data/*.yaml`. Don't hardcode post/project/product data in templates, and don't invent data to fill a layout.

## Design rules (don't break these)
- No border-radius. No blurred shadows — only hard offset shadows. No gradients except the scanlines.
- Only the tokens in `assets/css/main.css`. A new colour must pass 4.5:1 on `--bg` in **both** themes.
- Fonts: Pixelify Sans (display, `.serif`), Silkscreen (labels/buttons, `.label`), VT323 (meta, `.mono`), JetBrains Mono (body). Silkscreen and VT323 have no Cyrillic, so every pixel stack falls back to Pixelify Sans, then Tiny5 — loaded only for the capital П and І that Pixelify lacks.
- Pixel sprites are inline SVG with `shape-rendering="crispEdges"` and `aria-hidden="true"`.
- Status is always shape/lightness **plus** a text label (`working` / `tuning` / `broken`).
- Default theme is dark; `data-theme` is set on `<html>` before paint by the inline script in `partials/head.html`.
- Transitions are stepped; `prefers-reduced-motion` stops the blinking.

## Content rules
- Posts live in `content/notes/` and the section is `/notes/`. The handoff specified `/posts/`; existing URLs stay put.
- `/shop/` is a draft. The nav and the hero only link pages the build produced, so it appears under `hugo server -D` and not in production.
- Section page headers come from `kicker` / `heading` / `lede` in each `content/*/_index.md`.

## Languages
- English (default, at `/`), Ukrainian (`/uk/`), Spanish (`/es/`). English stays at the root so existing URLs don't move.
- A translation sits next to its original with the language in the name: `home-lab.md` → `home-lab.uk.md`, `home-lab.es.md`; `_index.md` → `_index.uk.md`. Keep `date`, `categories`, `tags` and `readtime` identical; translate `title`, `excerpt` and the body (prose and code comments, not code or config).
- No UI text in templates: every string goes through `i18n` with keys in `i18n/en.yaml`, `uk.yaml`, `es.yaml` — add a key to all three. Ukrainian plurals need `one` / `few` / `many` / `other`.
- Internal links use `relLangURL` (not `relURL`) and no leading slash, so they stay in the current language and under a baseURL subpath.
- Category terms stay English (they are the URL and the `data-cat` filter key); their labels come from `cat-<slug>` keys via `partials/cat-name.html`. Tags are proper nouns and aren't translated.
- `data/*.yaml` entries take optional `uk:` / `es:` blocks of overriding fields, applied by `partials/localize.html`.
- Language-specific site params (`description`, `footerTagline`) live under `[languages.<lang>.params]` in `hugo.toml`.

## Commands
- `hugo server -D` — dev, drafts visible
- `hugo --gc --minify` — production build to `public/`

## Done =
`hugo --gc --minify` builds with no warnings; every page renders; layouts work at 1440 / 1024 / 768 / 375 px; keyboard navigation and focus rings work.
