# Changelog UX — Luxus Consultores

## audit/main-ready (2026-10)

### Visual language
- Unified brand atmosphere: `--atmosphere-color` blue + `--atmosphere-color-alt` purple defaults in `ux-legibility.css`.
- Canonical pill-kicker / section-kicker typography tokens.
- Service tab accent colors (blue / purple / green / orange) + `data-service-accent` on service cards.
- Consistent icon size/stroke and title hierarchy (hero-title, section-title).

### Components
- Service cards: no ad-hoc HTML overlays; legibility via CSS `:before` gradient + grayscale-reveal treatment.
- SVG namespaces normalized (`http://www.w3.org/2000/svg`).
- Blog: improved loading / empty / error states; durable `escapeHtml`.
- Home CTA destination fixed; reduced-motion respected across cards, reveals, and animations.

### Files of interest
- `assets/css/ux-legibility.css`
- `assets/css/service-ui.css`
- `assets/partials/cards-services-section.html`
- `assets/js/blog-engine.js`
- Pages: `index.html`, `servicios.html`, `blog.html`, `metodologia.html`, `post.html`
