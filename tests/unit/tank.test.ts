import { describe, expect, it } from "vitest";
import {
  DT,
  TANK_RADIUS,
  TANK_SPEED,
  TANK_TURN_RATE,
} from "../../src/core/constants";
import { overlapsWall } from "../../src/core/physics/collision";
import type { Tank, TankInput } from "../../src/core/types";
import { stepWorld } from "../../src/core/world";
import { input, worldFromMap } from "../helpers/world";

const MAP = ["#######", "#P...E#", "#..#..#", "#.....#", "#######"];

function setup() {
  const world = worldFromMap(MAP);
  const player = world.tanks[0] as Tank;
  const enemy = world.tanks[1] as Tank;
  const run = (steps: number, over: Partial<TankInput>) => {
    for (let i = 0; i < steps; i++)
      stepWorld(world, new Map([[player.id, input(over)]]));
  };
  return { world, player, enemy, run };
}

describe("車体の移動", () => {
  it("1ステップの移動距離は TANK_SPEED × DT", () => {
    const { player, run } = setup();
    const from = { ...player.pos };
    run(1, { move: { x: 1, y: 0 } });
    expect(
      Math.hypot(player.pos.x - from.x, player.pos.y - from.y),
    ).toBeCloseTo(TANK_SPEED * DT, 12);
  });

  it("斜め入力でも速くならない", () => {
    const { player, run } = setup();
    const from = { ...player.pos };
    run(1, { move: { x: 1, y: 1 } });
    expect(
      Math.hypot(player.pos.x - from.x, player.pos.y - from.y),
    ).toBeCloseTo(TANK_SPEED * DT, 12);
  });

  it("入力の大きさは速度に影響しない", () => {
    const a = setup();
    const b = setup();
    a.run(10, { move: { x: 1, y: 0 } });
    b.run(10, { move: { x: 100, y: 0 } });
    expect(a.player.pos.x).toBeCloseTo(b.player.pos.x, 12);
  });

  it("入力が無い戦車は動かない", () => {
    const { world, player } = setup();
    const from = { ...player.pos };
    for (let i = 0; i < 60; i++) stepWorld(world, new Map());
    expect(player.pos).toEqual(from);
  });

  it("移動速度 0 の敵は入力があっても動かない", () => {
    const { world, enemy } = setup();
    const from = { ...enemy.pos };
    for (let i = 0; i < 60; i++) {
      stepWorld(world, new Map([[enemy.id, input({ move: { x: -1, y: 1 } })]]));
    }
    expect(enemy.pos).toEqual(from);
  });
});

describe("壁との衝突", () => {
  it("壁に向かって進み続けても貫通しない", () => {
    const { world, player, run } = setup();
    run(600, { move: { x: 1, y: 0 } });

    expect(overlapsWall(world, player.pos, TANK_RADIUS)).toBe(false);
    // 右端の壁は x = 6 から始まる
    expect(player.pos.x).toBeLessThanOrEqual(6 - TANK_RADIUS);
    expect(player.pos.x).toBeCloseTo(6 - TANK_RADIUS, 6);
  });

  it("壁沿いに動くとき、壁に当たった成分だけが消えて残りは進む", () => {
    const { world, player, run } = setup();
    // 右上へ進み続ける。上は壁なので y は止まり、x だけ伸びるはず
    run(60, { move: { x: 1, y: -1 } });

    expect(player.pos.y).toBeCloseTo(1 + TANK_RADIUS, 6);
    expect(player.pos.x).toBeGreaterThan(2.5);
    expect(overlapsWall(world, player.pos, TANK_RADIUS)).toBe(false);
  });

  it("壁に押し付けたまま進んでも停止しない", () => {
    const { player, run } = setup();
    run(30, { move: { x: 1, y: -1 } });
    const mid = player.pos.x;
    run(30, { move: { x: 1, y: -1 } });
    expect(player.pos.x).toBeGreaterThan(mid);
  });
});

describe("車体と砲塔の向き", () => {
  it("砲塔は入力の角度をそのまま向く", () => {
    const { player, run } = setup();
    run(1, { aim: 1.2 });
    expect(player.turret).toBeCloseTo(1.2, 12);
  });

  it("1ステップの旋回量は TANK_TURN_RATE × DT を超えない", () => {
    const { player, run } = setup();
    // 初期の車体は +x 向き。真上（-y）へ入力すると目標は -π/2
    run(1, { move: { x: 0, y: -1 } });
    expect(Math.abs(player.hull)).toBeCloseTo(TANK_TURN_RATE * DT, 12);
  });

  it("車体はやがて移動方向を向く", () => {
    const { player, run } = setup();
    run(60, { move: { x: 0, y: 1 } });
    expect(player.hull).toBeCloseTo(Math.PI / 2, 6);
  });

  it("車体の向きは [-π, π) に収まり続ける", () => {
    const { player, run } = setup();
    for (let i = 0; i < 200; i++) {
      run(1, { move: { x: Math.cos(i), y: Math.sin(i) } });
      expect(player.hull).toBeGreaterThanOrEqual(-Math.PI);
      expect(player.hull).toBeLessThan(Math.PI);
    }
  });
});
