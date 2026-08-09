import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { BULLET_TYPES } from "../../src/core/constants.ts";
import { overlapsWall } from "../../src/core/physics/collision.ts";
import { hasLineOfSight } from "../../src/core/physics/raycast.ts";
import { createWorld } from "../../src/core/world.ts";
import { toWorldSpec } from "../../src/levels/build.ts";
import { stage01 } from "../../src/levels/stage-01.ts";

const r = BULLET_TYPES.standard.radius;
const world = createWorld(toWorldSpec(stage01));

// 値は整数から換算して引く。fc.double は値域ではなく «表現可能な double» の上で
// 一様に引くため、0 付近に張り付いて実質1点しか試さなくなる。
const STEPS_PER_UNIT = 64;
const coord = (max: number) =>
  fc
    .integer({ min: 0, max: max * STEPS_PER_UNIT })
    .map((i) => i / STEPS_PER_UNIT);
const point = fc.record({ x: coord(world.cols), y: coord(world.rows) });

describe("hasLineOfSight は通れない射線をクリアと言わない", () => {
  it("クリア判定なら、円は線分上のどこでも壁に触れない", () => {
    fc.assert(
      fc.property(point, point, (from, to) => {
        if (!hasLineOfSight(world, from, to, r)) return;

        // 判定の刻みの 1/50。判定が見落とした隙間があればここで捕まる
        const dist = Math.hypot(to.x - from.x, to.y - from.y);
        const steps = Math.max(1, Math.ceil(dist / (r / 50)));
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const p = {
            x: from.x + (to.x - from.x) * t,
            y: from.y + (to.y - from.y) * t,
          };
          expect(overlapsWall(world, p, r)).toBe(false);
        }
      }),
      // 射線が通らない組は何も表明せずに終わる。実際に表明へ届くのは約5%なので、
      // 見かけの回数から1桁引いたものが実効の検査数になる
      { numRuns: 3000 },
    );
  });
});
