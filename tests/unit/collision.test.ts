import { describe, expect, it } from "vitest";
import { TANK_RADIUS } from "../../src/core/constants.ts";
import {
  overlapsWall,
  pushOutAlongAxis,
} from "../../src/core/physics/collision.ts";
import { worldFromMap } from "../helpers/world.ts";

// 中央 (3,2) に単独の壁ブロックがある部屋
const world = worldFromMap([
  "#######",
  "#P...E#",
  "#..#..#",
  "#.....#",
  "#######",
]);

describe("overlapsWall", () => {
  it.each([
    ["壁のセルの中心", { x: 3.5, y: 2.5 }, true],
    ["壁に半径未満まで寄った位置", { x: 1.5, y: 1.35 }, true],
    ["壁から半径より離れた位置", { x: 1.5, y: 1.45 }, false],
    ["開けた床の中心", { x: 2.5, y: 3.5 }, false],
  ])("%s", (_name, pos, expected) => {
    expect(overlapsWall(world, pos, TANK_RADIUS)).toBe(expected);
  });
});

describe("pushOutAlongAxis", () => {
  it("壁の面に当たったら、その軸で接する位置まで戻す", () => {
    const pos = { x: 1.5, y: 1.35 };
    pushOutAlongAxis(world, pos, TANK_RADIUS, "y", false);
    expect(pos.x).toBe(1.5);
    expect(pos.y).toBeCloseTo(1.4, 8);
    expect(overlapsWall(world, pos, TANK_RADIUS)).toBe(false);
  });

  it("角に当たったら、押し戻し量が円弧に沿って小さくなる", () => {
    // 壁ブロック (3,2) の左上の角に、真下へ向かって寄る
    const pos = { x: 2.75, y: 1.9 };
    pushOutAlongAxis(world, pos, TANK_RADIUS, "y", true);

    const dx = pos.x - 3;
    const dy = pos.y - 2;
    expect(Math.hypot(dx, dy)).toBeCloseTo(TANK_RADIUS, 8);
    // 面に当たった場合の 2 - 0.4 = 1.6 より奥まで入れる
    expect(pos.y).toBeGreaterThan(1.6);
    expect(overlapsWall(world, pos, TANK_RADIUS)).toBe(false);
  });

  it("めり込んでいなければ動かさない", () => {
    const pos = { x: 2.5, y: 3.5 };
    pushOutAlongAxis(world, pos, TANK_RADIUS, "x", true);
    expect(pos).toEqual({ x: 2.5, y: 3.5 });
  });
});
