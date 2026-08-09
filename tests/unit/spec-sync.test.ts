import { describe, expect, it } from "vitest";
import specMd from "../../docs/spec/parameters.md?raw";
import * as constants from "../../src/core/constants.ts";
import {
  BULLET_TYPES,
  CELL_SIZE,
  DT,
  MUZZLE_OFFSET,
  TANK_RADIUS,
} from "../../src/core/constants.ts";

// docs/spec/parameters.md と constants.ts は同じ数値を二重に持つ。数値は今後
// デバッグで微調整されるため、片方だけ更新されてズレるのを機構で防ぐ（ADR 0005）。

const SPEC_ROW = /^\| `([A-Z_][A-Za-z0-9_.]*)` \| (-?[\d.]+) \|/gm;

const specValues = [...specMd.matchAll(SPEC_ROW)].map((m) => ({
  name: m[1] as string,
  value: Number(m[2]),
}));

function resolve(path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (acc, key) => (acc as Record<string, unknown>)[key],
      constants as unknown as Record<string, unknown>,
    );
}

describe("spec と constants.ts の一致", () => {
  it("表を読み取れている", () => {
    // 正規表現が空振りしても «全件一致» は成立してしまう。件数で沈黙を防ぐ。
    // パラメータを増減したらこの数も更新する
    expect(specValues.length).toBe(18);
  });

  it.each(specValues)("$name が spec と一致する", ({ name, value }) => {
    expect(resolve(name)).toBe(value);
  });
});

// docs/spec/parameters.md「値が満たすべき制約」。微調整で壊してはいけない線。
describe("値が満たすべき制約", () => {
  it.each(Object.entries(BULLET_TYPES))(
    "%s: 砲口が戦車と弾の当たり判定の外にある",
    (_id, bullet) => {
      expect(MUZZLE_OFFSET).toBeGreaterThan(TANK_RADIUS + bullet.radius);
    },
  );

  it.each(Object.entries(BULLET_TYPES))(
    "%s: 1ステップの移動量が壁の厚みを超えない",
    (_id, bullet) => {
      expect(bullet.speed * DT).toBeLessThan(CELL_SIZE);
    },
  );

  it("戦車が壁の隙間を通れる", () => {
    expect(TANK_RADIUS * 2).toBeLessThan(CELL_SIZE);
  });
});
