import { test, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const css = readFileSync(
  fileURLToPath(new URL("../src/styles/theme.css", import.meta.url)),
  "utf8",
);

test("타입 스케일 7토큰이 :root에 정의됨", () => {
  for (const t of [
    "--text-caption",
    "--text-body",
    "--text-body-lg",
    "--text-title-sm",
    "--text-title",
    "--text-title-lg",
    "--text-display",
  ]) {
    expect(css).toContain(`${t}:`);
  }
});

test("옛 undefined 토큰(--text-base/lg/xl/2xl)이 정의되거나 base에서 미참조", () => {
  expect(css).not.toMatch(/font-size:\s*var\(--text-2xl\)/);
  expect(css).not.toMatch(/font-size:\s*var\(--text-xl\)/);
});

test("@theme inline에 text 유틸 등록(text-caption 등 생성 근거)", () => {
  expect(css).toContain("--text-caption:");
  expect(css).toContain("--text-display:");
});
