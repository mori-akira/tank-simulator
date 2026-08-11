import { defineConfig } from "vitest/config";

export default defineConfig({
  // GitHub Pages は https://<user>.github.io/<repo>/ の下に置かれる。絶対パスで
  // 出すとアセットが 404 になるので、index.html からの相対で参照させる。
  // dev では従来どおり / として扱われるため、Playwright の設定は変わらない
  base: "./",
  test: {
    include: ["tests/{unit,property,sim}/**/*.test.ts"],
  },
});
