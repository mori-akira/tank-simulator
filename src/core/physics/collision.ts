import { CELL_SIZE } from "../constants.ts";
import { isWall } from "../grid.ts";
import type { Vec2, WorldState } from "../types.ts";

// 押し戻しの余白。接するちょうどの位置に戻すと、丸め次第でわずかに残っためり込みが
// 次のステップへ持ち越される。目に見えない幅だけ離して invariant を素直に保つ。
const SKIN = 1e-9;

const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;

function overlapsCell(
  pos: Vec2,
  radius: number,
  col: number,
  row: number,
): boolean {
  const dx = pos.x - clamp(pos.x, col * CELL_SIZE, (col + 1) * CELL_SIZE);
  const dy = pos.y - clamp(pos.y, row * CELL_SIZE, (row + 1) * CELL_SIZE);
  return dx * dx + dy * dy < radius * radius;
}

export function overlapsWall(
  world: WorldState,
  pos: Vec2,
  radius: number,
): boolean {
  const minCol = Math.floor((pos.x - radius) / CELL_SIZE);
  const maxCol = Math.floor((pos.x + radius) / CELL_SIZE);
  const minRow = Math.floor((pos.y - radius) / CELL_SIZE);
  const maxRow = Math.floor((pos.y + radius) / CELL_SIZE);

  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      if (isWall(world, col, row) && overlapsCell(pos, radius, col, row))
        return true;
    }
  }
  return false;
}

/**
 * 1軸だけ動かした直後の円を、めり込んだ壁からその軸に沿って押し戻す。
 *
 * 軸ごとに動かして軸ごとに戻すことで、壁に当たった成分だけが消えて残りは進む。
 * これが壁ずりになる。角に当たった場合は押し戻し量が円弧に沿って小さくなる。
 */
export function pushOutAlongAxis(
  world: WorldState,
  pos: Vec2,
  radius: number,
  axis: "x" | "y",
  positive: boolean,
): void {
  const minCol = Math.floor((pos.x - radius) / CELL_SIZE);
  const maxCol = Math.floor((pos.x + radius) / CELL_SIZE);
  const minRow = Math.floor((pos.y - radius) / CELL_SIZE);
  const maxRow = Math.floor((pos.y + radius) / CELL_SIZE);

  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      if (!isWall(world, col, row)) continue;
      if (!overlapsCell(pos, radius, col, row)) continue;

      const cellMinX = col * CELL_SIZE;
      const cellMinY = row * CELL_SIZE;

      if (axis === "x") {
        // 移動軸に直交する方向のずれ。overlapsCell が真なら必ず radius 未満
        const off = pos.y - clamp(pos.y, cellMinY, cellMinY + CELL_SIZE);
        const gap = Math.sqrt(radius * radius - off * off) + SKIN;
        pos.x = positive
          ? Math.min(pos.x, cellMinX - gap)
          : Math.max(pos.x, cellMinX + CELL_SIZE + gap);
      } else {
        const off = pos.x - clamp(pos.x, cellMinX, cellMinX + CELL_SIZE);
        const gap = Math.sqrt(radius * radius - off * off) + SKIN;
        pos.y = positive
          ? Math.min(pos.y, cellMinY - gap)
          : Math.max(pos.y, cellMinY + CELL_SIZE + gap);
      }
    }
  }
}
