import { expect, test } from "@playwright/test";

// ピクセル完全一致の比較はしない。画像は人間と AI が目視するための成果物
// （docs/coding-standards.md）。

// 「描けているか」は画像を見て判断する。ここが表明できるのは、起動して例外が
// 出ないことまで。
test("ブラウザで起動し、例外を出さずにスクリーンショットが取れる", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/");
  await expect(page.locator("#scene")).toBeVisible();

  await page.screenshot({ path: "shots/screen.png" });
  expect(errors).toEqual([]);
});
