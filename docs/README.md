# docs

## 何を作るか

- [requirements.md](requirements.md) — ゲーム要件。コア体験・操作・ルール・ステージ・弾・敵の設計・スコア・音
- [roadmap.md](roadmap.md) — 現在のマイルストーン。スコープと完了条件は GitHub Milestone 側にある

## どう作るか

- [architecture.md](architecture.md) — 層構成・座標系・決定論
- [coding-standards.md](coding-standards.md) — コーディング規約・テストの使い分け
- [workflow.md](workflow.md) — タスク管理・ブランチ・コミット規約

## adr/ — 設計判断の記録

なぜそう決めたか。覆すときは新しい ADR で置き換える。

- [0001](adr/0001-threejs-instead-of-game-engine.md) — 外部ゲームエンジンを採用せず Three.js を使う（ロジック2D / 描画3D を含む）
- [0002](adr/0002-custom-physics.md) — 物理エンジンを使わず自作する
- [0003](adr/0003-no-reactive-framework.md) — リアクティブフレームワークを採用しない

## spec/ — 実装仕様

物理の数値など、実装が従う具体的な値。**未作成。** M1 実装タスクの最初の工程で作成する。
