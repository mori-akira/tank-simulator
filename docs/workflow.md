# 開発ワークフロー

## タスク管理

タスクは GitHub Issues で管理する。**Issues が唯一の情報源**であり、進捗を `docs/` 配下のファイルで二重管理しない。

### Issue の書き方

AI駆動開発では、Issue はそのまま AI への作業指示書になる。**完了条件を必ず書く。** ここが曖昧だと AI は「できたつもり」で終わる。

```markdown
## 背景
なぜこれが必要か。

## やること
何を作るか。

## 完了条件
- [ ] 検証可能な条件を列挙する
- [ ] 「npm run verify が通る」など、AI が自分で判定できる形にする
```

### Issue の作成者

AI は自発的に Issue を作成しない。作業中に別の課題を見つけても勝手に対応せず、**オーナーへの提案に留める**。スコープの拡大を防ぐため。

ただしオーナーから指示があった場合は、指示された条件に従って AI が Issue を作成してよい。

### ラベル

最小限に留める。`feat` / `fix` / `docs` / `chore` の4つから始め、足りなくなったら足す。

## ブランチ

原則 `main` のみ。個人開発であり、レビュー待ちが発生しないため。

分岐して並行開発が必要な場合のみ `feature/<Issue番号>-<短い説明>` を作成し、完了後 `main` にマージして削除する。

### main 直コミットの前提条件

ブランチ保護の代わりに、**コミット前に `npm run verify` が通っていること**を必須とする。

これは指示ではなく仕組みで強制する。`.claude/settings.json` の PreToolUse フックが `git commit` の前に `verify` を実行し、失敗したらコミットを中止する（`.claude/hooks/verify-before-commit.sh`）。指示だけでは、忘れたときに壊れたコードが `main` に入り、push 後の CI で初めて発覚する。

`CLAUDE.md` や `docs/` を変更した場合は、あわせて `/doc-check` スキルでドキュメントの整合性を検査する。検出された不整合をどう扱うかはオーナーが判断する。

push 後は GitHub Actions が同じ検証を実行する。失敗したら他の作業より優先して修正する。

`main` への push では、**`verify` が通ったあとに** GitHub Pages へ公開される（`.github/workflows/verify.yml` の `deploy` ジョブ）。壊れたものが `main` から出ていかないよう、公開は検証の後段に置く。PR では公開しない。

### コードレビュー

`/review` スキルで、**実装セッションの文脈を持たないサブエージェント**に差分をレビューさせる。指摘ごとに「要対応 / 任意」を判定する。

実装した本人が自分の差分を読んでも、同じ思い込みを二度通すだけになる。コールドスタートの別セッションに読ませることだけが、それを避ける手段になる。

`verify` と違い、これは**強制しない**。理由は [ADR 0006](adr/0006-no-forced-review-gate.md)。

## コミットメッセージ

```
#12 弾の壁反射を実装

反射角の計算を core/physics/ricochet.ts に追加した。
壁の法線ベクトルによる鏡面反射で、速度の大きさは保存する。

Closes #12

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

- **1行目**: `#<Issue番号> <要約>`。Issue 番号だけにしない（`git log --oneline` が読めなくなるため）
- **2行目**: 空行
- **3行目以降**: 何をどう変えたかの概要。「なぜ」が自明でないなら理由も書く
- **`Closes`**: Issue を完了させるコミットにのみ `Closes #<Issue番号>` を書く。`main` への push で Issue が自動クローズされる
- **末尾**: `Co-Authored-By: Claude <モデル名> <noreply@anthropic.com>` を**すべてのコミットに付ける**

1つの Issue に複数コミットする場合、`Closes` は最後のコミットにだけ付ける。

### モデル名を書く理由

実装はすべて LLM が行う。**挙動の傾向はモデルによって違う。** どの時期の実装がどのモデルによるものか分からないと、過去の判断が「そのモデルの癖」なのか「意図した設計」なのかを後から切り分けられない。

`Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` のように、世代まで含めた名前を書く。

[Issue #19](https://github.com/mori-akira/tank-simulator/issues/19) 以前のコミットには付いていないものがある。当時のモデルの記録が残っておらず、遡って正確に書けないため、過去は書き換えていない。

## ADR との使い分け

- **Issue** — やること。完了したら閉じる
- **ADR**（`docs/adr/`） — なぜそう決めたか。永続する

「Three.js を採用する」は ADR、「Three.js のセットアップをする」は Issue。

## 権限設定

`.claude/settings.json` の `permissions` で、**ローカルで完結する操作は無確認、リモートに影響する操作は確認**とする。`git push`、`gh` の書き込み系、`npm publish` は `ask` に置く。

`ask` は `allow` より優先される。そのため `Bash(gh:*)` のように広く許可したうえで、書き込み系のサブコマンドだけを `ask` で引き戻している。`allow` 側を細かく列挙するより漏れが少ない。

ファイルの編集も同じ方針で扱う。リポジトリ内と scratchpad を `allow` に置き、`.git/` だけを `deny` にする。`.git/config` を書き換えれば remote を差し替えられるため、リモートに影響する操作は確認するという上の方針と揃えている。

ただし `git -C <path> push` のような書き方は `Bash(git push:*)` にマッチせず素通りする。**うっかりを防ぐ仕組みであり、機構的な保証ではない。**

## 前提ツール

Issue の参照・操作には GitHub CLI (`gh`) を使う。

```bash
gh issue list
gh issue view <番号>
```
