import { test, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const read = (p: string) =>
  readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8");

const files = {
  mono: read("../src/app/components/terminal/MonoLabel.tsx"),
  badge: read("../src/app/components/retro/RetroBadge.tsx"),
  chip: read("../src/app/components/retro/RetroChip.tsx"),
};

test("세 컴포넌트에 whitespace-nowrap 포함(세로 쪼개짐 방지)", () => {
  for (const src of Object.values(files)) {
    expect(src).toContain("whitespace-nowrap");
  }
});

test("세 컴포넌트에 임의 px(text-[NNpx]) 없음", () => {
  for (const src of Object.values(files)) {
    expect(src).not.toMatch(/text-\[\d+px\]/);
  }
});
