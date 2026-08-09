import { createRng } from "./math/rng";
import type { TankKind, WorldState } from "./types";

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

export function isWall(world: WorldState, col: number, row: number): boolean {
  if (col < 0 || row < 0 || col >= world.cols || row >= world.rows) return true;
  return world.walls[row * world.cols + col] === true;
}
