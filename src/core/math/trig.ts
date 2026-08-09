// 三角関数の入口を1か所に閉じる（docs/architecture.md 2.）。
// IEEE 754 が結果を一意に定めていないのは超越関数だけであり、決定論が処理系に
// 左右されうるのもここだけ。差し替えが必要になったとき、呼び出し側を触らずに済ませる。

export const sin = Math.sin;
export const cos = Math.cos;
export const atan2 = Math.atan2;

export const TAU = Math.PI * 2;

/** 角度を [-π, π) に畳む。旋回を足し込み続けると値が際限なく増え、精度が落ちる。 */
export function normalizeAngle(a: number): number {
  const r = (a + Math.PI) % TAU;
  return (r < 0 ? r + TAU : r) - Math.PI;
}
