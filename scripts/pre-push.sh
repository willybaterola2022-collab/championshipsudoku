#!/usr/bin/env bash
# Pre-push quality gate. Blocks push if any check fails.
# Install: git config core.hooksPath scripts (or copy to .git/hooks/pre-push)
set -e

echo "🔍 Championship Sudoku — pre-push checks"
echo ""

bash "$(dirname "$0")/test-runner.sh"
bash "$(dirname "$0")/ef-validator.sh"

echo ""
echo "✅ All pre-push checks passed. Pushing..."
