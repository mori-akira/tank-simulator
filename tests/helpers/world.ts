import type { Inputs, TankInput, WorldState } from "../../src/core/types.ts";
import { createWorld } from "../../src/core/world.ts";
import { toWorldSpec } from "../../src/levels/build.ts";
import { stageSchema } from "../../src/levels/schema.ts";

/** テスト用の小さなステージを ASCII から組み立てる。 */
export function worldFromMap(map: string[], seed = 1): WorldState {
  return createWorld(
    toWorldSpec(stageSchema.parse({ name: "test", map })),
    seed,
  );
}

export const input = (over: Partial<TankInput> = {}): TankInput => ({
  move: { x: 0, y: 0 },
  aim: 0,
  fire: false,
  ...over,
});

export const inputsFor = (id: number, over: Partial<TankInput> = {}): Inputs =>
  new Map([[id, input(over)]]);
