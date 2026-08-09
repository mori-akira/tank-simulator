import { expect, test } from "@playwright/test";

test("画面が表示され、スクリーンショットが取得できる", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toContainText("tank-simulator");
  await page.screenshot({ path: "shots/screen.png" });
});
