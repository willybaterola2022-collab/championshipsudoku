#!/usr/bin/env bash
# Pre-push quality gate. Blocks push if any check fails.
# Install: git config core.hooksPath scripts
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "🔍 Championship Sudoku — pre-push checks"
echo ""

# Secret scan (staged diff only)
echo "[1/5] Secret scan..."
SECRET_PATTERNS='(ghp_[A-Za-z0-9]{30,}|sk-ant-api03-[A-Za-z0-9_-]{40,}|sk-proj-[A-Za-z0-9_-]{40,}|AIza[A-Za-z0-9_-]{35}|rk_live_[A-Za-z0-9]{20,}|re_[A-Za-z0-9_-]{20,})'
if git diff --cached --name-only --diff-filter=AM 2>/dev/null | grep -v '^node_modules\|^dist\|\.lock$' | xargs -I {} grep -HnE "$SECRET_PATTERNS" {} 2>/dev/null; then
  echo "❌ Secret-like string in staged files."
  exit 1
fi
echo "  ✅"
echo ""

# .env guard
echo "[2/5] .env guard..."
if git diff --cached --name-only 2>/dev/null | grep -E '(^|/)\.env(\.|$)'; then
  echo "❌ .env file staged."
  exit 1
fi
echo "  ✅"
echo ""

echo "[3/5] Tests..."
bash "$(dirname "$0")/test-runner.sh"
echo ""

echo "[4/5] EF validator..."
bash "$(dirname "$0")/ef-validator.sh"
echo ""

echo "[5/5] Large file guard..."
LARGE=$(git diff --cached --name-only --diff-filter=AM 2>/dev/null | while read f; do
  [ -f "$f" ] && size=$(stat -f%z "$f" 2>/dev/null || stat -c%s "$f" 2>/dev/null || echo 0)
  [ "$size" -gt 5242880 ] && echo "$f ($size bytes)"
done)
if [ -n "$LARGE" ]; then
  echo "❌ Files >5MB staged:"
  echo "$LARGE"
  exit 1
fi
echo "  ✅"
echo ""

echo "✅ All pre-push checks passed."
