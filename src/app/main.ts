import { enemyInputs } from "../ai/enemy.ts";
import { createRng } from "../core/math/rng.ts";
import type { Tank } from "../core/types.ts";
import { createWorld, stepWorld } from "../core/world.ts";
import { createControls, toTankInput } from "../input/controls.ts";
import { toWorldSpec } from "../levels/build.ts";
import { stage01 } from "../levels/stage-01.ts";
import { createView } from "../render/view.ts";
import { createHud } from "./hud.ts";
import { advance, createLoop } from "./loop.ts";

/** 敵の照準誤差に使う seed。固定にしておくと、見えた不具合をリロードで再現できる。 */
const SEED = 1;

const app = document.getElementById("app") as HTMLElement;
const canvas = document.getElementById("scene") as HTMLCanvasElement;

const world = createWorld(toWorldSpec(stage01));
const player = world.tanks.find((t) => t.kind === "player") as Tank;
const rng = createRng(SEED);

const view = createView(canvas, world);
const controls = createControls(canvas);
const hud = createHud(app);
const loop = createLoop();

function step(): void {
  const inputs = enemyInputs(world, rng);
  if (player.alive) {
    const cursor = view.groundAt(controls.pointerNdc);
    inputs.set(player.id, toTankInput(controls, player.pos, cursor));
  }
  stepWorld(world, inputs);
}

const resize = () => view.resize(canvas.clientWidth, canvas.clientHeight);
window.addEventListener("resize", resize);
resize();

let last = performance.now();
requestAnimationFrame(function frame(now) {
  requestAnimationFrame(frame);
  const elapsed = (now - last) / 1000;
  last = now;

  // 決着したらシミュレーションを止める。描画は続けるので画面は消えない
  if (world.outcome === "playing") advance(loop, elapsed, step);
  view.render();
  hud(world.outcome);
});
