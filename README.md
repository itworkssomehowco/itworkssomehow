# ItWorksSomehow

Personal engineering blog — IOT / PCB / AI / DIY. Built with Hugo, deployed to GitHub Pages.

## Requirements

- [Hugo Extended](https://gohugo.io/installation/) v0.147.1+ (Extended version required for SCSS)

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
| Lab entries | `data/lab_entries.yaml` |
| Shop products | `data/products.yaml` |
| Projects list | `data/projects.yaml` |
| Lab status | `data/lab_status.yaml` |
| Site config | `hugo.toml` |

### New blog post

```powershell
hugo new notes/your-post-title.md
```

Edit the generated file in `content/notes/`. Set `draft: false` when ready to publish.

### New lab entry

Add a record to `data/lab_entries.yaml` following the existing format.

## Layout

```
layouts/
  index.html          # Home page
  partials/
    nav.html          # Navbar + hamburger
    head.html         # <head>, viewport, fonts
    footer.html       # Footer
  notes/              # Blog list + single post
  lab/                # Lab page
  shop/               # Shop page (draft — not linked)
  _default/           # Fallback templates (taxonomy, term, single)
static/
  css/main.css        # All styles + dark mode + responsive
  js/main.js          # Theme toggle, hamburger nav, shop filter/modal
```
