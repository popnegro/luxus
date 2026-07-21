#!/bin/bash

# ==============================================================================
# Script de Desarrollo con Recarga Automática - Luxus
#
# Este script facilita el desarrollo local al:
# 1. Ejecutar un build inicial.
# 2. Iniciar un servidor local (`live-server`) para la carpeta `dist/`.
# 3. Observar cambios en `assets/` y `*.html` con `nodemon` para
#    reconstruir el proyecto automáticamente.
#
# Uso:
#   ./dev.sh
#
# Requisitos:
#   - Node.js y npm instalados.
#   - `nodemon` y `live-server` instalados globalmente (`npm install -g nodemon live-server`).
# ==============================================================================

# Detiene los procesos en segundo plano cuando el script se cierra
trap "kill 0" EXIT

# 1. Ejecuta el build inicial
./build.sh

# 2. Inicia el observador de archivos y el servidor en paralelo
nodemon --watch assets --watch "*.html" --ext "js,css,html" --exec "./build.sh" & live-server dist/