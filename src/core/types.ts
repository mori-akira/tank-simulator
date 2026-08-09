import type { BULLET_TYPES, ENEMY_TYPES } from "./constants";
import type { Rng } from "./math/rng";

/** ロジックは2D。高さ・Z軸・Vector3 は持ち込まない（docs/architecture.md 3.）。 */
export type Vec2 = { x: number; y: number };

export type BulletTypeId = keyof typeof BULLET_TYPES;
export type EnemyTypeId = keyof typeof ENEMY_TYPES;

/** 種類の識別子だけを持つ。どの種類をどう描くかは render 側の対応付け。 */
export type TankKind = "player" | EnemyTypeId;

export type Tank = {
  id: number;
  kind: TankKind;
  pos: Vec2;
  /** 車体の向き（rad）。移動方向へ追従する。 */
  hull: number;
  /** 砲塔の向き（rad）。車体と独立。 */
  turret: number;
  alive: boolean;
  /** 次に撃てるまでの残り tick 数。秒で持つと減算の誤差が積もって間隔がぶれる。 */
  cooldown: number;
};

export type Bullet = {
  id: number;
  ownerId: number;
  type: BulletTypeId;
  pos: Vec2;
  vel: Vec2;
  bouncesLeft: number;
};

export type Outcome = "playing" | "cleared" | "failed";

export type WorldState = {
  tick: number;
  rng: Rng;
  cols: number;
  rows: number;
  /** 行優先のグリッド。長さは rows * cols。 */
  walls: boolean[];
  tanks: Tank[];
  bullets: Bullet[];
  nextBulletId: number;
  outcome: Outcome;
};

/** 1ステップ分の、戦車1台への入力。自機も敵もこの形で受け取る。 */
export type TankInput = {
  /** 移動の入力方向。正規化は core が行う。 */
  move: Vec2;
  /** 砲塔を向ける角度（rad）。 */
  aim: number;
  fire: boolean;
};

/** 戦車 id → 入力。入力が無い戦車は静止し、撃たない。 */
export type Inputs = Map<number, TankInput>;
