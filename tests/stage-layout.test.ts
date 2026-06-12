import { test, expect } from "vitest";
import { footOffsetPx } from "../src/app/lib/stageLayout";

test("footInset 0이면 offset 0(발이 곧 밑면)", () => {
  expect(footOffsetPx(0, 80)).toBe(0);
});

test("footInset 비율 × 렌더크기 = 끌어내릴 px", () => {
  expect(footOffsetPx(0.1, 80)).toBeCloseTo(8);
  expect(footOffsetPx(0.25, 96)).toBeCloseTo(24);
});
