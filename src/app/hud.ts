import type { Outcome } from "../core/types.ts";

// HUD は素の DOM（docs/adr/0003）。M1 では開始待ちと勝敗だけを出す。

/** 待機中はまだ世界が進んでいない状態であり、core の Outcome には現れない。 */
export type Phase = "waiting" | Outcome;

const LABELS: Record<Phase, string> = {
  waiting: "CLICK TO START",
  playing: "",
  cleared: "STAGE CLEAR",
  failed: "GAME OVER",
};

export function createHud(root: HTMLElement): (phase: Phase) => void {
  const el = document.createElement("div");
  el.className = "hud";
  root.appendChild(el);

  return (phase) => {
    el.textContent = LABELS[phase];
    // 点滅は待機中だけ。決着の表示は点滅させない
    el.classList.toggle("hud--blink", phase === "waiting");
  };
}
