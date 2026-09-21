#!/bin/bash

# ==============================================================================
# Script de Build para Producción - Luxus
# ==============================================================================

set -e

DIST_DIR="dist"

for required in \
  assets/css/ux-legibility.css \
  assets/css/service-ui.css \
  assets/js/ux-behavior.js \
  assets/js/service-carousel.js
do
  if [ ! -f "$required" ]; then
    echo "❌ Falta $required"
    exit 1
  fi
done

echo "🚀 Iniciando el proceso de build para producción..."

if [ -d "$DIST_DIR" ]; then
    echo "🧹 Limpiando el directorio '$DIST_DIR/'..."
    rm -rf "$DIST_DIR"
fi

mkdir -p "$DIST_DIR/assets/css"
mkdir -p "$DIST_DIR/assets/js"
mkdir -p "$DIST_DIR/assets/img"
mkdir -p "$DIST_DIR/assets/partials"

echo "📦 Copiando archivos del proyecto..."
cp *.html "$DIST_DIR/"
cp robots.txt "$DIST_DIR/" 2>/dev/null || true
cp sitemap.xml "$DIST_DIR/" 2>/dev/null || true
cp -R assets/img/* "$DIST_DIR/assets/img/"
cp -R assets/partials/* "$DIST_DIR/assets/partials/"

node compile-fragments.js

echo "💅 Minimizando archivos CSS..."
for file in assets/css/*.css; do
  cleancss "$file" -o "$DIST_DIR/assets/css/$(basename "$file")"
done

# Bundle visual-language and service UI into the single stylesheet every page links.
cat "$DIST_DIR/assets/css/ux-legibility.css" >> "$DIST_DIR/assets/css/main.css"
cat "$DIST_DIR/assets/css/service-ui.css" >> "$DIST_DIR/assets/css/main.css"

echo "📜 Minimizando archivos JavaScript..."
for file in assets/js/*.js; do
  terser "$file" -o "$DIST_DIR/assets/js/$(basename "$file")" -c -m
done

# Runtime enhancements: a11y behavior + service carousel (idempotent inject).
for file in "$DIST_DIR"/*.html; do
  if ! grep -q 'assets/js/ux-behavior.js' "$file"; then
    sed -i 's#</body>#<script src="assets/js/ux-behavior.js" defer></script>\n</body>#' "$file"
  fi
  if ! grep -q 'assets/js/service-carousel.js' "$file"; then
    sed -i 's#</body>#<script src="assets/js/service-carousel.js" defer></script>\n</body>#' "$file"
  fi
done

echo "⚡ Optimizando CSS crítico..."
for file in "$DIST_DIR"/*.html; do
  echo "   - Procesando $file"
  critical_output="${file}.critical"
  if critical "$file" --base "$DIST_DIR" --inline --width 1300 --height 900 --output "$critical_output" >/dev/null 2>&1; then
    mv "$critical_output" "$file"
  else
    rm -f "$critical_output"
    echo "   ⚠️ Critical no pudo procesar $(basename "$file"); se conserva el HTML generado."
  fi
done

if [ -f "scripts/normalize-build-html.js" ]; then
  node scripts/normalize-build-html.js
fi

echo "✅ ¡Build finalizado con éxito! Los archivos de producción están listos en la carpeta '$DIST_DIR/'."
echo "🎉 Puedes desplegar el contenido de la carpeta '$DIST_DIR/' en tu servidor."
