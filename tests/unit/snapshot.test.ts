import { describe, expect, it } from "vitest";
import { hashWorld } from "../../src/core/snapshot.ts";
import { createWorld } from "../../src/core/world.ts";
import { toWorldSpec } from "../../src/levels/build.ts";
import { stage01 } from "../../src/levels/stage-01.ts";

const world = () => createWorld(toWorldSpec(stage01));

describe("hashWorld", () => {
  it("同じ状態は同じハッシュになる", () => {
    expect(hashWorld(world())).toBe(hashWorld(world()));
  });

  it.each([
    ["tick", (w: ReturnType<typeof world>) => (w.tick += 1)],
    [
      "戦車の位置",
      (w: ReturnType<typeof world>) =>
        ((w.tanks[0] as { pos: { y: number } }).pos.y += 1e-9),
    ],
    [
      "戦車の生死",
      (w: ReturnType<typeof world>) =>
        ((w.tanks[0] as { alive: boolean }).alive = false),
    ],
    [
      "砲塔の向き",
      (w: ReturnType<typeof world>) =>
        ((w.tanks[0] as { turret: number }).turret = 0.5),
    ],
    ["勝敗", (w: ReturnType<typeof world>) => (w.outcome = "cleared")],
    ["壁", (w: ReturnType<typeof world>) => (w.walls[100] = !w.walls[100])],
  ])("%s が変わるとハッシュも変わる", (_name, mutate) => {
    const a = world();
    const before = hashWorld(a);
    mutate(a);
    expect(hashWorld(a)).not.toBe(before);
  });
});
