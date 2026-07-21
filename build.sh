#!/bin/bash

# ==============================================================================
# Script de Build para Producción - Luxus
#
# Este script recopila y optimiza los archivos necesarios para el despliegue
# en un directorio de distribución (por defecto: 'dist/').
#
# Uso:
#   ./build.sh
# ==============================================================================

# Detiene el script si ocurre un error
set -e

# --- Configuración ---
DIST_DIR="dist"

echo "🚀 Iniciando el proceso de build para producción..."

# 1. Limpia el directorio de distribución si ya existe
if [ -d "$DIST_DIR" ]; then
    echo "🧹 Limpiando el directorio '$DIST_DIR/'..."
    rm -rf "$DIST_DIR"
fi

# 2. Crea la estructura de directorios de producción
echo "📁 Creando la estructura de directorios en '$DIST_DIR/'..."
mkdir -p "$DIST_DIR/assets/css"
mkdir -p "$DIST_DIR/assets/js"
mkdir -p "$DIST_DIR/assets/img"
mkdir -p "$DIST_DIR/assets/partials"

# 3. Copia archivos HTML, imágenes y parciales
echo "📦 Copiando archivos del proyecto..."
cp *.html "$DIST_DIR/"
cp -R assets/img/* "$DIST_DIR/assets/img/"
cp -R assets/partials/* "$DIST_DIR/assets/partials/"

# 4. Minimiza y copia archivos CSS
echo "💅 Minimizando archivos CSS..."
for file in assets/css/*.css; do
  npx clean-css-cli "$file" -o "$DIST_DIR/assets/css/$(basename "$file")"
done

# 5. Minimiza y copia archivos JavaScript
echo "📜 Minimizando archivos JavaScript..."
for file in assets/js/*.js; do
  npx terser "$file" -o "$DIST_DIR/assets/js/$(basename "$file")" -c -m
done

# 6. Extrae e incrusta el CSS crítico para acelerar el renderizado
echo "⚡ Optimizando CSS crítico..."
for file in "$DIST_DIR"/*.html; do
  echo "   - Procesando $file"
  npx critical "$file" --base "$DIST_DIR" --inline --width 1300 --height 900 --output "$file" >/dev/null 2>&1
done


echo "✅ ¡Build finalizado con éxito! Los archivos de producción están listos en la carpeta '$DIST_DIR/'."
echo "🎉 Puedes desplegar el contenido de la carpeta '$DIST_DIR/' en tu servidor."