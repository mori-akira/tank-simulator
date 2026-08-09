#!/usr/bin/env bash
# Math.random() の使用を検出して落とす。理由は docs/architecture.md「2. 決定論」。
# 検査対象は *.ts のみなので、このファイル自身は対象に含まれない。
set -uo pipefail

cd "$(dirname "$0")/.."

# grep の終了コードは3値（0=マッチ, 1=なし, 2以上=エラー）。2値として扱うと、
# 検査対象のパスが消えたときに「違反なし」として素通りする。
hits=$(grep -rn --include='*.ts' 'Math\.random' src tests tools)
status=$?

if [ "$status" -eq 0 ]; then
  printf '決定論違反: Math.random() は使用禁止。src/core/math/rng.ts の seeded RNG を使うこと。\n\n%s\n' "$hits" >&2
  exit 1
fi

if [ "$status" -ne 1 ]; then
  printf '決定論検査を実行できなかった（grep exit %s）。検査対象のパスを確認すること。\n' "$status" >&2
  exit 1
fi
