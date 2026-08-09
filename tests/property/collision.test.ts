import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { CELL_SIZE, TANK_RADIUS } from "../../src/core/constants";
import { isWall } from "../../src/core/grid";
import { overlapsWall } from "../../src/core/physics/collision";
import type { Tank } from "../../src/core/types";
import { createWorld, stepWorld } from "../../src/core/world";
import { toWorldSpec } from "../../src/levels/build";
import { stage01 } from "../../src/levels/stage-01";
import { input } from "../helpers/world";

const spec = toWorldSpec(stage01);
const floorCells = spec.walls.flatMap((wall, i) =>
  wall ? [] : [{ col: i % spec.cols, row: Math.floor(i / spec.cols) }],
);

const move = fc.record({
  x: fc.integer({ min: -1, max: 1 }),
  y: fc.integer({ min: -1, max: 1 }),
});

describe("戦車は壁にめり込まない", () => {
  it("どの床セルから、どんな入力列で動いても壁と重ならない", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...floorCells),
        fc.array(move, { minLength: 1, maxLength: 120 }),
        (start, moves) => {
          const world = createWorld(toWorldSpec(stage01), 1);
          const player = world.tanks.find((t) => t.kind === "player") as Tank;
          player.pos.x = (start.col + 0.5) * CELL_SIZE;
          player.pos.y = (start.row + 0.5) * CELL_SIZE;

          for (const m of moves) {
            stepWorld(world, new Map([[player.id, input({ move: m })]]));
            expect(overlapsWall(world, player.pos, TANK_RADIUS)).toBe(false);
            expect(
              isWall(world, Math.floor(player.pos.x), Math.floor(player.pos.y)),
            ).toBe(false);
          }
        },
      ),
    );
  });
});
