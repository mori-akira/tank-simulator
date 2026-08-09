import { BULLET_TYPES, ENEMY_TYPES } from "../core/constants.ts";
import { nextSigned, type Rng } from "../core/math/rng.ts";
import { atan2 } from "../core/math/trig.ts";
import { hasLineOfSight } from "../core/physics/raycast.ts";
import type { Inputs, Tank, Vec2, WorldState } from "../core/types.ts";

// 敵の種類ごとにクラスや分岐を書かず、ロジックを有限個の選択肢として列挙する
// （docs/requirements.md「拡張方針」）。新種の追加は ENEMY_TYPES への追記で済む。

type Ctx = { world: WorldState; self: Tank; player: Tank };
type EnemyType = (typeof ENEMY_TYPES)[keyof typeof ENEMY_TYPES];

const MOVE: Record<EnemyType["move"], (ctx: Ctx) => Vec2> = {
  stay: () => ({ x: 0, y: 0 }),
};

const AIM: Record<EnemyType["aim"], (ctx: Ctx) => number> = {
  direct: ({ self, player }) =>
    atan2(player.pos.y - self.pos.y, player.pos.x - self.pos.x),
};

// RNG は WorldState の外にある。乱数の結果は aim という «入力» に現れるため、
// 記録した入力列だけで世界を再現できる。
export function enemyInputs(world: WorldState, rng: Rng): Inputs {
  const inputs: Inputs = new Map();
  const player = world.tanks.find((t) => t.kind === "player");
  if (player?.alive !== true) return inputs;

  for (const self of world.tanks) {
    if (self.kind === "player" || !self.alive) continue;
    const type = ENEMY_TYPES[self.kind];
    const ctx = { world, self, player };

    inputs.set(self.id, {
      move: MOVE[type.move](ctx),
      // 誤差は毎ステップ引く。RNG の消費順は world.tanks の並び順で決まるので再現する
      aim: AIM[type.aim](ctx) + nextSigned(rng, type.aimError),
      // 射線が通っているときだけ撃つ。目の前の壁を撃つと、跳ね返った自分の弾で自滅する
      fire: hasLineOfSight(
        world,
        self.pos,
        player.pos,
        BULLET_TYPES[type.bullet].radius,
      ),
    });
  }
  return inputs;
}
