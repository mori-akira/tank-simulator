import { CELL_SIZE } from "../constants.ts";
import type { Vec2, WorldState } from "../types.ts";
import { overlapsWall } from "./collision.ts";

// 線分を等間隔にサンプルする。壁の最小の厚みは CELL_SIZE なので、
// その 1/4 刻みなら壁を跨いで見落とすことはない。
const STEP = CELL_SIZE / 4;

/** from から to まで、半径 radius の円が壁に触れずに通れるか。 */
export function hasLineOfSight(
  world: WorldState,
  from: Vec2,
  to: Vec2,
  radius: number,
): boolean {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / STEP));

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    if (
      overlapsWall(world, { x: from.x + dx * t, y: from.y + dy * t }, radius)
    ) {
      return false;
    }
  }
  return true;
}
