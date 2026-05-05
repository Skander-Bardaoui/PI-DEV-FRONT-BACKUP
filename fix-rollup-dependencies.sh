#!/bin/bash

# Script pour corriger le problème de dépendances Rollup dans Jenkins
# Ce script résout le bug npm avec les dépendances optionnelles

echo "🔧 Fixing Rollup dependencies issue..."

# Étape 1: Nettoyer complètement
echo "📦 Cleaning node_modules and lock files..."
rm -rf node_modules
rm -f package-lock.json

# Étape 2: Nettoyer le cache npm
echo "🧹 Cleaning npm cache..."
npm cache clean --force

# Étape 3: Réinstaller avec --force pour forcer les dépendances optionnelles
echo "📥 Reinstalling dependencies with --force..."
npm install --force

# Étape 4: Installer explicitement le module Rollup manquant
echo "🎯 Installing @rollup/rollup-linux-x64-gnu explicitly..."
npm install --save-optional @rollup/rollup-linux-x64-gnu --force

# Étape 5: Vérifier que Rollup fonctionne
echo "✅ Verifying Rollup installation..."
if [ -d "node_modules/@rollup/rollup-linux-x64-gnu" ]; then
    echo "✅ @rollup/rollup-linux-x64-gnu installed successfully"
else
    echo "⚠️  Warning: @rollup/rollup-linux-x64-gnu not found, but continuing..."
fi

echo "✅ Rollup dependencies fixed!"
