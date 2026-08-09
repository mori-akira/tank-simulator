import {
  DT,
  ENEMY_TYPES,
  TANK_RADIUS,
  TANK_SPEED,
  TANK_TURN_RATE,
} from "./constants";
import { atan2, normalizeAngle } from "./math/trig";
import { pushOutAlongAxis } from "./physics/collision";
import type { Tank, TankInput, WorldState } from "./types";

export function tankSpeed(tank: Tank): number {
  return tank.kind === "player" ? TANK_SPEED : ENEMY_TYPES[tank.kind].speed;
}

export function moveTank(
  world: WorldState,
  tank: Tank,
  input: TankInput,
): void {
  // 砲塔は車体と独立。移動していなくてもカーソル方向を向く
  tank.turret = normalizeAngle(input.aim);

  const len = Math.hypot(input.move.x, input.move.y);
  if (len === 0) return;

  // 斜め入力で速くならないよう正規化する
  const dirX = input.move.x / len;
  const dirY = input.move.y / len;

  // 車体の向きは移動方向へ追従するが、旋回中に移動速度は制限しない
  tank.hull = turnToward(tank.hull, atan2(dirY, dirX), TANK_TURN_RATE * DT);

  const step = tankSpeed(tank) * DT;
  const dx = dirX * step;
  const dy = dirY * step;

  // 軸ごとに動かして軸ごとに押し戻す。壁に当たった成分だけが消え、残りは進む
  if (dx !== 0) {
    tank.pos.x += dx;
    pushOutAlongAxis(world, tank.pos, TANK_RADIUS, "x", dx > 0);
  }
  if (dy !== 0) {
    tank.pos.y += dy;
    pushOutAlongAxis(world, tank.pos, TANK_RADIUS, "y", dy > 0);
  }
}

function turnToward(from: number, to: number, maxDelta: number): number {
  const diff = normalizeAngle(to - from);
  return normalizeAngle(from + clamp(diff, -maxDelta, maxDelta));
}

const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;
