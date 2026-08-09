import { resolveHits, stepBullets, tryFire } from "./bullet.ts";
import { createRng } from "./math/rng.ts";
import { moveTank } from "./tank.ts";
import type { Inputs, TankKind, WorldState } from "./types.ts";

/** ステージから組み立てた、World を作るのに必要な素データ。 */
export type WorldSpec = {
  cols: number;
  rows: number;
  walls: boolean[];
  spawns: { kind: TankKind; x: number; y: number }[];
};

export function createWorld(spec: WorldSpec, seed: number): WorldState {
  return {
    tick: 0,
    rng: createRng(seed),
    cols: spec.cols,
    rows: spec.rows,
    walls: spec.walls,
    tanks: spec.spawns.map((s, i) => ({
      id: i,
      kind: s.kind,
      pos: { x: s.x, y: s.y },
      hull: 0,
      turret: 0,
      alive: true,
      cooldown: 0,
    })),
    bullets: [],
    nextBulletId: 0,
    outcome: "playing",
  };
}

/**
 * 世界を1ステップ進める。固定タイムステップであり、描画のフレームレートに依存しない
 * （docs/architecture.md 2.）。WorldState は破壊的に更新する。
 */
export function stepWorld(world: WorldState, inputs: Inputs): void {
  for (const tank of world.tanks) {
    if (!tank.alive) continue;
    if (tank.cooldown > 0) tank.cooldown -= 1;

    const input = inputs.get(tank.id);
    if (!input) continue;
    moveTank(world, tank, input);
    if (input.fire) tryFire(world, tank);
  }

  stepBullets(world);
  resolveHits(world);
  updateOutcome(world);
  world.tick += 1;
}

function updateOutcome(world: WorldState): void {
  // 一度ついた決着は覆らない。決着後も弾は飛び続けるため、放っておくと
  // 「クリア後に流れ弾で失敗」といった逆転が起きる
  if (world.outcome !== "playing") return;

  const player = world.tanks.find((t) => t.kind === "player");
  if (player?.alive !== true) {
    world.outcome = "failed";
    return;
  }
  if (world.tanks.every((t) => t.kind === "player" || !t.alive)) {
    world.outcome = "cleared";
  }
}
