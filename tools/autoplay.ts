import { BULLET_TYPES } from "../src/core/constants.ts";
import { atan2 } from "../src/core/math/trig.ts";
import { hasLineOfSight } from "../src/core/physics/raycast.ts";
import type {
  Bullet,
  Tank,
  TankInput,
  Vec2,
  WorldState,
} from "../src/core/types.ts";

// ヘッドレスで勝敗まで到達させるための自動操縦。人間の代わりであって、敵の思考
// （src/ai/）とは別物。

/** この距離まで近づいたら次のウェイポイントへ。 */
const ARRIVE = 0.3;
/** 横移動の向きを反転する周期（tick）。 */
const STRAFE_PERIOD = 40;
/** これより近い敵弾を、迫っている脅威とみなす。 */
const THREAT_RANGE = 6;

export type AutoPlayer = { waypoints: Vec2[]; next: number };

export const createAutoPlayer = (waypoints: Vec2[]): AutoPlayer => ({
  waypoints,
  next: 0,
});

export function autoPlayerInput(
  world: WorldState,
  self: Tank,
  auto: AutoPlayer,
): TankInput {
  const target = nearestEnemy(world, self);
  if (!target) return { move: { x: 0, y: 0 }, aim: self.turret, fire: false };

  const toTarget = {
    x: target.pos.x - self.pos.x,
    y: target.pos.y - self.pos.y,
  };
  const aim = atan2(toTarget.y, toTarget.x);
  const visible = hasLineOfSight(
    world,
    self.pos,
    target.pos,
    BULLET_TYPES.standard.radius,
  );

  // 静止型の敵は自機の «現在位置» を狙う。横に動いていれば弾が届くころには外れている。
  // 止まると当たる。射線が切れても飛来中の弾は消えないので、回避は射線と切り離す
  const incoming = incomingBullet(world, self);
  if (incoming) {
    return { move: awayFromLine(incoming, self), aim, fire: visible };
  }
  if (visible) {
    return { move: perpendicular(toTarget, flip(world.tick)), aim, fire: true };
  }
  return { move: toWaypoint(self, auto), aim, fire: false };
}

const flip = (tick: number) =>
  Math.floor(tick / STRAFE_PERIOD) % 2 === 0 ? 1 : -1;

function perpendicular(v: Vec2, sign: number): Vec2 {
  const len = Math.hypot(v.x, v.y);
  return { x: (-v.y / len) * sign, y: (v.x / len) * sign };
}

/** 弾の進路から離れる側へ真横に逃げる。すでに外れている側へ動くので確実に遠ざかる。 */
function awayFromLine(bullet: Bullet, self: Tank): Vec2 {
  const dx = self.pos.x - bullet.pos.x;
  const dy = self.pos.y - bullet.pos.y;
  const cross = bullet.vel.x * dy - bullet.vel.y * dx;
  return perpendicular(bullet.vel, cross >= 0 ? 1 : -1);
}

/** 自分へ近づいてくる他人の弾のうち、最も近いもの。 */
function incomingBullet(world: WorldState, self: Tank): Bullet | undefined {
  let best: Bullet | undefined;
  let bestDist = THREAT_RANGE;
  for (const bullet of world.bullets) {
    if (bullet.ownerId === self.id) continue;
    const dx = self.pos.x - bullet.pos.x;
    const dy = self.pos.y - bullet.pos.y;
    if (dx * bullet.vel.x + dy * bullet.vel.y <= 0) continue; // 遠ざかっている

    const dist = Math.hypot(dx, dy);
    if (dist < bestDist) {
      best = bullet;
      bestDist = dist;
    }
  }
  return best;
}

function nearestEnemy(world: WorldState, self: Tank): Tank | undefined {
  let best: Tank | undefined;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const tank of world.tanks) {
    if (tank === self || !tank.alive) continue;
    const dist = Math.hypot(tank.pos.x - self.pos.x, tank.pos.y - self.pos.y);
    if (dist < bestDist) {
      best = tank;
      bestDist = dist;
    }
  }
  return best;
}

/**
 * 次のウェイポイントへ向かう。使い切ったら先頭へ戻り、巡回する。
 *
 * 経路は「射線の通らない敵へ回り込む」ためのもので、どの敵がいつ死ぬかまでは織り込めない。
 * 使い切ったところで止まると、残った敵に射線が通らないまま動かなくなる。標的へ直進させる
 * 案は、経路探索がないため壁の角に嵌まって動けなくなった。巡回ならいずれ射線の通る位置に戻る。
 */
function toWaypoint(self: Tank, auto: AutoPlayer): Vec2 {
  const goal = auto.waypoints[auto.next] as Vec2;

  const dx = goal.x - self.pos.x;
  const dy = goal.y - self.pos.y;
  if (Math.hypot(dx, dy) < ARRIVE) {
    auto.next = (auto.next + 1) % auto.waypoints.length;
    return { x: 0, y: 0 };
  }
  return { x: dx, y: dy };
}
