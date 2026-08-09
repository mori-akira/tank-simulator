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
- [0004](adr/0004-typescript-6-for-depcruise.md) — 層検査を空振りさせないため TypeScript を 6.x に固定する
- [0005](adr/0005-enforce-invariants-in-harness.md) — 守るべき条件は文章ではなくハーネスで強制する
- [0006](adr/0006-no-forced-review-gate.md) — コードレビューはコミット前フックで強制しない

## spec/ — 実装仕様

実装が従う具体的な値。

- [parameters.md](spec/parameters.md) — 時間・盤面・戦車・弾・敵の数値と、値が満たすべき制約
