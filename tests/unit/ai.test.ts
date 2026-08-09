import { describe, expect, it } from "vitest";
import { enemyInputs } from "../../src/ai/enemy.ts";
import { ENEMY_TYPES } from "../../src/core/constants.ts";
import { createRng } from "../../src/core/math/rng.ts";
import type { Tank } from "../../src/core/types.ts";
import { stepWorld } from "../../src/core/world.ts";
import { worldFromMap } from "../helpers/world.ts";

// 敵1は自機と同じ行で射線が通る。敵2は壁の裏
const MAP = ["########", "#P....E#", "####.###", "#E.....#", "########"];

const setup = (seed = 1) => {
  const world = worldFromMap(MAP);
  const player = world.tanks.find((t) => t.kind === "player") as Tank;
  const [visible, hidden] = world.tanks.filter(
    (t) => t.kind !== "player",
  ) as Tank[];
  const rng = createRng(seed);
  return {
    world,
    player,
    visible: visible as Tank,
    hidden: hidden as Tank,
    inputs: () => enemyInputs(world, rng),
  };
};

describe("静止型の敵", () => {
  it("移動しない", () => {
    for (const [, input] of setup().inputs()) {
      expect(input.move).toEqual({ x: 0, y: 0 });
    }
  });

  it("自機の方向を、照準誤差の範囲で狙う", () => {
    const { player, visible, inputs } = setup();
    const exact = Math.atan2(
      player.pos.y - visible.pos.y,
      player.pos.x - visible.pos.x,
    );
    const aim = inputs().get(visible.id)?.aim as number;
    expect(Math.abs(aim - exact)).toBeLessThanOrEqual(
      ENEMY_TYPES.stationary.aimError,
    );
  });

  it("照準誤差は毎回同じではない", () => {
    const { visible, inputs } = setup();
    const aims = new Set<number>();
    for (let i = 0; i < 20; i++)
      aims.add(inputs().get(visible.id)?.aim as number);
    expect(aims.size).toBeGreaterThan(1);
  });

  it("射線が通っているときだけ撃つ", () => {
    const { visible, hidden, inputs } = setup();
    const first = inputs();
    expect(first.get(visible.id)?.fire).toBe(true);
    expect(first.get(hidden.id)?.fire).toBe(false);
  });

  it("自機が破壊されていたら何もしない", () => {
    const { player, inputs } = setup();
    player.alive = false;
    expect(inputs().size).toBe(0);
  });

  it("破壊された敵は入力を出さない", () => {
    const { visible, inputs } = setup();
    visible.alive = false;
    expect(inputs().has(visible.id)).toBe(false);
  });

  it("同じ状態からは同じ入力が出る", () => {
    const a = setup(99);
    const b = setup(99);
    for (let i = 0; i < 30; i++) {
      expect([...a.inputs()]).toEqual([...b.inputs()]);
      stepWorld(a.world, new Map());
      stepWorld(b.world, new Map());
    }
  });
});
