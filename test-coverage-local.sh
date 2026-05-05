#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# 🧪 LOCAL COVERAGE TEST SCRIPT
# ═══════════════════════════════════════════════════════════════════════════
# This script tests coverage generation locally before pushing to Jenkins
# ═══════════════════════════════════════════════════════════════════════════

set -e

echo "═══════════════════════════════════════════════════════════════════════════"
echo "🧪 TESTING COVERAGE GENERATION LOCALLY"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

# Clean previous coverage
echo "🧹 Cleaning previous coverage..."
rm -rf coverage/
echo "✓ Coverage directory cleaned"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --prefer-offline
echo "✓ Dependencies installed"
echo ""

# Run tests with coverage
echo "🧪 Running tests with coverage..."
npm run test:coverage
echo "✓ Tests completed"
echo ""

# Check coverage files
echo "📊 Checking coverage files..."
echo ""

if [ -f coverage/lcov.info ]; then
    LINES=$(wc -l < coverage/lcov.info)
    echo "✓ lcov.info generated ($LINES lines)"
else
    echo "✗ lcov.info NOT FOUND"
    exit 1
fi

if [ -f coverage/coverage-summary.json ]; then
    echo "✓ coverage-summary.json generated"
else
    echo "✗ coverage-summary.json NOT FOUND"
    exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "📊 COVERAGE SUMMARY"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

node -pe "
const data = JSON.parse(require('fs').readFileSync('coverage/coverage-summary.json'));
const total = data.total;
console.log('Lines:      ' + total.lines.pct.toFixed(2) + '%  (' + total.lines.covered + '/' + total.lines.total + ')');
console.log('Statements: ' + total.statements.pct.toFixed(2) + '%  (' + total.statements.covered + '/' + total.statements.total + ')');
console.log('Functions:  ' + total.functions.pct.toFixed(2) + '%  (' + total.functions.covered + '/' + total.functions.total + ')');
console.log('Branches:   ' + total.branches.pct.toFixed(2) + '%  (' + total.branches.covered + '/' + total.branches.total + ')');
"

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "📁 COVERAGE FILES"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
ls -lh coverage/

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "📄 LCOV.INFO SAMPLE (first 30 lines)"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
head -30 coverage/lcov.info

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "✅ COVERAGE GENERATION SUCCESSFUL"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
echo "You can now:"
echo "  1. View HTML report: open coverage/index.html"
echo "  2. Push to Jenkins - coverage will be sent to SonarQube"
echo ""
