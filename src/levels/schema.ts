import { z } from "zod";

/** マップ1文字の意味。`#` 壁 / `.` 床 / `P` 自機の初期位置 / `E` 敵の初期位置。 */
const CELL_CHARS = /^[#.PE]+$/;

const countChar = (map: string[], ch: string) =>
  map.reduce((n, row) => n + [...row].filter((c) => c === ch).length, 0);

export const stageSchema = z
  .object({
    name: z.string().min(1),
    map: z.array(z.string().regex(CELL_CHARS)).min(1),
  })
  .refine((s) => new Set(s.map.map((row) => row.length)).size === 1, {
    message: "map の全行は同じ長さでなければならない",
  })
  .refine((s) => countChar(s.map, "P") === 1, {
    message: "自機の初期位置 P はちょうど1つ",
  })
  .refine((s) => countChar(s.map, "E") >= 1, {
    message: "敵の初期位置 E は1つ以上",
  });

export type Stage = z.infer<typeof stageSchema>;
