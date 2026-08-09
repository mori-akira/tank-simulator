import {
  BULLET_TYPES,
  ENEMY_TYPES,
  FIRE_COOLDOWN,
  MAX_BULLETS_PER_TANK,
  MUZZLE_OFFSET,
  SIM_HZ,
  TANK_RADIUS,
} from "./constants.ts";
import { cos, sin } from "./math/trig.ts";
import { overlapsWall } from "./physics/collision.ts";
import { advanceBullet } from "./physics/ricochet.ts";
import type { BulletTypeId, Tank, WorldState } from "./types.ts";

const bulletTypeOf = (tank: Tank): BulletTypeId =>
  tank.kind === "player" ? "standard" : ENEMY_TYPES[tank.kind].bullet;

/** 発射間隔は tick 数で持つ。秒のまま減算すると誤差が積もり、間隔が1 tick ぶれる。 */
const cooldownTicksOf = (tank: Tank): number =>
  Math.round(
    (tank.kind === "player"
      ? FIRE_COOLDOWN
      : ENEMY_TYPES[tank.kind].fireInterval) * SIM_HZ,
  );

export function tryFire(world: WorldState, tank: Tank): void {
  if (tank.cooldown > 0) return;
  if (
    world.bullets.filter((b) => b.ownerId === tank.id).length >=
    MAX_BULLETS_PER_TANK
  ) {
    return;
  }

  const type = bulletTypeOf(tank);
  const spec = BULLET_TYPES[type];
  const dirX = cos(tank.turret);
  const dirY = sin(tank.turret);
  const pos = {
    x: tank.pos.x + dirX * MUZZLE_OFFSET,
    y: tank.pos.y + dirY * MUZZLE_OFFSET,
  };

  // 壁に密着して壁を向くと砲口が壁の中に入る（TANK_RADIUS 0.4 < MUZZLE_OFFSET 0.55）。
  // そこに湧いた弾は初回のステップで両軸とも反転し、撃った本人へ跳ね返ってくる。
  // 弾を歪んだ位置から出すより、その一発を撃てないことにする
  if (overlapsWall(world, pos, spec.radius)) return;

  world.bullets.push({
    id: world.nextBulletId++,
    ownerId: tank.id,
    type,
    pos,
    vel: { x: dirX * spec.speed, y: dirY * spec.speed },
    bouncesLeft: spec.bounces,
  });
  tank.cooldown = cooldownTicksOf(tank);
}

export function stepBullets(world: WorldState): void {
  world.bullets = world.bullets.filter((bullet) =>
    advanceBullet(world, bullet, BULLET_TYPES[bullet.type].radius),
  );
}

/** 弾と戦車の当たり判定。自弾も自分に当たる（docs/requirements.md）。 */
export function resolveHits(world: WorldState): void {
  world.bullets = world.bullets.filter((bullet) => {
    const reach = TANK_RADIUS + BULLET_TYPES[bullet.type].radius;
    const hit = world.tanks.find((tank) => {
      if (!tank.alive) return false;
      const dx = tank.pos.x - bullet.pos.x;
      const dy = tank.pos.y - bullet.pos.y;
      return dx * dx + dy * dy < reach * reach;
    });
    if (!hit) return true;
    hit.alive = false;
    return false;
  });
}
