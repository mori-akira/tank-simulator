import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshLambertMaterial,
} from "three";
import { MUZZLE_OFFSET, TANK_RADIUS } from "../core/constants.ts";
import type { TankKind } from "../core/types.ts";
import { METAL, TANK_COLORS } from "./colors.ts";

const DIAMETER = TANK_RADIUS * 2;
const HULL_HEIGHT = 0.3;
/** 砲塔の高さ。弾はこの高さを飛ぶ。 */
export const TURRET_HEIGHT = 0.4;

const hullGeometry = new BoxGeometry(DIAMETER, HULL_HEIGHT, DIAMETER * 0.8);
const domeGeometry = new CylinderGeometry(0.22, 0.24, 0.18, 16);
// 砲身の先端が砲口（弾の湧く位置）に一致する
const barrelGeometry = new BoxGeometry(MUZZLE_OFFSET, 0.1, 0.1);
const metalMaterial = new MeshLambertMaterial({ color: METAL });

/** 車体と砲塔は独立に回るため、別々の Object3D として持つ。 */
export type TankObject = { root: Group; hull: Mesh; turret: Group };

export function createTankObject(kind: TankKind): TankObject {
  const body = new MeshLambertMaterial({ color: TANK_COLORS[kind] });

  const hull = new Mesh(hullGeometry, body);
  hull.position.y = HULL_HEIGHT / 2;

  const turret = new Group();
  turret.position.y = TURRET_HEIGHT;
  turret.add(new Mesh(domeGeometry, body));

  const barrel = new Mesh(barrelGeometry, metalMaterial);
  barrel.position.x = MUZZLE_OFFSET / 2;
  turret.add(barrel);

  const root = new Group();
  root.add(hull, turret);
  return { root, hull, turret };
}
