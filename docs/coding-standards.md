# コーディング規約

前提として [CLAUDE.md](../CLAUDE.md) の YAGNI 方針が全てに優先する。以下はそれを補う具体則。

## コード

- ゲームバランスに関わる数値はすべて `src/core/constants.ts` に集約する。マジックナンバーを各所に散らさない
- コメントは「なぜそうしたか」を書く。「何をしているか」はコードで表現する
- 1ファイルが300行を超えたら分割を検討する
- ステージデータは `src/levels/schema.ts` の zod スキーマで検証する

## テスト

| 種類 | 置き場所 | 用途 |
|---|---|---|
| unit | `tests/unit/` | 関数単位の入出力 |
| property | `tests/property/` | fast-check による不変条件（例: 反射後も速度の大きさが保存される） |
| sim | `tests/sim/` | 決定論の検証、リプレイのハッシュ比較、自動プレイの通し確認 |
| e2e | `tests/e2e/` | 起動確認とスクリーンショット取得 |

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
