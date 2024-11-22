#!/usr/bin/env bash
# Exit on error
set -e

# Build backend
cd backend
npm install
# Crear directorio public si no existe
mkdir -p public

# Build frontend
cd ../frontend
npm install
npm run build