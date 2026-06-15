import { test, expect } from "vitest";
import { TREE_FOOT_INSET, CAT_FOOT_INSET } from "../src/app/lib/mascotAnchors";

test("나무 6단계 앵커, 모두 0~0.5 범위", () => {
  for (let lv = 1; lv <= 6; lv++) {
    expect(typeof TREE_FOOT_INSET[lv]).toBe("number");
    expect(TREE_FOOT_INSET[lv]).toBeGreaterThanOrEqual(0);
    expect(TREE_FOOT_INSET[lv]).toBeLessThan(0.5);
  }
});

test("고양이 15포즈 앵커 존재", () => {
  expect(Object.keys(CAT_FOOT_INSET)).toHaveLength(15);
  expect(CAT_FOOT_INSET["default"]).toBeGreaterThanOrEqual(0); // 앉음 정면(기본)
});
