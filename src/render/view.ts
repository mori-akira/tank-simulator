import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  Mesh,
  MeshLambertMaterial,
  MeshPhongMaterial,
  PlaneGeometry,
  Scene,
  SphereGeometry,
  WebGLRenderer,
} from "three";
import { BULLET_TYPES, CELL_SIZE } from "../core/constants.ts";
import { isWall } from "../core/grid.ts";
import type { Vec2, WorldState } from "../core/types.ts";
import {
  BACKGROUND,
  BULLET,
  BULLET_HIGHLIGHT,
  FLOOR,
  WALL,
  WALL_TOP,
} from "./colors.ts";
import {
  createStageCamera,
  frameStage,
  groundAt,
  placeAt,
  setHeading,
} from "./projection.ts";
import { createTankObject, TURRET_HEIGHT } from "./tank.ts";

export const WALL_HEIGHT = 0.9;

export type View = {
  /** 世界の現在の状態を描く。参照は createView が保持している。 */
  render(): void;
  resize(width: number, height: number): void;
  /** カーソルの画面位置（NDC）が指す盤面上の位置。 */
  groundAt(ndc: Vec2): Vec2;
};

export function createView(canvas: HTMLCanvasElement, world: WorldState): View {
  const renderer = new WebGLRenderer({ canvas, antialias: true });
  const scene = new Scene();
  scene.background = new Color(BACKGROUND);
  const camera = createStageCamera(
    world.cols,
    world.rows,
    WALL_HEIGHT,
    canvas.clientWidth / canvas.clientHeight,
  );

  scene.add(new AmbientLight(0xffffff, 1.4));
  const sun = new DirectionalLight(0xffffff, 2.0);
  sun.position.set(-1, 3, 1.5);
  scene.add(sun);

  scene.add(createFloor(world));
  for (const wall of createWalls(world)) scene.add(wall);

  // 戦車は増えも減りもしない。生成は1回で済み、毎フレームやるのは位置と向きの反映だけ
  const tanks = world.tanks.map((tank) => ({
    tank,
    obj: createTankObject(tank.kind),
  }));
  for (const { obj } of tanks) scene.add(obj.root);

  // 弾は消えては湧く。使い回して、飛んでいるぶんだけ見せる
  const bulletGeometry = new SphereGeometry(1, 20, 14);
  // 光を受けない材質だと全面が同じ色になり、球なのに平らな円に見える。
  // ハイライトの出る材質にして、小さくても球だと分かるようにする
  const bulletMaterial = new MeshPhongMaterial({
    color: BULLET,
    specular: BULLET_HIGHLIGHT,
    shininess: 60,
  });
  const bulletPool: Mesh[] = [];
  const bulletAt = (index: number): Mesh => {
    const pooled = bulletPool[index];
    if (pooled) return pooled;
    const mesh = new Mesh(bulletGeometry, bulletMaterial);
    bulletPool.push(mesh);
    scene.add(mesh);
    return mesh;
  };

  return {
    render() {
      for (const { tank, obj } of tanks) {
        obj.root.visible = tank.alive;
        placeAt(obj.root, tank.pos, 0);
        setHeading(obj.hull, tank.hull);
        setHeading(obj.turret, tank.turret);
      }

      world.bullets.forEach((bullet, i) => {
        const mesh = bulletAt(i);
        mesh.scale.setScalar(BULLET_TYPES[bullet.type].radius);
        // 砲身と同じ高さを飛ぶ。壁の上端より低いので、壁を越えて見えることはない
        placeAt(mesh, bullet.pos, TURRET_HEIGHT);
      });
      for (const [i, mesh] of bulletPool.entries()) {
        mesh.visible = i < world.bullets.length;
      }

      renderer.render(scene, camera);
    },

    resize(width, height) {
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      frameStage(camera, world.cols, world.rows, WALL_HEIGHT);
    },

    groundAt: (ndc) => groundAt(camera, ndc),
  };
}

function createFloor(world: WorldState): Mesh {
  const floor = new Mesh(
    new PlaneGeometry(world.cols * CELL_SIZE, world.rows * CELL_SIZE),
    new MeshLambertMaterial({ color: FLOOR }),
  );
  floor.rotation.x = -Math.PI / 2;
  placeAt(
    floor,
    { x: (world.cols * CELL_SIZE) / 2, y: (world.rows * CELL_SIZE) / 2 },
    0,
  );
  return floor;
}

function createWalls(world: WorldState): Mesh[] {
  const geometry = new BoxGeometry(CELL_SIZE, WALL_HEIGHT, CELL_SIZE);
  const side = new MeshLambertMaterial({ color: WALL });
  const top = new MeshLambertMaterial({ color: WALL_TOP });
  // BoxGeometry の面順は +x, -x, +y, -y, +z, -z。上面だけ明るくして高さを読ませる
  const materials = [side, side, top, side, side, side];

  const walls: Mesh[] = [];
  for (let row = 0; row < world.rows; row++) {
    for (let col = 0; col < world.cols; col++) {
      if (!isWall(world, col, row)) continue;
      const mesh = new Mesh(geometry, materials);
      placeAt(
        mesh,
        { x: (col + 0.5) * CELL_SIZE, y: (row + 0.5) * CELL_SIZE },
        WALL_HEIGHT / 2,
      );
      walls.push(mesh);
    }
  }
  return walls;
}
