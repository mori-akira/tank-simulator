import { CELL_SIZE } from "../core/constants.ts";
import type { WorldSpec } from "../core/world.ts";
import type { Stage } from "./schema.ts";

export function toWorldSpec(stage: Stage): WorldSpec {
  const rows = stage.map.length;
  const cols = stage.map[0]?.length ?? 0;
  const walls: boolean[] = [];
  const spawns: WorldSpec["spawns"] = [];

  for (let row = 0; row < rows; row++) {
    const line = stage.map[row] as string;
    for (let col = 0; col < cols; col++) {
      const ch = line[col];
      walls.push(ch === "#");
      if (ch === "P" || ch === "E") {
        spawns.push({
          kind: ch === "P" ? "player" : "stationary",
          x: (col + 0.5) * CELL_SIZE,
          y: (row + 0.5) * CELL_SIZE,
        });
      }
    }
  }

  return { cols, rows, walls, spawns };
}
