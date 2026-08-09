import {
  type Object3D,
  PerspectiveCamera,
  Plane,
  Raycaster,
  Vector2,
  Vector3,
} from "three";
import { CELL_SIZE } from "../core/constants.ts";
import { cos, sin } from "../core/math/trig.ts";
import type { Vec2 } from "../core/types.ts";

// ロジックの2D {x, y} と3D座標の変換を行うのはこのファイルだけ（docs/architecture.md 3.）。
// 対応は {x, y} → Vector3(x, height, y)。3Dの y は高さであり、ロジックには存在しない。

/** カメラの伏角（rad）。真上に近いほど位置が読みやすく、寝かせるほど立体感が出る。 */
const TILT = Math.PI / 3;
const FOV_DEG = 45;
/** 盤面の隅と画面の縁のあいだに残す余白。 */
const MARGIN = 1.04;

const projectScratch = new Vector3();
const GROUND = new Plane(new Vector3(0, 1, 0), 0);
const raycaster = new Raycaster();
const ndcScratch = new Vector2();
const hitScratch = new Vector3();

export function placeAt(obj: Object3D, pos: Vec2, height: number): void {
  obj.position.set(pos.x, height, pos.y);
}

/** ロジックの角（rad, +x が 0）を向く。+X を正面とするメッシュが対象。 */
export function setHeading(obj: Object3D, angle: number): void {
  // y 軸まわりの回転は +X を (cos θ, 0, -sin θ) へ送る。z がロジックの y なので符号が逆になる
  obj.rotation.y = -angle;
}

export function createStageCamera(
  cols: number,
  rows: number,
  wallHeight: number,
  aspect: number,
): PerspectiveCamera {
  const camera = new PerspectiveCamera(FOV_DEG, aspect, 0.1, 200);
  frameStage(camera, cols, rows, wallHeight);
  return camera;
}

/** 盤面全体が画面に収まる位置へカメラを置く。アスペクト比を変えたら呼び直す。 */
export function frameStage(
  camera: PerspectiveCamera,
  cols: number,
  rows: number,
  wallHeight: number,
): void {
  const width = cols * CELL_SIZE;
  const depth = rows * CELL_SIZE;
  const center = { x: width / 2, y: depth / 2 };
  const corners = boxCorners(width, depth, wallHeight);

  // 伏せたカメラでは手前と奥で見かけの大きさが変わり、距離から画面上の広がりを
  // 式で求めても外れる。実際に投影して、はみ出したぶんだけ引く
  let dist = Math.max(width, depth);
  for (let i = 0; i < 5; i++) {
    aimAt(camera, center, dist);
    dist *= overflow(camera, corners) * MARGIN;
  }
  aimAt(camera, center, dist);
}

function aimAt(camera: PerspectiveCamera, center: Vec2, dist: number): void {
  camera.position.set(
    center.x,
    dist * sin(TILT),
    center.y + dist * cos(TILT), // 手前（ロジックの y が大きい側）から見下ろす
  );
  camera.lookAt(center.x, 0, center.y);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
}

/** 盤面の隅が画面の縁からどれだけはみ出しているか。1 なら縁にちょうど接する。 */
function overflow(camera: PerspectiveCamera, corners: Vector3[]): number {
  let worst = 0;
  for (const corner of corners) {
    const ndc = projectScratch.copy(corner).project(camera);
    worst = Math.max(worst, Math.abs(ndc.x), Math.abs(ndc.y));
  }
  return worst;
}

/** カーソルの画面位置（NDC）を、床平面上のロジック座標へ戻す。 */
export function groundAt(camera: PerspectiveCamera, ndc: Vec2): Vec2 {
  raycaster.setFromCamera(ndcScratch.set(ndc.x, ndc.y), camera);
  raycaster.ray.intersectPlane(GROUND, hitScratch);
  return { x: hitScratch.x, y: hitScratch.z };
}

/** 盤面を囲む直方体の8隅。壁の高さぶん、床の四隅だけでは足りない。 */
function boxCorners(width: number, depth: number, height: number): Vector3[] {
  const corners: Vector3[] = [];
  for (const x of [0, width]) {
    for (const y of [0, height]) {
      for (const z of [0, depth]) corners.push(new Vector3(x, y, z));
    }
  }
  return corners;
}
