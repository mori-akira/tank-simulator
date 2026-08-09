import { CELL_SIZE } from "../constants.ts";
import { isWall } from "../grid.ts";
import type { Vec2, WorldState } from "../types.ts";
import { overlapsWall } from "./collision.ts";

const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;

/** 点と線分の距離の2乗。 */
function pointSegD2(p: Vec2, a: Vec2, b: Vec2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  const t =
    len2 === 0 ? 0 : clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / len2, 0, 1);
  const ox = a.x + dx * t - p.x;
  const oy = a.y + dy * t - p.y;
  return ox * ox + oy * oy;
}

/** 線分がセルを貫くか（スラブ法）。 */
function crossesCell(
  a: Vec2,
  b: Vec2,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): boolean {
  let tmin = 0;
  let tmax = 1;
  for (const [p, d, lo, hi] of [
    [a.x, b.x - a.x, x0, x1],
    [a.y, b.y - a.y, y0, y1],
  ] as const) {
    if (d === 0) {
      if (p < lo || p > hi) return false;
      continue;
    }
    const t0 = (lo - p) / d;
    const t1 = (hi - p) / d;
    tmin = Math.max(tmin, Math.min(t0, t1));
    tmax = Math.min(tmax, Math.max(t0, t1));
    if (tmin > tmax) return false;
  }
  return true;
}

/**
 * from から to まで、半径 radius の円が壁に触れずに通れるか。
 *
 * 線分を等間隔にサンプルする方法は使えない。半径 r の円を間隔 s で並べても
 * 和集合が覆えるのは半径 √(r²-(s/2)²) のカプセルまでで、刻みを細かくしても
 * 隙間は残り、壁の角をかすめる射線を「通れる」と誤答する（Issue #21）。
 *
 * 代わりに、線分を半径ぶん太らせたカプセルと壁セルの交差を厳密に解く。
 * 交差するのは、線分がセルを貫くか、セルの角が線分から radius 未満のときだけ。
 * 端点がセルに近いだけの場合は overlapsWall が拾う。
 */
export function hasLineOfSight(
  world: WorldState,
  from: Vec2,
  to: Vec2,
  radius: number,
): boolean {
  if (overlapsWall(world, from, radius) || overlapsWall(world, to, radius)) {
    return false;
  }

  const minCol = Math.floor((Math.min(from.x, to.x) - radius) / CELL_SIZE);
  const maxCol = Math.floor((Math.max(from.x, to.x) + radius) / CELL_SIZE);
  const minRow = Math.floor((Math.min(from.y, to.y) - radius) / CELL_SIZE);
  const maxRow = Math.floor((Math.max(from.y, to.y) + radius) / CELL_SIZE);
  const r2 = radius * radius;

  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      if (!isWall(world, col, row)) continue;

      const x0 = col * CELL_SIZE;
      const y0 = row * CELL_SIZE;
      const x1 = x0 + CELL_SIZE;
      const y1 = y0 + CELL_SIZE;
      if (crossesCell(from, to, x0, y0, x1, y1)) return false;

      for (const corner of [
        { x: x0, y: y0 },
        { x: x1, y: y0 },
        { x: x0, y: y1 },
        { x: x1, y: y1 },
      ]) {
        if (pointSegD2(corner, from, to) < r2) return false;
      }
    }
  }
  return true;
}
