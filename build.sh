#!/bin/bash

# ==============================================================================
# Script de Build para Producción - Luxus
# ==============================================================================

set -e

DIST_DIR="dist"

if [ ! -f "assets/css/ux-legibility.css" ]; then
  echo "❌ Falta assets/css/ux-legibility.css"
  exit 1
fi

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

# UX/UI legibility refinements are bundled into the stylesheet already linked by every page.
cat "$DIST_DIR/assets/css/ux-legibility.css" >> "$DIST_DIR/assets/css/main.css"

echo "📜 Minimizando archivos JavaScript..."
for file in assets/js/*.js; do
  terser "$file" -o "$DIST_DIR/assets/js/$(basename "$file")" -c -m
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

echo "✅ ¡Build finalizado con éxito! Los archivos de producción están listos en la carpeta '$DIST_DIR/'."
echo "🎉 Puedes desplegar el contenido de la carpeta '$DIST_DIR/' en tu servidor."