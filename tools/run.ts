import { enemyInputs } from "../src/ai/enemy.ts";
import { createRng, type Rng } from "../src/core/math/rng.ts";
import { hashWorld } from "../src/core/snapshot.ts";
import type { Inputs, Outcome, Tank, WorldState } from "../src/core/types.ts";
import { createWorld, stepWorld } from "../src/core/world.ts";
import { toWorldSpec } from "../src/levels/build.ts";
import { stage01 } from "../src/levels/stage-01.ts";
import {
  type AutoPlayer,
  autoPlayerInput,
  createAutoPlayer,
} from "./autoplay.ts";

/**
 * stage01 を自動操縦で抜けるための経路。敵2は壁の裏にいるので回り込む。
 *
 * くぼみの南を回り、射線が開く距離で止まる。左の縦通路から降りると射線が開くのは
 * 至近距離であり、そこでは敵弾が届くまでに当たり判定の外へ抜けられない。
 */
const WAYPOINTS = [
  { x: 11.5, y: 14.5 },
  { x: 5.5, y: 14.5 },
  { x: 3.5, y: 14.5 },
];

export type Sim = {
  world: WorldState;
  player: Tank;
  auto: AutoPlayer;
  rng: Rng;
};
export type SimResult = { outcome: Outcome; ticks: number; hash: string };

export function createSim(seed: number): Sim {
  const world = createWorld(toWorldSpec(stage01));
  return {
    world,
    player: world.tanks.find((t) => t.kind === "player") as Tank,
    auto: createAutoPlayer(WAYPOINTS.map((w) => ({ ...w }))),
    rng: createRng(seed),
  };
}

/** 1ステップ進め、そのとき使った入力を返す。リプレイの記録に使う。 */
export function stepSim(sim: Sim, drivePlayer = true): Inputs {
  const inputs = enemyInputs(sim.world, sim.rng);
  if (drivePlayer && sim.player.alive) {
    inputs.set(sim.player.id, autoPlayerInput(sim.world, sim.player, sim.auto));
  }
  stepWorld(sim.world, inputs);
  return inputs;
}

/**
 * ヘッドレスで1ステージを通す。
 * `drivePlayer` が false なら自機は何もしない（敵に撃たれて決着する）。
 */
export function runSim(
  seed: number,
  maxTicks = 3600,
  drivePlayer = true,
): SimResult {
  const sim = createSim(seed);
  while (sim.world.outcome === "playing" && sim.world.tick < maxTicks) {
    stepSim(sim, drivePlayer);
  }
  return {
    outcome: sim.world.outcome,
    ticks: sim.world.tick,
    hash: hashWorld(sim.world),
  };
}
