import type { Inputs, TankInput, WorldState } from "../../src/core/types.ts";
import { createWorld } from "../../src/core/world.ts";
import { toWorldSpec } from "../../src/levels/build.ts";
import { stageSchema } from "../../src/levels/schema.ts";

/** テスト用の小さなステージを ASCII から組み立てる。 */
export function worldFromMap(map: string[]): WorldState {
  return createWorld(toWorldSpec(stageSchema.parse({ name: "test", map })));
}

export const input = (over: Partial<TankInput> = {}): TankInput => ({
  move: { x: 0, y: 0 },
  aim: 0,
  fire: false,
  ...over,
});

export const inputsFor = (id: number, over: Partial<TankInput> = {}): Inputs =>
  new Map([[id, input(over)]]);

/**
 * done が真になるまで step を呼ぶ。
 *
 * 「弾が届くまで60 tick」のように待つ長さを直に書くと、弾速や距離を調整した
 * 瞬間にテストが落ちる。何 tick かかるかではなく、何が起きるまで待つのかを書く。
 */
export function runUntil(
  step: () => void,
  done: () => boolean,
  cap = 600,
): void {
  for (let i = 0; i < cap && !done(); i++) step();
}
