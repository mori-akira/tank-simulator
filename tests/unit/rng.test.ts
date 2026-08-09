import { describe, expect, it } from "vitest";
import { createRng, nextFloat, nextSigned } from "../../src/core/math/rng";

const take = (seed: number, n: number) => {
  const rng = createRng(seed);
  return Array.from({ length: n }, () => nextFloat(rng));
};

describe("seeded RNG", () => {
  it("同じ seed は同じ列を返す", () => {
    expect(take(12345, 50)).toEqual(take(12345, 50));
  });

  it("異なる seed は異なる列を返す", () => {
    expect(take(1, 50)).not.toEqual(take(2, 50));
  });

  it("[0, 1) に収まる", () => {
    for (const v of take(7, 1000)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("状態を進めるので同じ値を返し続けない", () => {
    expect(new Set(take(9, 100)).size).toBeGreaterThan(90);
  });

  it("nextSigned は [-width, +width] に収まる", () => {
    const rng = createRng(42);
    for (let i = 0; i < 1000; i++) {
      const v = nextSigned(rng, 0.03);
      expect(Math.abs(v)).toBeLessThanOrEqual(0.03);
    }
  });
});
