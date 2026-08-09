import { createRng } from "./math/rng";
import { moveTank } from "./tank";
import type { Inputs, TankKind, WorldState } from "./types";

/** ステージから組み立てた、World を作るのに必要な素データ。 */
export type WorldSpec = {
  cols: number;
  rows: number;
  walls: boolean[];
  spawns: { kind: TankKind; x: number; y: number }[];
};

export function createWorld(spec: WorldSpec, seed: number): WorldState {
  return {
    tick: 0,
    rng: createRng(seed),
    cols: spec.cols,
    rows: spec.rows,
    walls: spec.walls,
    tanks: spec.spawns.map((s, i) => ({
      id: i,
      kind: s.kind,
      pos: { x: s.x, y: s.y },
      hull: 0,
      turret: 0,
      alive: true,
      cooldown: 0,
    })),
    bullets: [],
    nextBulletId: 0,
    outcome: "playing",
  };
}

/**
 * 世界を1ステップ進める。固定タイムステップであり、描画のフレームレートに依存しない
 * （docs/architecture.md 2.）。WorldState は破壊的に更新する。
 */
export function stepWorld(world: WorldState, inputs: Inputs): void {
  for (const tank of world.tanks) {
    if (!tank.alive) continue;
    const input = inputs.get(tank.id);
    if (input) moveTank(world, tank, input);
  }
  world.tick += 1;
}
