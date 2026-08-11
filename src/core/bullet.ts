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
import type { Bullet, BulletTypeId, Tank, WorldState } from "./types.ts";

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

  // 壁に密着して壁を向くと砲口が壁の中に入る（TANK_RADIUS < MUZZLE_OFFSET のため）。
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

/**
 * 弾同士の相殺。触れた2発は双方消える。持ち主は問わない
 * （docs/requirements.md）。反射回数は消費しない。
 *
 * 戦車への命中より先に判定する。相殺で消えた弾は戦車に当たらず、撃ち落としが成立する。
 */
export function resolveBulletClashes(world: WorldState): void {
  const gone = new Set<number>();

  for (let i = 0; i < world.bullets.length; i++) {
    for (let j = i + 1; j < world.bullets.length; j++) {
      const a = world.bullets[i] as Bullet;
      const b = world.bullets[j] as Bullet;
      const reach = BULLET_TYPES[a.type].radius + BULLET_TYPES[b.type].radius;
      const dx = a.pos.x - b.pos.x;
      const dy = a.pos.y - b.pos.y;
      if (dx * dx + dy * dy >= reach * reach) continue;
      gone.add(a.id);
      gone.add(b.id);
    }
  }

  world.bullets = world.bullets.filter((bullet) => !gone.has(bullet.id));
}

/**
 * 弾と戦車の当たり判定。自弾も自分に当たる（docs/requirements.md）。
 *
 * 戦車同士に衝突判定はないので2台は重なれる。当たり判定の範囲を共有する位置に
 * 2台いるとき、当てるのは近いほうでなければならない。world.tanks の並び順で
 * 決めると、手前を素通りして奥が爆発する。
 */
export function resolveHits(world: WorldState): void {
  world.bullets = world.bullets.filter((bullet) => {
    const reach = TANK_RADIUS + BULLET_TYPES[bullet.type].radius;
    let hit: Tank | undefined;
    let nearest = reach * reach;

    for (const tank of world.tanks) {
      if (!tank.alive) continue;
      const dx = tank.pos.x - bullet.pos.x;
      const dy = tank.pos.y - bullet.pos.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < nearest) {
        nearest = d2;
        hit = tank;
      }
    }

    if (!hit) return true;
    hit.alive = false;
    return false;
  });
}
