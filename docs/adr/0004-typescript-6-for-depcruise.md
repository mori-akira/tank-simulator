# 0004. TypeScript を 6.x に固定する

## 背景

TypeScript の最新は 7.x（Go 実装への移植）だが、dependency-cruiser は `typescript@>=2.0.0 <7.0.0` にしか対応していない。

7.x を入れた状態で `npm run depcruise` を実行すると、**エラーにならず「0 modules cruised」で成功する。** 層の依存方向の検査（[architecture.md](../architecture.md) 1.）が、成功したように見えたまま何も検査していない状態になる。

## 決定

dependency-cruiser が TypeScript 7 に対応するまで、`typescript` を 6.x に固定する。

## 理由

`core` がブラウザにも Three.js にも依存しないことは、この構成の土台であり、AI が自分の実装を検証できる根拠でもある。それを守る唯一の自動検査が空振りするくらいなら、コンパイラのバージョンが1つ古いほうがはるかに安い。

沈黙して通ることが問題の本質である。壊れれば気づくが、これは気づけない。

## 引き上げる条件

dependency-cruiser が TypeScript 7 に対応したら 7.x に上げる。その際は、`src/core/` に `three` の import を一時的に置いて `npm run depcruise` が**失敗すること**を確認してから上げる。cruised モジュール数が 0 でないことも見る。
