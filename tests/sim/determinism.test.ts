import { describe, expect, it } from "vitest";
import { hashWorld } from "../../src/core/snapshot.ts";
import type { Inputs } from "../../src/core/types.ts";
import { createWorld, stepWorld } from "../../src/core/world.ts";
import { toWorldSpec } from "../../src/levels/build.ts";
import { stage01 } from "../../src/levels/stage-01.ts";
import { createSim, runSim, stepSim } from "../../tools/run.ts";

/** 1回通しで走らせ、各 tick の入力とハッシュを記録する。 */
function record(seed: number) {
  const sim = createSim(seed);
  const inputs: Inputs[] = [];
  const hashes: string[] = [];
  while (sim.world.outcome === "playing" && sim.world.tick < 3600) {
    inputs.push(stepSim(sim));
    hashes.push(hashWorld(sim.world));
  }
  return { inputs, hashes, outcome: sim.world.outcome };
}

describe("決定論", () => {
  it("同じ seed の2回の実行は、全 tick でハッシュが一致する", () => {
    const a = record(7);
    const b = record(7);
    expect(a.hashes).toEqual(b.hashes);
    expect(a.hashes.length).toBeGreaterThan(100);
  });

  it("記録した入力列を流し直すと、全 tick でハッシュが一致する", () => {
    const seed = 7;
    const { inputs, hashes } = record(seed);

    // 自動操縦も敵の思考も通さず、記録した入力だけで同じ世界を再現する
    const replay = createWorld(toWorldSpec(stage01));
    const replayed = inputs.map((input) => {
      stepWorld(replay, input);
      return hashWorld(replay);
    });

    expect(replayed).toEqual(hashes);
  });

  it("seed が違えばハッシュも違う", () => {
    expect(runSim(1).hash).not.toBe(runSim(2).hash);
  });

  it("同じ seed の結果は実行のたびに変わらない", () => {
    for (const seed of [1, 2, 3, 42]) {
      expect(runSim(seed)).toEqual(runSim(seed));
    }
  });
});
