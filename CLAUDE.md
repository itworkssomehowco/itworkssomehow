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
- Fonts: Pixelify Sans (display, `.serif`), Silkscreen (labels/buttons, `.label`), VT323 (meta, `.mono`), JetBrains Mono (body).
- Pixel sprites are inline SVG with `shape-rendering="crispEdges"` and `aria-hidden="true"`.
- Status is always shape/lightness **plus** a text label (`working` / `tuning` / `broken`).
- Default theme is dark; `data-theme` is set on `<html>` before paint by the inline script in `partials/head.html`.
- Transitions are stepped; `prefers-reduced-motion` stops the blinking.

## Content rules
- Posts live in `content/notes/` and the section is `/notes/`. The handoff specified `/posts/`; existing URLs stay put.
- `/shop/` is a draft. The nav and the hero only link pages the build produced, so it appears under `hugo server -D` and not in production.
- Section page headers come from `kicker` / `heading` / `lede` in each `content/*/_index.md`.

## Commands
- `hugo server -D` — dev, drafts visible
- `hugo --gc --minify` — production build to `public/`

## Done =
`hugo --gc --minify` builds with no warnings; every page renders; layouts work at 1440 / 1024 / 768 / 375 px; keyboard navigation and focus rings work.
