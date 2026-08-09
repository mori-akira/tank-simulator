import type { WorldState } from "./types.ts";

/** 盤面の外は壁として扱う。衝突判定は戦車の周囲セルを走査するため、外側を引きうる。 */
export function isWall(world: WorldState, col: number, row: number): boolean {
  if (col < 0 || row < 0 || col >= world.cols || row >= world.rows) return true;
  return world.walls[row * world.cols + col] === true;
}
