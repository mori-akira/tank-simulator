import { describe, expect, it } from "vitest";
import type { Bullet, Tank, TankInput } from "../../src/core/types";
import { stepWorld } from "../../src/core/world";
import { input, worldFromMap } from "../helpers/world";

const ONE_ENEMY = [
  "##########",
  "#........#",
  "#........#",
  "#P......E#",
  "#........#",
  "#........#",
  "##########",
];

const TWO_ENEMIES = [
  "##########",
  "#........#",
  "#.E......#",
  "#P......E#",
  "#........#",
  "#........#",
  "##########",
];

function setup(map: string[]) {
  const world = worldFromMap(map);
  const player = world.tanks.find((t) => t.kind === "player") as Tank;
  const enemies = world.tanks.filter((t) => t.kind !== "player");
  const run = (steps: number, byTank: Map<number, Partial<TankInput>>) => {
    for (let i = 0; i < steps; i++) {
      stepWorld(
        world,
        new Map([...byTank].map(([id, over]) => [id, input(over)])),
      );
    }
  };
  return { world, player, enemies, run };
}

describe("勝敗", () => {
  it("敵を全滅させたらクリア", () => {
    const { world, player, enemies, run } = setup(ONE_ENEMY);
    run(60, new Map([[player.id, { aim: 0, fire: true }]]));

    expect(enemies[0]?.alive).toBe(false);
    expect(world.outcome).toBe("cleared");
  });

  it("敵が残っているうちはクリアにならない", () => {
    const { world, player, enemies, run } = setup(TWO_ENEMIES);
    run(60, new Map([[player.id, { aim: 0, fire: true }]]));

    expect(enemies.filter((e) => e.alive)).toHaveLength(1);
    expect(world.outcome).toBe("playing");
  });

  it("敵に撃たれたら失敗", () => {
    const { world, player, enemies, run } = setup(ONE_ENEMY);
    const enemy = enemies[0] as Tank;
    run(60, new Map([[enemy.id, { aim: Math.PI, fire: true }]]));

    expect(player.alive).toBe(false);
    expect(world.outcome).toBe("failed");
  });

  it("自分の弾が跳ね返って自分に当たっても失敗", () => {
    const { world, player, run } = setup(ONE_ENEMY);
    // 真上に撃つと上の壁で反射して真下へ戻ってくる
    run(60, new Map([[player.id, { aim: -Math.PI / 2, fire: true }]]));

    expect(player.alive).toBe(false);
    expect(world.outcome).toBe("failed");
  });

  it("一度ついた決着は覆らない", () => {
    const { world, player, run } = setup(ONE_ENEMY);
    run(60, new Map([[player.id, { aim: 0, fire: true }]]));
    expect(world.outcome).toBe("cleared");

    // クリア後に流れ弾で自機が破壊されても、結果は変わらない
    const stray: Bullet = {
      id: world.nextBulletId++,
      ownerId: player.id,
      type: "standard",
      pos: { x: player.pos.x, y: player.pos.y },
      vel: { x: 0, y: 0 },
      bouncesLeft: 0,
    };
    world.bullets.push(stray);
    run(1, new Map());

    expect(player.alive).toBe(false);
    expect(world.outcome).toBe("cleared");
  });
});
