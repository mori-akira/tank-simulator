import type { WorldState } from "./types.ts";

/**
 * WorldState 全体の 64bit ハッシュ。同じ入力列で同じ値になることがリプレイ検証の根拠。
 * 状態にフィールドを足したらここにも足すこと。落ちたフィールドは差分として現れない。
 */
export function hashWorld(world: WorldState): string {
  const view = new DataView(new ArrayBuffer(8));
  let a = 0x811c9dc5;
  let b = 0x01000193;

  const num = (n: number) => {
    // -0 と 0 はビット列が異なる。同じ状態が別ハッシュになるのを防ぐ
    view.setFloat64(0, n === 0 ? 0 : n);
    for (let i = 0; i < 8; i++) {
      const byte = view.getUint8(i);
      a = Math.imul(a ^ byte, 0x01000193) >>> 0;
      b = Math.imul(b + byte, 0x85ebca6b) >>> 0;
    }
  };
  const str = (s: string) => {
    num(s.length);
    for (let i = 0; i < s.length; i++) num(s.charCodeAt(i));
  };

  num(world.tick);
  num(world.cols);
  num(world.rows);
  num(world.walls.length);
  for (const w of world.walls) num(w ? 1 : 0);

  num(world.tanks.length);
  for (const t of world.tanks) {
    num(t.id);
    str(t.kind);
    num(t.pos.x);
    num(t.pos.y);
    num(t.hull);
    num(t.turret);
    num(t.alive ? 1 : 0);
    num(t.cooldown);
  }

  num(world.bullets.length);
  for (const bullet of world.bullets) {
    num(bullet.id);
    num(bullet.ownerId);
    str(bullet.type);
    num(bullet.pos.x);
    num(bullet.pos.y);
    num(bullet.vel.x);
    num(bullet.vel.y);
    num(bullet.bouncesLeft);
  }

  num(world.nextBulletId);
  str(world.outcome);

  return a.toString(16).padStart(8, "0") + b.toString(16).padStart(8, "0");
}
