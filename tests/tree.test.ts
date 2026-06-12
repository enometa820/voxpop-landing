import { test, expect } from "vitest";
import { treeLevelFromPoints, TREE_LABELS } from "../src/app/lib/tree";

test("6단계 임계 경계값", () => {
  expect(treeLevelFromPoints(0)).toBe(1);   // 씨앗
  expect(treeLevelFromPoints(1)).toBe(2);   // 새싹 하한
  expect(treeLevelFromPoints(4)).toBe(2);   // 새싹 상한
  expect(treeLevelFromPoints(5)).toBe(3);   // 줄기 하한
  expect(treeLevelFromPoints(12)).toBe(3);  // 줄기 상한
  expect(treeLevelFromPoints(13)).toBe(4);  // 앙상한 하한
  expect(treeLevelFromPoints(24)).toBe(4);  // 앙상한 상한
  expect(treeLevelFromPoints(25)).toBe(5);  // 푸른 하한
  expect(treeLevelFromPoints(49)).toBe(5);  // 푸른 상한
  expect(treeLevelFromPoints(50)).toBe(6);  // 열매
  expect(treeLevelFromPoints(9999)).toBe(6);
});

test("비정상 입력은 씨앗(1)로 안전 처리", () => {
  expect(treeLevelFromPoints(undefined)).toBe(1);
  expect(treeLevelFromPoints(-5)).toBe(1);
  expect(treeLevelFromPoints(NaN)).toBe(1);
});

test("라벨 6종", () => {
  expect(TREE_LABELS[1]).toBe("씨앗");
  expect(TREE_LABELS[6]).toBe("열매");
  expect(Object.keys(TREE_LABELS)).toHaveLength(6);
});
