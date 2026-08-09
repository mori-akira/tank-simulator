import { describe, expect, it } from "vitest";
import { BULLET_TYPES } from "../../src/core/constants.ts";
import { hasLineOfSight } from "../../src/core/physics/raycast.ts";
import { worldFromMap } from "../helpers/world.ts";

const r = BULLET_TYPES.standard.radius;

// 中央の縦壁が左右を分ける。上下に隙間がある
const world = worldFromMap([
  "#########",
  "#...#...#",
  "#P..#..E#",
  "#...#...#",
  "#.......#",
  "#########",
]);

describe("hasLineOfSight", () => {
  it("開けた床の間は通る", () => {
    expect(
      hasLineOfSight(world, { x: 1.5, y: 4.5 }, { x: 7.5, y: 4.5 }, r),
    ).toBe(true);
  });

  it("壁を挟むと通らない", () => {
    expect(
      hasLineOfSight(world, { x: 2.5, y: 2.5 }, { x: 7.5, y: 2.5 }, r),
    ).toBe(false);
  });

  it("壁の端を回り込む経路は通らない（直線しか見ない）", () => {
    expect(
      hasLineOfSight(world, { x: 2.5, y: 1.5 }, { x: 6.5, y: 3.5 }, r),
    ).toBe(false);
  });

  it("同じ点なら通る", () => {
    expect(
      hasLineOfSight(world, { x: 1.5, y: 1.5 }, { x: 1.5, y: 1.5 }, r),
    ).toBe(true);
  });

  it("半径が大きいと通らなくなる", () => {
    const from = { x: 1.5, y: 4.5 };
    const to = { x: 7.5, y: 4.5 };
    expect(hasLineOfSight(world, from, to, r)).toBe(true);
    expect(hasLineOfSight(world, from, to, 0.6)).toBe(false);
  });

  it("向きを入れ替えても結果が変わらない", () => {
    const a = { x: 2.5, y: 2.5 };
    const b = { x: 7.5, y: 2.5 };
    expect(hasLineOfSight(world, a, b, r)).toBe(hasLineOfSight(world, b, a, r));
  });
});
