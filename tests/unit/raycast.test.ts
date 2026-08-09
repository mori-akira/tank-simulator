import { describe, expect, it } from "vitest";
import { BULLET_TYPES } from "../../src/core/constants.ts";
import { hasLineOfSight } from "../../src/core/physics/raycast.ts";
import { createWorld } from "../../src/core/world.ts";
import { toWorldSpec } from "../../src/levels/build.ts";
import { stage01 } from "../../src/levels/stage-01.ts";
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

  // 壁ブロックの左下の角は (4, 4)。判定が角のどちら側にあるかを厳密に見ているか
  it.each([
    ["角との距離が半径より小さければ通らない", 4.0 + r * 0.9, false],
    ["角との距離が半径より大きければ通る", 4.0 + r * 1.1, true],
  ])("%s", (_name, y, expected) => {
    expect(hasLineOfSight(world, { x: 1.5, y }, { x: 7.5, y }, r)).toBe(
      expected,
    );
  });

  // サンプル間の隙間をすり抜けていた実例（Issue #21）。撃つと壁で跳ね返る
  it("壁の角をかすめる射線はクリアにしない", () => {
    const stage = createWorld(toWorldSpec(stage01));
    expect(
      hasLineOfSight(
        stage,
        { x: 14.361957035958767, y: 11.148184817284346 },
        { x: 4.159279888495803, y: 8.933640241622925 },
        r,
      ),
    ).toBe(false);
  });
});
