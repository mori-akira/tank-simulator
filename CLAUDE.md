# CLAUDE.md

## 前提

本プロジェクトは AI駆動開発の実践であり、オーナーはコードを書かず、ほとんど読まない。
**「動くはずです」は成果物として無価値。** 実装したら必ず自分で検証し、結果を示すこと。

## YAGNI を徹底する

**必要最小限を書く。** 冗長なコード・冗長なドキュメントは、それ自体が欠陥とみなす。

- いま必要でないものを作らない。「将来のため」の抽象化・オプション・設定項目・インターフェースは書かない
- 型で保証されている条件を実行時に再チェックしない。起こり得ないケースへの防御的分岐を書かない
- 握りつぶす `try/catch` を書かない。想定外は落ちてよい
- 頼まれていない機能を足さない。スコープを勝手に広げない
- ドキュメントも同じ。書かなくても分かることは書かない

迷ったら、少ない方を選ぶ。足りなければ後で足せる。

## 変更禁止の土台

以下はオーナーの確認なしに変えてはならない。詳細と理由は [docs/architecture.md](docs/architecture.md)。

1. **層の依存方向** — `core` は `three` も DOM も import しない。依存は `core ← { ai, render, app, input }` の一方向のみ
2. **決定論** — 固定タイムステップ。乱数は seeded RNG のみ（`Math.random()` 禁止）
3. **ロジック2D / 描画3D** — 3D座標への変換は `render/projection.ts` だけが行う

## 検証

```bash
npm run verify    # typecheck + lint + 層検査 + テスト + ビルド
npm run shot      # スクリーンショット生成
```

描画に関わる変更をしたら、`npm run shot` の画像を Read して自分の目で確認すること。3D の破綻はテストでは捕まらない。

## 進め方

1. 実装前に [docs/spec/](docs/spec/) の該当箇所を読む。仕様にないことを勝手に決めない
2. 仕様が曖昧ならオーナーに確認し、合意を `docs/spec/` に反映してから実装する
3. 実装し、検証する
4. 仕様・構成を変えたなら、**同じ変更内で** `docs/` を更新し、`/doc-check` で整合性を検査する

設計判断は [docs/adr/](docs/adr/) に残す。理由が失われると、後のセッションで判断が無自覚に覆る。

タスクは GitHub Issues で管理する。`main` に直接コミットするため、**コミット前に `npm run verify` を通すこと。**
コミットメッセージは1行目を `#<Issue番号> <要約>` とする（詳細は [docs/workflow.md](docs/workflow.md)）。

## 参照

- [docs/architecture.md](docs/architecture.md) — 層構成・座標系・決定論の詳細
- [docs/coding-standards.md](docs/coding-standards.md) — コーディング規約・テストの使い分け
- [docs/workflow.md](docs/workflow.md) — タスク管理・ブランチ・コミット規約
- [docs/roadmap.md](docs/roadmap.md) — 現在のマイルストーン

## 現在の状況

セットアップ段階。ビルド設定とソースコードは未整備で、上記コマンドはまだ動かない。
