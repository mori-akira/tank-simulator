import type { Outcome } from "../core/types.ts";

// HUD は素の DOM（docs/adr/0003）。M1 では勝敗だけを出す。

const LABELS: Record<Outcome, string> = {
  playing: "",
  cleared: "STAGE CLEAR",
  failed: "GAME OVER",
};

export function createHud(root: HTMLElement): (outcome: Outcome) => void {
  const el = document.createElement("div");
  el.className = "hud";
  root.appendChild(el);

  return (outcome) => {
    el.textContent = LABELS[outcome];
  };
}
