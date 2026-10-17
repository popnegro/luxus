# Luxus UX/UI — mejoras implementadas

Rama base: `audit/main-ready`  
Fecha: 2026-10-17

## Cómo aplicar

Los cambios ya están en la rama `ux/visual-language-unify`.

```bash
npm run build
```

El build concatena `ux-legibility.css` + `service-ui.css` dentro de `main.css` en `dist/`.

---

## Cambios por área

### 1. Lenguaje visual unificado (`ux-legibility.css`)

- **Atmósfera global**: default `--atmosphere-color: luxus-blue` + alt púrpura en `:root`.
- **Todas las páginas** usan el mismo par de colores de atmósfera (antes variaba por ruta).
- **Kickers** normalizados (tamaño, tracking 0.16em, peso).
- **Títulos**: `hero-title` con mayor contraste (slate-100) y tracking fijo.
- **Tabs de servicios**: acentos por clase (`tab-blue|purple|green|orange`) + borde izquierdo en desktop cuando están activos.
- **Iconos de cards**: sistema `data-service-accent` (blue / purple / green / orange) que colorea contenedor + span del título.
- **Contraste**: `text-slate-500/600` elevados a un gris más legible.
- **`prefers-reduced-motion`**: desactiva animaciones de cards, reveal, float y pulse.
- **Focus visible** unificado en botones y links de cards.
- **Estados de blog** (empty / error) con estilos propios.

### 2. Imágenes y cards de servicio (`service-ui.css` + partial)

- Overlay y filtro grayscale unificados en cards.
- Hover más controlado (opacidad + desaturación).
- **Bug corregido**: `xmlns="http://www.w3.000/svg"` → `http://www.w3.org/2000/svg`.
- Cada card tiene `data-service-accent="…"`.
- Icon containers sin azul hardcodeado (el color lo define el accent).
- Aspect ratio mobile de cards de servicio menos extremo (3/4, max-height).
- Mask sutil en tabs horizontales mobile para indicar scroll.

### 3. Heroes / home (`index.html` + CSS)

- Atmósfera unificada.
- `hero-title` sin clases de color/tracking ad-hoc (las define el sistema).
- Opacidad de slides del hero subida vía CSS (~0.28–0.32) + filtro coherente.
- Link roto “casos de éxito → #clientes” reemplazado por “Ver servicios → servicios.html”.
- Alt/title de imágenes corregidos (ortografía).

### 4. Blog (`blog.html` + `blog-engine.js`)

- Skeleton con `aria-busy` / `aria-live`.
- Mensaje de carga más sobrio.
- Error: card con título, copy y botón **Reintentar**.
- Empty category: estado vacío claro.
- Se limpia `aria-busy` al cargar.

### 5. Páginas HTML

- `index`, `servicios`, `nosotros`, `contacto`, `metodologia`, `blog`, `post`, `404`: atmósfera unificada.
- Títulos/alts de imágenes corregidos en partials y páginas.

---

## Pendiente (no automatizable aquí)

1. **Dirección de arte fotográfica**: reemplazar assets generados por IA por fotografía real del equipo / contexto Mendoza o ilustración editorial consistente.
2. **Casos de éxito**: crear sección real o eliminar referencias residuales.
3. **Tests visuales** (Percy/Chromatic o checklist manual post-deploy).
4. **Contraste fino** de cada variante de botón sobre fondos glass (auditoría WCAG en dispositivo real).

---

## Verificación rápida

1. Home: hero legible, 3 insight cards, carousel de servicios con colores distintos por servicio.
2. Servicios: tabs con borde de color al activar; hash `#tab-crisis` sigue funcionando.
3. Blog: sin red / Sanity caído → mensaje de error + Reintentar.
4. Mobile: cards de servicio no tan altas; tabs scrolleables con hint de borde.
5. `prefers-reduced-motion: reduce` → sin float ni pulse.
