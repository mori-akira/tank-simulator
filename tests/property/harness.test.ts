import fc from "fast-check";
import { expect, it } from "vitest";

// fast-check が実際に走ることを確かめるための足場。不変条件のテスト（#6）で置き換える。
it("runs fast-check", () => {
  fc.assert(
    fc.property(fc.integer(), fc.integer(), (a, b) => {
      expect(a + b).toBe(b + a);
    }),
  );
});
