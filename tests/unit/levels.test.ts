import { describe, expect, it } from "vitest";
import { CELL_SIZE, STAGE_COLS, STAGE_ROWS } from "../../src/core/constants";
import { createWorld, isWall } from "../../src/core/world";
import { toWorldSpec } from "../../src/levels/build";
import { stageSchema } from "../../src/levels/schema";
import { stage01 } from "../../src/levels/stage-01";

const valid = {
  name: "t",
  map: ["####", "#PE#", "####"],
};

describe("stageSchema", () => {
  it("正しいステージを受け入れる", () => {
    expect(stageSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    ["行の長さが揃っていない", { ...valid, map: ["####", "#PE#", "###"] }],
    ["自機がいない", { ...valid, map: ["####", "#.E#", "####"] }],
    ["自機が2つある", { ...valid, map: ["####", "#PE#", "#P.#"] }],
    ["敵がいない", { ...valid, map: ["####", "#P.#", "####"] }],
    ["未知の文字がある", { ...valid, map: ["####", "#PX#", "####"] }],
    ["名前が空", { ...valid, name: "" }],
  ])("%s ステージを拒否する", (_name, stage) => {
    expect(stageSchema.safeParse(stage).success).toBe(false);
  });
});

describe("stage01", () => {
  it("spec の盤面寸法と一致する", () => {
    expect(stage01.map).toHaveLength(STAGE_ROWS);
    for (const row of stage01.map) expect(row).toHaveLength(STAGE_COLS);
  });
});

describe("toWorldSpec", () => {
  const spec = toWorldSpec(stage01);
  const w = createWorld(spec, 1);

  it("壁のグリッドが盤面全体を覆う", () => {
    expect(spec.walls).toHaveLength(STAGE_COLS * STAGE_ROWS);
  });

  it("外周が壁である", () => {
    for (let col = 0; col < STAGE_COLS; col++) {
      expect(isWall(w, col, 0)).toBe(true);
      expect(isWall(w, col, STAGE_ROWS - 1)).toBe(true);
    }
    for (let row = 0; row < STAGE_ROWS; row++) {
      expect(isWall(w, 0, row)).toBe(true);
      expect(isWall(w, STAGE_COLS - 1, row)).toBe(true);
    }
  });

  it("盤面の外は壁として扱う", () => {
    expect(isWall(w, -1, 5)).toBe(true);
    expect(isWall(w, STAGE_COLS, 5)).toBe(true);
  });

  it("自機1台と敵2台がセルの中心に配置される", () => {
    expect(w.tanks.map((t) => t.kind)).toEqual([
      "stationary",
      "stationary",
      "player",
    ]);
    for (const t of w.tanks) {
      expect(t.pos.x % CELL_SIZE).toBeCloseTo(CELL_SIZE / 2);
      expect(t.pos.y % CELL_SIZE).toBeCloseTo(CELL_SIZE / 2);
      expect(isWall(w, Math.floor(t.pos.x), Math.floor(t.pos.y))).toBe(false);
    }
  });

  it("戦車の id が重複しない", () => {
    expect(new Set(w.tanks.map((t) => t.id)).size).toBe(w.tanks.length);
  });
});
