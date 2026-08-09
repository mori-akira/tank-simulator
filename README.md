# tank-simulator

ブラウザ上で動作する戦車シミュレータゲーム。「はじめてのWiiパック」の「タンク」をモチーフにした、見下ろし型の対戦車アクション。

## このプロジェクトについて

本リポジトリは、**AI駆動開発の実践**を目的としています。オーナーは一切プログラミングを行わず、要件定義・仕様策定・レビュー・意思決定のみを担当し、実装はすべて LLM が行います。

そのため、通常のプロジェクトとは異なる設計判断をいくつか採用しています。

- **ゲームロジックを描画から完全に分離** — ブラウザなしで数千フレーム実行でき、AI が自分の実装をテストで検証できる
- **決定論的シミュレーション** — 固定タイムステップと seeded RNG により、同じ入力から必ず同じ結果が出る。リプレイをテスト資産にできる
- **ドキュメントがコードより上位** — 仕様と設計判断は `docs/`、タスクと進捗は Issues。セッションを跨いでも文脈が復元できる

## 技術スタック

| 領域 | 採用 |
|---|---|
| 言語 / ビルド | TypeScript + Vite |
| 描画 | Three.js（3D描画。ゲームロジックは2D） |
| 物理 | 自作（[ADR 0002](docs/adr/0002-custom-physics.md)） |
| UI / HUD | 素の DOM（React・Vue は不使用） |
| ユニットテスト | Vitest |
| Property-Based Test | fast-check |
| E2E / 画面確認 | Playwright |
| データ検証 | zod |
| Lint / Format | Biome |
| 層の境界検査 | dependency-cruiser |

外部ゲームエンジン（Unity / Godot 等）は採用していません。理由は [docs/adr/](docs/adr/) を参照してください。

## ディレクトリ構成

`src/` をレイヤーで分割し、ゲームロジックを担う `core/` を他のどの層にも依存させない構成をとっています。`core` がブラウザにも Three.js にも依存しないことが、ヘッドレステストによる自己検証を成立させています。

構成の詳細と設計理由は [docs/architecture.md](docs/architecture.md) を参照してください。

## 開発

Node.js のバージョンは `.nvmrc` に固定してある。

```bash
nvm use            # .nvmrc のバージョンに合わせる
npm install
npm run dev        # 開発サーバ起動
npm run verify     # 全検査をまとめて実行
npm run test       # テストのみ
npm run test:e2e   # Playwright（スクリーンショット取得を含む）
npm run sim        # ヘッドレスで自動プレイし結果を出力
```

## 現在の状況

**M1 実装中。** ブラウザで1ステージを操作でき、勝敗が確定するところまで動きます。残機・スコア・ステージ進行は未実装です。

進行中のマイルストーンは [docs/roadmap.md](docs/roadmap.md) から辿れます。

## ライセンス

[MIT](LICENSE)
