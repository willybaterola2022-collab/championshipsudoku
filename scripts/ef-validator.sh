#!/usr/bin/env bash
# Validates Edge Function hygiene: CORS import, OPTIONS handling, no secrets hardcoded, no console.log.
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

EF_DIR="supabase/functions"
FAILED=0

if [ ! -d "$EF_DIR" ]; then
  echo "⚠️  No $EF_DIR directory, skipping EF validation"
  exit 0
fi

echo "🛡️  Edge Function validator"
echo ""

for fn_dir in "$EF_DIR"/*/; do
  fn_name=$(basename "$fn_dir")
  # Skip shared
  if [ "$fn_name" = "_shared" ]; then continue; fi
  index="$fn_dir/index.ts"
  if [ ! -f "$index" ]; then continue; fi

  echo "  Checking $fn_name..."

  # 1. Must import cors from _shared
  if ! grep -q "_shared/cors" "$index"; then
    echo "    ❌ Does not import from _shared/cors"
    FAILED=1
  fi

  # 2. Must handle OPTIONS
  if ! grep -q "OPTIONS" "$index"; then
    echo "    ❌ Does not handle OPTIONS method"
    FAILED=1
  fi

  # 3. No hardcoded secrets
  if grep -qE "(sk-ant-|sk-proj-|AIza[0-9A-Za-z_-]{35})" "$index"; then
    echo "    ❌ Looks like a hardcoded API key"
    FAILED=1
  fi

  # 4. No console.log (only console.error allowed for true errors)
  if grep -qn "console\.log" "$index"; then
    echo "    ❌ Contains console.log"
    FAILED=1
  fi
done

if [ "$FAILED" -eq 1 ]; then
  echo ""
  echo "❌ ef-validator: failures found. Fix before pushing."
  exit 1
fi

echo ""
echo "✅ ef-validator: all edge functions pass"
