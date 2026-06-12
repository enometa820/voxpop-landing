import { test, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8");
const btn = read("../src/app/components/retro/RetroButton.tsx");
const css = read("../src/styles/retro.css");

test("RetroButton에 cta prop(강조 = body-lg 굵게)", () => {
  expect(btn).toContain("cta");
  expect(btn).toContain("text-body-lg");
});

test("retro.css 비활성 버튼 안내 스타일 존재(opacity만으로 죽이지 않음)", () => {
  expect(css).toContain(".retro-btn--cta");
});
