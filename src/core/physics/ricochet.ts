import { DT } from "../constants";
import type { Bullet, WorldState } from "../types";
import { overlapsWall, pushOutAlongAxis } from "./collision";

/**
 * 弾を1ステップ進め、壁に当たったら反射させる。
 * 反射回数を使い切っていたら false を返す（= 消滅）。
 *
 * 壁は軸に沿った AABB しかないため、当たった軸の速度成分の符号を反転するだけで
 * 鏡面反射になる。乗算を挟まないので速度の大きさはビット単位で保存される。
 * 角に当たった場合は両軸が反転するが、反射は1回と数える。
 */
export function advanceBullet(
  world: WorldState,
  bullet: Bullet,
  radius: number,
): boolean {
  let bounced = false;

  const dx = bullet.vel.x * DT;
  if (dx !== 0) {
    bullet.pos.x += dx;
    if (overlapsWall(world, bullet.pos, radius)) {
      pushOutAlongAxis(world, bullet.pos, radius, "x", dx > 0);
      bullet.vel.x = -bullet.vel.x;
      bounced = true;
    }
  }

  const dy = bullet.vel.y * DT;
  if (dy !== 0) {
    bullet.pos.y += dy;
    if (overlapsWall(world, bullet.pos, radius)) {
      pushOutAlongAxis(world, bullet.pos, radius, "y", dy > 0);
      bullet.vel.y = -bullet.vel.y;
      bounced = true;
    }
  }

  if (!bounced) return true;
  if (bullet.bouncesLeft === 0) return false;
  bullet.bouncesLeft -= 1;
  return true;
}
