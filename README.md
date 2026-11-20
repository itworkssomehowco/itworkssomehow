# ItWorksSomehow

Personal engineering blog — IOT / PCB / AI / DIY. Built with Hugo, deployed to GitHub Pages.

## Requirements

- [Hugo Extended](https://gohugo.io/installation/) v0.162.0

```powershell
# Verify installation
hugo version
```

## Local development

```powershell
# Start dev server with live reload
hugo server

# Start with drafts visible (e.g. to preview hidden shop page)
hugo server -D
```

Open [http://localhost:1313](http://localhost:1313) in your browser. Changes to templates, content, and CSS reload automatically.

## Build

```powershell
# Build static output to /public
hugo

# Build minified (mirrors production)
hugo --gc --minify
```

## Deploy

Push to `main` — GitHub Actions builds and deploys automatically via `.github/workflows/deploy.yml`.

```powershell
git add .
git commit -m "your message"
git push origin main
```

## Content

| What | Where |
|------|-------|
| Blog posts | `content/notes/` |
| Section headers (kicker / heading / lede) | `content/*/\_index.md` |
| Lab entries | `data/lab_entries.yaml` |
| Shop products | `data/products.yaml` |
| Projects list | `data/projects.yaml` |
| Lab status + bench gear | `data/lab_status.yaml` |
| Category order in the notes sidebar | `data/categories.yaml` |
| Site config | `hugo.toml` |

### New blog post

```powershell
hugo new notes/your-post-title.md
```

Edit the generated file in `content/notes/`. Set `draft: false` when ready to publish.

### New lab entry

Add a record to `data/lab_entries.yaml` following the existing format.

## Design

Amber-CRT pixel art: no rounded corners, hard offset shadows only, four pixel
fonts (Pixelify Sans / Silkscreen / VT323 / JetBrains Mono), dark theme by
default with a warm-paper light variant. All tokens live at the top of
`assets/css/main.css`; `CLAUDE.md` holds the rules that must not be broken.

## Layout

```
layouts/
  baseof.html         # Shell
  home.html           # Home page
  list.html           # Generic section list (fallback)
  page.html           # Generic single page (fallback)
  taxonomy.html       # /categories/, /tags/
  term.html           # /categories/<x>/, /tags/<x>/
  notes/              # list.html + page.html (post detail)
  projects/list.html  # Project grid + status filter
  lab/list.html       # Lab journal
  shop/list.html      # Shop grid + modal (draft — not linked in production)
  partials/           # nav, footer, head, logo, page-header, section-title,
                      # post-row, project-card, status, newsletter
assets/
  css/main.css        # Tokens, components, both themes, responsive, Chroma
  js/main.js          # Theme + scanline toggles, notes filter, shop filter/modal, mobile nav
static/images/        # Pixel sprites (inlined by the templates)
```

CSS and JS go through Hugo Pipes (minified + fingerprinted), so they are
referenced from `assets/`, not `static/`.
