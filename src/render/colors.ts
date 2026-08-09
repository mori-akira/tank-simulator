import type { TankKind } from "../core/types.ts";

// core は色を持たない。種類と色の対応付けは描画側が持つ（docs/architecture.md 1.）。
// プレイヤーが敵の種類を瞬時に見分けられることが要件（docs/requirements.md「識別性」）。

export const TANK_COLORS: Record<TankKind, number> = {
  player: 0x2f6fd0,
  stationary: 0xb06030,
};

/** 盤面の外側。読み込み中のちらつきを防ぐため index.html の body にも同じ色がある。 */
export const BACKGROUND = 0x14161a;
export const FLOOR = 0xd8cdb4;
export const WALL = 0x7a7f8a;
export const WALL_TOP = 0x9aa0ac;
/** 砲身。車体色と分けて、砲塔の向きを読み取りやすくする。 */
export const METAL = 0x3a3d44;
/** 弾。跳弾を目で追えることが最優先なので、床・壁・車体のどれとも色相を離す。 */
export const BULLET = 0xffd400;
