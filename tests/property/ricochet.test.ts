import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { BULLET_TYPES, CELL_SIZE } from "../../src/core/constants.ts";
import { overlapsWall } from "../../src/core/physics/collision.ts";
import type { Bullet, Tank } from "../../src/core/types.ts";
import { createWorld, stepWorld } from "../../src/core/world.ts";
import { toWorldSpec } from "../../src/levels/build.ts";
import { stage01 } from "../../src/levels/stage-01.ts";
import { input } from "../helpers/world.ts";

const standard = BULLET_TYPES.standard;
const spec = toWorldSpec(stage01);
const floorCells = spec.walls.flatMap((wall, i) =>
  wall ? [] : [{ col: i % spec.cols, row: Math.floor(i / spec.cols) }],
);

const speedOf = (b: Bullet) => Math.hypot(b.vel.x, b.vel.y);

/** 床セルの中心から指定の向きへ1発撃つ。砲口が壁の中なら撃てないので null。 */
function fireFrom(cell: { col: number; row: number }, aim: number) {
  const world = createWorld(toWorldSpec(stage01), 1);
  const player = world.tanks.find((t) => t.kind === "player") as Tank;
  player.pos.x = (cell.col + 0.5) * CELL_SIZE;
  player.pos.y = (cell.row + 0.5) * CELL_SIZE;

  stepWorld(world, new Map([[player.id, input({ aim, fire: true })]]));
  const bullet = world.bullets[0];
  return bullet ? { world, bullet } : null;
}

describe("弾の反射", () => {
  it("反射しても速度の大きさが保存され、壁の内側にも残らない", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...floorCells),
        fc.double({ min: -Math.PI, max: Math.PI, noNaN: true }),
        (cell, aim) => {
          const fired = fireFrom(cell, aim);
          if (!fired) return;
          const { world, bullet } = fired;
          const speed = speedOf(bullet);

          for (let i = 0; i < 200 && world.bullets.includes(bullet); i++) {
            stepWorld(world, new Map());
            expect(speedOf(bullet)).toBe(speed);
            expect(overlapsWall(world, bullet.pos, standard.radius)).toBe(
              false,
            );
          }
        },
      ),
    );
  });

  it("反射のたびに残り回数が減り、使い切ると消える", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...floorCells),
        fc.double({ min: -Math.PI, max: Math.PI, noNaN: true }),
        (cell, aim) => {
          const fired = fireFrom(cell, aim);
          if (!fired) return;
          const { world, bullet } = fired;

          let bounces = 0;
          let prev = { x: bullet.vel.x, y: bullet.vel.y };
          for (let i = 0; i < 400 && world.bullets.includes(bullet); i++) {
            stepWorld(world, new Map());
            if (bullet.vel.x !== prev.x || bullet.vel.y !== prev.y) bounces++;
            prev = { x: bullet.vel.x, y: bullet.vel.y };
            expect(bullet.bouncesLeft).toBe(
              Math.max(0, standard.bounces - bounces),
            );
          }
          expect(bounces).toBeLessThanOrEqual(standard.bounces + 1);
        },
      ),
    );
  });
});
