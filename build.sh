#!/bin/bash

# ==============================================================================
# Script de Build para Producción - Luxus
#
# Este script recopila y optimiza los archivos necesarios para el despliegue
# en un directorio de distribución (por defecto: 'dist/').
# ==============================================================================

set -e

DIST_DIR="dist"

echo "🚀 Iniciando el proceso de build para producción..."

if [ -d "$DIST_DIR" ]; then
    echo "🧹 Limpiando el directorio '$DIST_DIR/'..."
    rm -rf "$DIST_DIR"
fi

mkdir -p "$DIST_DIR/assets/css"
mkdir -p "$DIST_DIR/assets/js"
mkdir -p "$DIST_DIR/assets/img"
mkdir -p "$DIST_DIR/assets/partials"

# Copia archivos HTML, imágenes, parciales y archivos de SEO.
cp *.html "$DIST_DIR/"
cp robots.txt "$DIST_DIR/" 2>/dev/null || true
cp sitemap.xml "$DIST_DIR/" 2>/dev/null || true
cp -R assets/img/* "$DIST_DIR/assets/img/"
cp -R assets/partials/* "$DIST_DIR/assets/partials/"

# Pre-renderiza los fragmentos HTML en el directorio de distribución.
node compile-fragments.js

# Minimiza y copia archivos CSS.
echo "💅 Minimizando archivos CSS..."
for file in assets/css/*.css; do
  cleancss "$file" -o "$DIST_DIR/assets/css/$(basename "$file")"
done

# Minimiza y copia archivos JavaScript.
echo "📜 Minimizando archivos JavaScript..."
for file in assets/js/*.js; do
  terser "$file" -o "$DIST_DIR/assets/js/$(basename "$file")" -c -m
done

# Extrae e incrusta el CSS crítico para acelerar el renderizado.
# La optimización es best-effort: un fallo de critical no debe invalidar
# una build estática que ya puede ser servida correctamente.
echo "⚡ Optimizando CSS crítico..."
for file in "$DIST_DIR"/*.html; do
  echo "   - Procesando $file"
  if ! critical "$file" --base "$DIST_DIR" --inline --width 1300 --height 900 --output "$file" >/dev/null 2>&1; then
    echo "   ⚠️ Critical CSS no pudo procesar $file; se conserva el HTML original."
  fi
done

# Unifica la estrategia de carga CSS y elimina placeholders heredados.
node scripts/normalize-build-html.js

echo "🔎 Validando HTML generado..."
if [ -f "scripts/validate-build.js" ]; then
  node scripts/validate-build.js
fi

echo "✅ ¡Build finalizado con éxito! Los archivos de producción están listos en la carpeta '$DIST_DIR/'."
