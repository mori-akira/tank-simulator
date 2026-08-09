import { describe, expect, it } from "vitest";
import {
  BULLET_TYPES,
  FIRE_COOLDOWN,
  MAX_BULLETS_PER_TANK,
  MUZZLE_OFFSET,
  SIM_HZ,
} from "../../src/core/constants";
import { overlapsWall } from "../../src/core/physics/collision";
import type { Bullet, Tank, TankInput } from "../../src/core/types";
import { stepWorld } from "../../src/core/world";
import { input, worldFromMap } from "../helpers/world";

const standard = BULLET_TYPES.standard;

// 縦長の廊下。上下の壁で反射を観察する
const MAP = [
  "##########",
  "#........#",
  "#........#",
  "#P......E#",
  "#........#",
  "#........#",
  "##########",
];

function setup() {
  const world = worldFromMap(MAP);
  const player = world.tanks[0] as Tank;
  const run = (steps: number, over: Partial<TankInput> = {}) => {
    for (let i = 0; i < steps; i++)
      stepWorld(world, new Map([[player.id, input(over)]]));
  };
  return { world, player, run };
}

const speedOf = (b: Bullet) => Math.hypot(b.vel.x, b.vel.y);

/** 誰にも当たらず壁にも触れない場所に置く、頭数合わせの弾。 */
const farBullet = (id: number, ownerId: number): Bullet => ({
  id,
  ownerId,
  type: "standard",
  pos: { x: 4.5, y: 1.5 },
  vel: { x: 0, y: 0 },
  bouncesLeft: standard.bounces,
});

// 真上に撃つと跳ね返った弾が自分に当たって死ぬ。斜めに撃って自分の頭上を外す
const RICOCHET_AIM = -Math.PI / 2 + 0.3;

describe("発射", () => {
  it("砲塔の向きの砲口位置から、弾速で出る", () => {
    const { world, player, run } = setup();
    const from = { ...player.pos };
    run(1, { aim: 0, fire: true });

    const bullet = world.bullets[0] as Bullet;
    expect(bullet.ownerId).toBe(player.id);
    expect(bullet.pos.x).toBeCloseTo(
      from.x + MUZZLE_OFFSET + standard.speed / SIM_HZ,
      9,
    );
    expect(bullet.pos.y).toBeCloseTo(from.y, 9);
    expect(speedOf(bullet)).toBeCloseTo(standard.speed, 9);
    expect(bullet.bouncesLeft).toBe(standard.bounces);
  });

  it("クールダウン中は撃てない", () => {
    const { world, run } = setup();
    run(1, { aim: 0, fire: true });
    run(FIRE_COOLDOWN * SIM_HZ - 1, { aim: 0, fire: true });
    expect(world.bullets).toHaveLength(1);

    run(1, { aim: 0, fire: true });
    expect(world.bullets).toHaveLength(2);
  });

  it("自弾が MAX_BULLETS_PER_TANK 発あると撃てない", () => {
    const { world, player, run } = setup();
    for (let i = 0; i < MAX_BULLETS_PER_TANK; i++) {
      world.bullets.push(farBullet(world.nextBulletId++, player.id));
    }
    run(1, { aim: 0, fire: true });
    expect(world.bullets).toHaveLength(MAX_BULLETS_PER_TANK);
  });

  it("他人の弾は自弾の上限に数えない", () => {
    const { world, player, run } = setup();
    const enemy = world.tanks[1] as Tank;
    for (let i = 0; i < MAX_BULLETS_PER_TANK; i++) {
      world.bullets.push(farBullet(world.nextBulletId++, enemy.id));
    }
    run(1, { aim: 0, fire: true });
    expect(world.bullets.filter((b) => b.ownerId === player.id)).toHaveLength(
      1,
    );
  });

  it("砲口が壁の中に入る向きでは撃てず、クールダウンも消費しない", () => {
    const { world, player, run } = setup();
    // 左の壁に密着させてから壁を向く
    run(60, { move: { x: -1, y: 0 } });
    run(1, { aim: Math.PI, fire: true });

    expect(world.bullets).toHaveLength(0);
    expect(player.cooldown).toBe(0);
  });
});

describe("反射", () => {
  it("壁で反射しても速度の大きさが変わらない", () => {
    const { world, run } = setup();
    run(1, { aim: RICOCHET_AIM, fire: true });
    const bullet = world.bullets[0] as Bullet;
    const before = speedOf(bullet);

    run(20, { aim: RICOCHET_AIM });
    expect(world.bullets).toContain(bullet);
    expect(bullet.vel.y).toBeGreaterThan(0); // 上の壁で反射して下向きになった
    expect(speedOf(bullet)).toBe(before);
  });

  it("反射しても壁の内側に残らない", () => {
    const { world, run } = setup();
    run(1, { aim: RICOCHET_AIM, fire: true });
    for (let i = 0; i < 120; i++) {
      run(1, { aim: RICOCHET_AIM });
      for (const b of world.bullets) {
        expect(overlapsWall(world, b.pos, standard.radius)).toBe(false);
      }
    }
  });

  it("反射回数を使い切ったら消滅する", () => {
    const { world, run } = setup();
    run(1, { aim: RICOCHET_AIM, fire: true });
    const bullet = world.bullets[0] as Bullet;

    // 1回目の反射で残り 0
    run(20, { aim: RICOCHET_AIM });
    expect(world.bullets).toContain(bullet);
    expect(bullet.bouncesLeft).toBe(0);

    // 2回目の反射で消える
    run(60, { aim: RICOCHET_AIM });
    expect(world.bullets).not.toContain(bullet);
  });
});
