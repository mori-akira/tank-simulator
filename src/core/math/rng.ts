// 乱数はこの seeded RNG のみを使う。処理系任せの乱数は禁止（docs/architecture.md 2.）。
// 禁止は tools/check-determinism.sh が文字列一致で強制するため、ここでも禁止対象の
// 関数名は書かない。
//
// 状態は WorldState に載せる。載せないとリプレイが再現しない。

export type Rng = { state: number };

export function createRng(seed: number): Rng {
  return { state: seed >>> 0 };
}

/** [0, 1) の乱数を返し、状態を進める（mulberry32）。 */
export function nextFloat(rng: Rng): number {
  rng.state = (rng.state + 0x6d2b79f5) >>> 0;
  let t = rng.state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** [-width, +width] の一様乱数。照準誤差に使う。 */
export function nextSigned(rng: Rng, width: number): number {
  return (nextFloat(rng) * 2 - 1) * width;
}
