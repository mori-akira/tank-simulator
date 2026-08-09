import { DT, MAX_FRAME } from "../core/constants.ts";

// 描画のフレームレートとシミュレーションの固定タイムステップを分離する
// （docs/architecture.md 2.）。フレーム間の経過時間を溜め、DT ぶん溜まるたびに
// 1ステップ進める。何 fps で描いてもステップの中身は変わらない。

export type Loop = { accumulator: number };

export const createLoop = (): Loop => ({ accumulator: 0 });

export function advance(
  loop: Loop,
  frameSeconds: number,
  step: () => void,
): void {
  // タブが裏に回ると経過時間が数十秒になる。そのまま消化すると数千ステップを
  // 1フレームで走らせて固まるため、遅れは切り捨てる
  loop.accumulator += Math.min(frameSeconds, MAX_FRAME);
  while (loop.accumulator >= DT) {
    loop.accumulator -= DT;
    step();
  }
}
