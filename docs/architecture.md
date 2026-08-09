# アーキテクチャ

## ディレクトリ構成

```
src/
  core/     2D純粋ロジック。DOM・Three.js に非依存
  ai/       敵戦車の思考ルーチン
  render/   Three.js による描画
  input/    入力収集
  levels/   ステージデータと zod スキーマ
  app/      ゲームループ・UI・組み立て
tests/      unit / property / sim / e2e（用途は coding-standards.md）
tools/      ヘッドレス実行と検査のCLI
```

## 1. 層の依存方向

```
core ← { ai, render, app, input }
```

- `src/core/` は `three` を import しない。DOM API（`window`, `document`, `performance`）も使わない
- `src/core/` は `src/` 配下の他の層に依存しない
- Three.js を import してよいのは `src/render/` のみ
- `src/core/` はテクスチャ・色値・音声への参照を持たない。持つのは種類の識別子と、発射・反射・破壊といった出来事だけ。どの種類をどう描き、どの出来事にどの音を当てるかの対応付けは `core` の外側が持つ

`npm run depcruise` が CI で強制する。

**理由:** `core` がブラウザ非依存であることが、ヘッドレステストによる自己検証を成立させている。ここが崩れると、AI は自分の実装を検証する手段を失う。

見た目と音を締め出すのも同じ理由による。アセットへの参照が `WorldState` に乗ると、リプレイのハッシュがアセットの差し替えだけで変わり、次節の決定論による検証が意味を失う。

## 2. 決定論

- シミュレーションは固定タイムステップで進める。描画のフレームレートに依存させない
- 乱数は `src/core/math/rng.ts` の seeded RNG のみ。`Math.random()` は禁止
- 三角関数は `src/core/math/trig.ts` 経由で使う（実装を差し替え可能にしておくため）
- `stepWorld(world, inputs)` は同じ入力列に対して常に同じ結果を返す

`npm run check:determinism` が `Math.random()` の使用を CI で強制的に弾く。

**理由:** 決定論があるから、リプレイのハッシュ比較によって「挙動を1ビットも変えずにリファクタした」ことを証明できる。AI に安心してリファクタさせられるかどうかがここに懸かっている。

## 3. ロジック2D / 描画3D

- `core` の座標は2Dの `{ x, y }`
- 3D座標への変換は `src/render/projection.ts` だけが行う（`{x, y}` → `Vector3(x, 0, y)`）
- `core` に高さ・Z軸・`Vector3` を持ち込まない

**理由:** 変換点を1ファイルに閉じ込めることで、座標系の取り違えという追跡困難なバグを構造的に防ぐ。

## 状態と更新

`WorldState` は破壊的に更新する。イミュータブルにはしない。

**理由:** 毎フレーム全エンティティが変化するため、スプレッド構文による複製はアロケーションが無駄になるうえ、フィールドの伝播漏れという LLM が起こしやすいミスを誘発する。決定論に必要なのは純粋性ではなく、固定タイムステップと seeded RNG である。

リプレイ検証は `src/core/snapshot.ts` の `cloneWorld` / `hashWorld` で行う。
