import { describe, expect, it } from "vitest";
import { runSim } from "../../tools/run.ts";

const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

describe("通しプレイ", () => {
  it.each(SEEDS)("seed %i で必ず決着する", (seed) => {
    const result = runSim(seed);
    expect(result.outcome).not.toBe("playing");
    expect(result.ticks).toBeLessThan(3600);
  });

  it("自動操縦は stage01 をクリアできる", () => {
    for (const seed of SEEDS) {
      expect(runSim(seed).outcome).toBe("cleared");
    }
  });

  it("自機が何もしなければ敵に撃たれて失敗する", () => {
    const result = runSim(1, 3600, false);
    expect(result.outcome).toBe("failed");
    expect(result.ticks).toBeLessThan(600);
  });
});
