#!/bin/bash

# === Script de Despliegue para Luxus Consultores ===
# Este script orquesta el proceso de build para producción.

# Detener la ejecución si ocurre un error en cualquier comando
set -e

# Garantizar que el script se ejecute desde la raíz del proyecto
cd "$(dirname "$0")"

echo "🚀 Iniciando proceso de build para Producción en $(pwd)..."

# Verificación de requisitos
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm no está instalado. Abortando."
    exit 1
fi
 
# 1. Instalar dependencias de forma limpia y eficiente.
# 'npm ci' es más rápido y fiable para entornos de CI/CD que 'npm install'.
echo "📦 Instalando dependencias de forma limpia con 'npm ci'..."
npm ci
 
# 2. Ejecutar el build de producción.
echo "🛠️  Ejecutando build de producción..."
npm run build

echo "✅ ¡Construcción completada!"
echo "📁 Los archivos listos para producción se encuentran en la carpeta /dist"