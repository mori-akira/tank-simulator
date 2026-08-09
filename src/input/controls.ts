import { atan2 } from "../core/math/trig.ts";
import type { TankInput, Vec2 } from "../core/types.ts";

// 画面の上は行 0 の側、すなわちロジックの y が小さい側。
const MOVE_KEYS: Record<string, Vec2> = {
  KeyW: { x: 0, y: -1 },
  KeyS: { x: 0, y: 1 },
  KeyA: { x: -1, y: 0 },
  KeyD: { x: 1, y: 0 },
};

export type Controls = {
  /** 押されているキーから合成した移動方向。正規化は core が行う。 */
  move: Vec2;
  /** カーソルの画面位置（NDC, -1..1）。盤面上の位置への変換は render が行う。 */
  pointerNdc: Vec2;
  fire: boolean;
};

export function createControls(canvas: HTMLCanvasElement): Controls {
  const controls: Controls = {
    move: { x: 0, y: 0 },
    pointerNdc: { x: 0, y: 0 },
    fire: false,
  };
  const held = new Map<string, Vec2>();

  const sync = () => {
    let x = 0;
    let y = 0;
    for (const dir of held.values()) {
      x += dir.x;
      y += dir.y;
    }
    controls.move = { x, y };
  };

  window.addEventListener("keydown", (e) => {
    const dir = MOVE_KEYS[e.code];
    if (!dir) return;
    held.set(e.code, dir);
    sync();
  });
  window.addEventListener("keyup", (e) => {
    if (held.delete(e.code)) sync();
  });
  // フォーカスが移ると keyup が届かない。押しっぱなしのまま戻ると自機が走り続ける
  window.addEventListener("blur", () => {
    held.clear();
    sync();
    controls.fire = false;
  });

  canvas.addEventListener("pointermove", (e) => {
    const rect = canvas.getBoundingClientRect();
    controls.pointerNdc = {
      x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
      y: -((e.clientY - rect.top) / rect.height) * 2 + 1,
    };
  });
  // 押しっぱなしで連射する。実際の間隔は core のクールダウンが決める
  canvas.addEventListener("pointerdown", (e) => {
    if (e.button === 0) controls.fire = true;
  });
  window.addEventListener("pointerup", (e) => {
    if (e.button === 0) controls.fire = false;
  });

  return controls;
}

/** カーソルの盤面上の位置を受け取り、core が受け取る入力の形へ変換する。 */
export function toTankInput(
  controls: Controls,
  self: Vec2,
  cursor: Vec2,
): TankInput {
  return {
    move: controls.move,
    // 砲塔は常にカーソル方向（docs/requirements.md）
    aim: atan2(cursor.y - self.y, cursor.x - self.x),
    fire: controls.fire,
  };
}
