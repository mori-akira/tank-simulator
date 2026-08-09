import { createWorld } from "../core/world.ts";
import { toWorldSpec } from "../levels/build.ts";
import { stage01 } from "../levels/stage-01.ts";
import { createView } from "../render/view.ts";

// ステージを組み立てて描くところまで。ゲームループと入力は #28 で載せる。

const canvas = document.getElementById("scene") as HTMLCanvasElement;
const world = createWorld(toWorldSpec(stage01));
const view = createView(canvas, world);

const draw = () => {
  view.resize(canvas.clientWidth, canvas.clientHeight);
  view.render();
};

window.addEventListener("resize", draw);
draw();
