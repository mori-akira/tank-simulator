import { enemyInputs } from "../ai/enemy.ts";
import { RNG_SEED } from "../core/constants.ts";
import { createRng } from "../core/math/rng.ts";
import type { Tank } from "../core/types.ts";
import { createWorld, stepWorld } from "../core/world.ts";
import { createControls, toTankInput } from "../input/controls.ts";
import { toWorldSpec } from "../levels/build.ts";
import { stage01 } from "../levels/stage-01.ts";
import { createView } from "../render/view.ts";
import { createHud } from "./hud.ts";
import { advance, createLoop } from "./loop.ts";

const app = document.getElementById("app") as HTMLElement;
const canvas = document.getElementById("scene") as HTMLCanvasElement;

const world = createWorld(toWorldSpec(stage01));
const player = world.tanks.find((t) => t.kind === "player") as Tank;
const rng = createRng(RNG_SEED);

const view = createView(canvas, world);
const controls = createControls(canvas);
const hud = createHud(app);
const loop = createLoop();

// ステージの配置を見てから始められるよう、最初の左クリックまで世界を止めておく
let started = false;
// 開始のクリックは発射を兼ねない。押しっぱなしのまま始まると、意図しない1発目が出る
let startClickHeld = false;

canvas.addEventListener("pointerdown", (e) => {
  if (e.button !== 0 || started) return;
  started = true;
  startClickHeld = true;
});
// ボタンが離れたことは pointerup で受ける。step() の中で controls.fire を見て下ろすと、
// 離してから次のステップが走る前に押し直した1発が捨てられる
window.addEventListener("pointerup", (e) => {
  if (e.button === 0) startClickHeld = false;
});

function step(): void {
  const inputs = enemyInputs(world, rng);
  if (player.alive) {
    const cursor = view.groundAt(controls.pointerNdc);
    const input = toTankInput(controls, player.pos, cursor);
    if (startClickHeld) input.fire = false;
    inputs.set(player.id, input);
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

  // 開始前と決着後はシミュレーションを止める。描画は続けるので盤面は見えている
  if (started && world.outcome === "playing") advance(loop, elapsed, step);
  view.render();
  hud(started ? world.outcome : "waiting");
});
