#!/usr/bin/env bash
# Math.random() の使用を検出して落とす。理由は docs/architecture.md「2. 決定論」。
# 検査対象は *.ts のみなので、このファイル自身は対象に含まれない。
set -uo pipefail

cd "$(dirname "$0")/.."

if hits=$(grep -rn --include='*.ts' 'Math\.random' src tests tools); then
  printf '決定論違反: Math.random() は使用禁止。src/core/math/rng.ts の seeded RNG を使うこと。\n\n%s\n' "$hits" >&2
  exit 1
fi
