import { describe, expect, it } from "vitest";
import { nextFloat } from "../../src/core/math/rng";
import { cloneWorld, hashWorld } from "../../src/core/snapshot";
import { createWorld } from "../../src/core/world";
import { toWorldSpec } from "../../src/levels/build";
import { stage01 } from "../../src/levels/stage-01";

const world = () => createWorld(toWorldSpec(stage01), 1);

describe("cloneWorld", () => {
  it("複製のハッシュは元と一致する", () => {
    const a = world();
    expect(hashWorld(cloneWorld(a))).toBe(hashWorld(a));
  });

  it("複製を変更しても元に波及しない", () => {
    const a = world();
    const before = hashWorld(a);
    const b = cloneWorld(a);

    (b.tanks[0] as { pos: { x: number } }).pos.x += 1;
    b.bullets.push({
      id: 0,
      ownerId: 0,
      type: "standard",
      pos: { x: 1, y: 1 },
      vel: { x: 1, y: 0 },
      bouncesLeft: 1,
    });
    nextFloat(b.rng);

    expect(hashWorld(a)).toBe(before);
    expect(hashWorld(b)).not.toBe(before);
  });
});

describe("hashWorld", () => {
  it("同じ状態は同じハッシュになる", () => {
    expect(hashWorld(world())).toBe(hashWorld(world()));
  });

  it("seed が違えばハッシュも違う", () => {
    const a = createWorld(toWorldSpec(stage01), 1);
    const b = createWorld(toWorldSpec(stage01), 2);
    expect(hashWorld(a)).not.toBe(hashWorld(b));
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
