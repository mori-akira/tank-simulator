import { describe, expect, it } from "vitest";
import { advance, createLoop } from "../../src/app/loop.ts";
import { DT, MAX_FRAME, SIM_HZ } from "../../src/core/constants.ts";
import { hashWorld } from "../../src/core/snapshot.ts";
import { createSim, stepSim } from "../../tools/run.ts";

// 検証したいのは「何 fps で描いてもシミュレーションが同じだけ・同じように進む」
// こと（docs/architecture.md 2.）。ステップ数を外から揃えて比べると、accumulator
// が結果に現れず、ループを壊しても通るテストになる。与えるのは経過時間だけにする。

const FPS = [15, 30, 50, 60, 90, 144];
/** 決着（seed 7 は 432 tick）より手前で切る。静止した世界を比べても意味がない。 */
const SECONDS = 5;
const EXPECTED_TICKS = SIM_HZ * SECONDS;

/** 指定の fps で SECONDS 秒ぶんのフレームを与える。 */
function runAtFps(fps: number) {
  const sim = createSim(7);
  const loop = createLoop();
  const frame = 1 / fps;

  for (let i = 0; i < Math.round(SECONDS * fps); i++) {
    advance(loop, frame, () => stepSim(sim));
  }
  return { tick: sim.world.tick, hash: hashWorld(sim.world) };
}

describe("描画のフレームレートとシミュレーションの分離", () => {
  it("同じ経過時間を与えれば、fps が違っても同じだけ進む", () => {
    for (const fps of FPS) {
      // 端数は accumulator に残るので、1 tick のずれまでは許す
      expect(Math.abs(runAtFps(fps).tick - EXPECTED_TICKS)).toBeLessThanOrEqual(
        1,
      );
    }
  });

  it("同じ tick まで進んだ世界は、fps が違っても完全に一致する", () => {
    const runs = FPS.map(runAtFps);

    const hashesByTick = new Map<number, Set<string>>();
    for (const run of runs) {
      const hashes = hashesByTick.get(run.tick) ?? new Set<string>();
      hashes.add(run.hash);
      hashesByTick.set(run.tick, hashes);
    }

    // 同じ tick に達した実行が2つ以上ないと、この検査は何も比べていない
    expect(runs.length - hashesByTick.size).toBeGreaterThan(0);
    for (const hashes of hashesByTick.values()) expect(hashes.size).toBe(1);
  });

  it("裏に回っていたあいだの経過時間は切り捨てる", () => {
    const loop = createLoop();
    let steps = 0;

    advance(loop, 30, () => steps++);

    // 30秒ぶんを取り戻そうとすれば1800ステップ走って固まる
    expect(steps).toBe(Math.floor(MAX_FRAME / DT));
  });
});
