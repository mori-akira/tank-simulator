import { expect, test } from "@playwright/test";

// ピクセル完全一致の比較はしない。画像は人間と AI が目視するための成果物
// （docs/coding-standards.md）。「描けているか」は画像を見て判断する。ここが
// 表明できるのは、起動して操作しても例外が出ないことまで。

test("ブラウザで起動し、操作しても例外が出ない", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/");
  await expect(page.locator("#scene")).toBeVisible();

  // 弾が飛んでいる場面を撮る。左上へ砲塔を向けて撃ちながら、左へ走る
  await page.mouse.move(420, 240);
  await page.mouse.down();
  await page.keyboard.down("KeyA");
  await page.waitForTimeout(400);
  await page.keyboard.up("KeyA");
  await page.mouse.up();

  await page.screenshot({ path: "shots/screen.png" });
  expect(errors).toEqual([]);
});
