#!/usr/bin/env bash
# Runs typecheck, build, and basic hygiene checks.
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "📐 TypeScript check..."
npm run typecheck

echo ""
echo "🔨 Build..."
npm run build

echo ""
echo "🧹 Hygiene: no console.log in src/..."
if grep -rn "console\.log" src/ --include="*.ts" --include="*.tsx" 2>/dev/null; then
  echo "❌ Found console.log in src/. Remove before pushing."
  exit 1
fi

echo ""
echo "🧹 Hygiene: no hardcoded Supabase URLs in src/..."
if grep -rn "supabase\.co" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "VITE_SUPABASE_URL"; then
  echo "❌ Found hardcoded supabase URL. Use import.meta.env.VITE_SUPABASE_URL."
  exit 1
fi

echo ""
echo "✅ test-runner: all checks passed"
