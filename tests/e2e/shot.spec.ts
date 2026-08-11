import { expect, test } from "@playwright/test";

// ピクセル完全一致の比較はしない。画像は人間と AI が目視するための成果物
// （docs/coding-standards.md）。「正しく描けているか」は画像を見て判断する。

test("ブラウザで1ステージを操作でき、勝敗が確定して画面に出る", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/");
  await expect(page.locator("#scene")).toBeVisible();
  const hud = page.locator(".hud");
  await expect(hud).toHaveText("CLICK TO START");

  // 遊んでいる場面を撮る。カーソルへ砲塔を向けて撃ちながら、左へ走る。
  // 最初のクリックは開始のためのもので発射しないので、押し直してから撃つ
  await page.mouse.move(420, 240);
  await page.mouse.click(420, 240);
  await expect(hud).toBeEmpty();
  await page.mouse.down();
  await page.keyboard.down("KeyA");
  await page.waitForTimeout(400);
  await page.keyboard.up("KeyA");
  await page.mouse.up();
  await page.screenshot({ path: "shots/screen.png" });

  // 決着はステージを作り直してから待つ。上で撃った弾が跳ね返って射線の通る敵を
  // 倒すと、残るのは壁の裏の敵だけになり、撃ってくる相手がいなくなる
  await page.goto("/");
  await page.mouse.click(640, 360);
  // 手を止めれば、静止型の敵は現在位置を直接狙うので決着する
  await expect(hud).toHaveText(/GAME OVER|STAGE CLEAR/, { timeout: 15000 });
  await expect(hud).toBeVisible();
  await page.screenshot({ path: "shots/outcome.png" });

  expect(errors).toEqual([]);
});
