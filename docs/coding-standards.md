# コーディング規約

前提として [CLAUDE.md](../CLAUDE.md) の YAGNI 方針が全てに優先する。以下はそれを補う具体則。

## コード

- **シミュレーションの進み方や結果を変える数値はすべて `src/core/constants.ts` に集約する。** マジックナンバーを各所に散らさない。使うのが `core` の外の層でも同じ。あわせて [spec/parameters.md](spec/parameters.md) に載せ、`tests/unit/spec-sync.test.ts` の検査対象にする
- 見た目だけを決める数値（3Dの高さ・画角・余白・色）は `src/render/` に置く。`core` は高さも色も持たない（[architecture.md](architecture.md) 1. と 3.）
- コメントは「なぜそうしたか」を書く。「何をしているか」はコードで表現する
- 1ファイルが300行を超えたら分割を検討する
- ステージデータは `src/levels/schema.ts` の zod スキーマで検証する

## テスト

| 種類 | 置き場所 | ここに置くもの |
|---|---|---|
| unit | `tests/unit/` | 関数や定数を直接確かめるもの（確かめたい挙動が起きるところまで世界を進めてよい） |
| property | `tests/property/` | fast-check で不変条件を確かめるもの（例: 反射後も速度の大きさが保存される） |
| sim | `tests/sim/` | ステージを走らせて確かめるもの。ブラウザは使わない |
| e2e | `tests/e2e/` | 実ブラウザでしか確かめられないものと、スクリーンショット取得 |
| （ヘルパ） | `tests/helpers/` | 上記から使う共有の組み立て関数。テスト自体は置かない |

**用途を列挙せず、置き場所を選べる基準として書いている。** 列挙はテストを足すたびに更新が要り、実際に漏れた。新しいテストは「何を検証するか」ではなく「**どう動かすか**」で置き場所を決める。

テストは `tests/` に集約する（`src/` に併置しない）。オーナーがコードを読まないため、ここが「何が検証されているか」を確認できる唯一の場所になる。

スクリーンショットのピクセル完全一致比較は行わない。3D描画とアンチエイリアスで不安定になるため、画像は人間と AI が目視するための成果物として扱う。

## 検証コマンド

```bash
npm run typecheck
npm run lint       # 修正は npm run lint:fix
npm run depcruise  # 層の依存方向を検査
npm run check:determinism  # Math.random() の使用を検査
npm run test       # Vitest（unit / property / sim）
npm run test:e2e   # Playwright
npm run sim        # ヘッドレスで自動プレイし結果を出力
npm run shot       # スクリーンショット生成
npm run verify     # typecheck + lint + depcruise + check:determinism + test + build
```
