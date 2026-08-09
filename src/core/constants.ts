// ゲームバランスに関わる数値はすべてここに集約する（docs/coding-standards.md）。
// 値の意味と、値が満たすべき制約は docs/spec/parameters.md にある。
// 両者の一致は tests/unit/spec-sync.test.ts が強制する。

export const SIM_HZ = 60;

/** 1ステップの経過時間（秒）。 */
export const DT = 1 / SIM_HZ;

export const CELL_SIZE = 1.0;
export const STAGE_COLS = 24;
export const STAGE_ROWS = 16;

export const TANK_RADIUS = 0.4;
export const TANK_SPEED = 3.0;
export const TANK_TURN_RATE = 10.0;
export const MUZZLE_OFFSET = 0.55;
export const FIRE_COOLDOWN = 0.5;
export const MAX_BULLETS_PER_TANK = 5;

export const BULLET_TYPES = {
  standard: { speed: 8.0, radius: 0.12, bounces: 1 },
} as const;

// 敵の種類は、ロジックの選択と数値の組み合わせとして定義する。
// 敵ごとにクラスや分岐を書かない（docs/requirements.md「拡張方針」）。
export const ENEMY_TYPES = {
  stationary: {
    speed: 0,
    move: "stay",
    aim: "direct",
    aimError: 0.03,
    fireInterval: 1.5,
    bullet: "standard",
  },
} as const;
