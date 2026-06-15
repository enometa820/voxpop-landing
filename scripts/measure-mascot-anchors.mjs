import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const PUB = fileURLToPath(new URL("../public/mascot/", import.meta.url));

// 불투명 픽셀의 최하단 y (alpha > 16)
async function bottomOpaqueY(buf, W, H, x0, y0, x1, y1) {
  let bottom = y0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const a = buf[(y * W + x) * 4 + 3];
      if (a > 16) { bottom = y; break; }
    }
  }
  return bottom;
}

async function rawOf(filePath) {
  const img = sharp(filePath).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  return { data, W: info.width, H: info.height };
}

const trees = {};
for (let lv = 1; lv <= 6; lv++) {
  const { data, W, H } = await rawOf(path.join(PUB, `tree-${lv}.png`));
  const by = await bottomOpaqueY(data, W, H, 0, 0, W, H);
  trees[lv] = +((H - 1 - by) / H).toFixed(4);   // 밑면 여백 비율
}

// 고양이 개별 PNG (public/mascot/cats/cat-{expression}.png) — 표정명 키로 밑면 여백 비율 측정
const CAT_EXPRS = [
  "default", "happy", "loaf", "jump", "surprised", "love", "sad",
  "wave", "write", "think", "bow", "angry", "celebrate", "sleepy", "wink",
];
const cats = {};
for (const expr of CAT_EXPRS) {
  const { data, W, H } = await rawOf(path.join(PUB, "cats", `cat-${expr}.png`));
  const by = await bottomOpaqueY(data, W, H, 0, 0, W, H);
  cats[expr] = +((H - 1 - by) / H).toFixed(4);
}

const outPath = fileURLToPath(new URL("../src/app/lib/mascotAnchors.ts", import.meta.url));
const out = `// 자동 생성 — scripts/measure-mascot-anchors.mjs. 직접 수정 금지.
export const TREE_FOOT_INSET: Record<number, number> = ${JSON.stringify(trees, null, 2)};
export const CAT_FOOT_INSET: Record<string, number> = ${JSON.stringify(cats, null, 2)};
`;
writeFileSync(outPath, out);
console.log("trees", trees);
console.log("cats", cats);
