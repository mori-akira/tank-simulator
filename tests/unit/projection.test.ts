import { Object3D, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import {
  CELL_SIZE,
  MUZZLE_OFFSET,
  STAGE_COLS,
  STAGE_ROWS,
} from "../../src/core/constants.ts";
import { cos, sin } from "../../src/core/math/trig.ts";
import {
  createStageCamera,
  groundAt,
  placeAt,
  setHeading,
} from "../../src/render/projection.ts";
import { WALL_HEIGHT } from "../../src/render/view.ts";

// 2D→3D の変換点は「変更禁止の土台」（docs/architecture.md 3.）だが、
// three の計算だけで完結するのでブラウザなしに確かめられる。目視に頼らない。

const ANGLES = [0, 0.5, Math.PI / 2, 2.5, Math.PI, -0.5, -2.0];

/** 盤面を囲む直方体の8隅。カメラの収まりはここで決まる。実物と同じ寸法で組む。 */
const CORNERS = [0, STAGE_COLS * CELL_SIZE].flatMap((x) =>
  [0, WALL_HEIGHT].flatMap((y) =>
    [0, STAGE_ROWS * CELL_SIZE].map((z) => new Vector3(x, y, z)),
  ),
);

describe("placeAt", () => {
  it("ロジックの y は3Dの z へ、高さは3Dの y へ写る", () => {
    const obj = new Object3D();
    placeAt(obj, { x: 3, y: 11 }, 0.4);
    expect([obj.position.x, obj.position.y, obj.position.z]).toEqual([
      3, 0.4, 11,
    ]);
  });
});

describe("setHeading", () => {
  // 砲身の先端は砲口（弾の湧く位置）に一致していなければならない。
  // 湧く位置は src/core/bullet.ts が (cos θ, sin θ) × MUZZLE_OFFSET で決めている
  it.each(ANGLES)("角 %f を向けると、砲身の先端が砲口に重なる", (angle) => {
    const obj = new Object3D();
    setHeading(obj, angle);
    obj.updateMatrixWorld();

    const tip = obj.localToWorld(new Vector3(MUZZLE_OFFSET, 0, 0));

    expect(tip.x).toBeCloseTo(cos(angle) * MUZZLE_OFFSET);
    expect(tip.z).toBeCloseTo(sin(angle) * MUZZLE_OFFSET);
    expect(tip.y).toBeCloseTo(0);
  });
});

describe("frameStage", () => {
  // 極端に縦長・横長でも切れないこと。ウィンドウの形は選べない
  it.each([0.5, 1, 16 / 9, 21 / 9, 3])(
    "アスペクト比 %f で盤面が画面に収まり、かつ画面を埋める",
    (aspect) => {
      const camera = createStageCamera(
        STAGE_COLS,
        STAGE_ROWS,
        WALL_HEIGHT,
        aspect,
      );

      const worst = Math.max(
        ...CORNERS.map((corner) => {
          const ndc = corner.clone().project(camera);
          return Math.max(Math.abs(ndc.x), Math.abs(ndc.y));
        }),
      );

      // 1 を超えると切れる。小さすぎれば、ただ遠くから撮っているだけになる
      expect(worst).toBeLessThanOrEqual(1);
      expect(worst).toBeGreaterThan(0.9);
    },
  );
});

describe("groundAt", () => {
  // カーソルの狙点はこの逆変換で決まる。ずれると砲塔がカーソルを追わない
  it.each([
    { x: 0.5, y: 0.5 },
    { x: 11.5, y: 11.5 },
    { x: 23.5, y: 15.5 },
    { x: 7.3, y: 2.1 },
  ])("床の点 $x, $y は画面を往復しても戻ってくる", (point) => {
    const camera = createStageCamera(
      STAGE_COLS,
      STAGE_ROWS,
      WALL_HEIGHT,
      16 / 9,
    );
    const ndc = new Vector3(point.x, 0, point.y).project(camera);

    const back = groundAt(camera, { x: ndc.x, y: ndc.y });

    expect(back.x).toBeCloseTo(point.x);
    expect(back.y).toBeCloseTo(point.y);
  });
});
