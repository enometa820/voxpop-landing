import {
  makeGrid,
  fillEllipse,
  fillRect,
  line,
  outline,
  type Grid,
} from "./pixelGrid";
import { type TreeLevel, TREE_LABELS } from "../../lib/tree";

/**
 * High-res pixel-art store tree mascot — 68×76 grid with layered shading.
 * 6 growth levels: 씨앗 → 새싹 → 줄기 → 앙상한 나무 → 푸른 나무 → 열매(최종).
 * Owner-only `health="wilting"` fades/droops — never dead.
 */

export type TreeHealth = "healthy" | "wilting";

const W = 68;
const H = 76;
const CX = 34;

const COLORS: Record<string, string> = {
  D: "#0c2417", // outline
  l: "#1b6b42", // leaf base
  L: "#3e8e63", // leaf light
  h: "#7fc39a", // leaf highlight
  B: "#62ad84", // bright speck
  m: "#155737", // leaf shadow
  n: "#0e3f28", // deep leaf shadow
  k: "#3a2f22", // trunk
  K: "#5a4a36", // trunk light
  t: "#27201780", // trunk shadow
  s: "#b2c8ab", // soil
  S: "#9bb394", // soil dark
  f: "#e0483a", // fruit base
  F: "#ff7a4d", // fruit highlight
  v: "#b8322a", // fruit shadow
};

type Blob = [number, number, number, number]; // cx, cy, rx, ry
type Branch = [number, number, number, number]; // x0,y0,x1,y1

type Spec = {
  trunkTop: number;
  trunkW: number;
  blobs: Blob[];
  branches: Branch[];
  coins: [number, number][];
};

const SPECS: Record<TreeLevel, Spec> = {
  1: {
    // 씨앗 — 흙 위로 막 튼 작은 싹
    trunkTop: 60,
    trunkW: 2,
    blobs: [[34, 58, 5, 3.6]],
    branches: [],
    coins: [],
  },
  2: {
    // 새싹
    trunkTop: 54,
    trunkW: 2,
    blobs: [
      [26, 52, 7.2, 5.4],
      [42, 52, 7.2, 5.4],
      [34, 48, 6, 4.8],
    ],
    branches: [],
    coins: [],
  },
  3: {
    // 줄기
    trunkTop: 38,
    trunkW: 2,
    blobs: [
      [34, 32, 10, 8],
      [22, 38, 8, 7],
      [46, 38, 8, 7],
    ],
    branches: [],
    coins: [],
  },
  4: {
    // 앙상한 나무
    trunkTop: 34,
    trunkW: 4,
    blobs: [
      [34, 26, 14, 11],
      [20, 32, 10, 9],
      [48, 32, 10, 9],
      [34, 36, 12, 8],
    ],
    branches: [
      [34, 44, 20, 34],
      [34, 44, 48, 34],
    ],
    coins: [],
  },
  5: {
    // 푸른 나무
    trunkTop: 30,
    trunkW: 6,
    blobs: [
      [34, 22, 18, 14],
      [16, 30, 12, 12],
      [52, 30, 12, 12],
      [34, 34, 16, 11],
      [24, 18, 10, 9],
      [44, 18, 10, 9],
    ],
    branches: [
      [34, 48, 18, 34],
      [34, 48, 50, 34],
    ],
    coins: [],
  },
  6: {
    // 열매
    trunkTop: 26,
    trunkW: 8,
    blobs: [
      [34, 20, 20, 16],
      [14, 28, 14, 13],
      [54, 28, 14, 13],
      [34, 32, 18, 12],
      [22, 16, 12, 10],
      [46, 16, 12, 10],
    ],
    branches: [
      [34, 52, 16, 36],
      [34, 52, 52, 36],
      [34, 56, 26, 44],
      [34, 56, 42, 44],
    ],
    coins: [
      [16, 36],
      [52, 36],
      [24, 44],
      [44, 44],
      [34, 48],
      [12, 26],
      [56, 26],
    ],
  },
};

const LABELS = TREE_LABELS;

const SPARKLES: Record<TreeLevel, [number, number][]> = {
  1: [],
  2: [],
  3: [],
  4: [],
  5: [],
  6: [
    [8, 12],
    [60, 18],
    [34, 4],
    [4, 32],
  ],
};

function buildTree(level: TreeLevel): Grid {
  const g = makeGrid(W, H);
  const spec = SPECS[level];
  const groundY = H - 9;

  // trunk
  const halfL = Math.floor(spec.trunkW / 2);
  const halfR = Math.ceil(spec.trunkW / 2) - 1;
  fillRect(g, CX - halfL, spec.trunkTop, CX + halfR, groundY, "k");
  // light edge (left) + shadow edge (right)
  fillRect(g, CX - halfL, spec.trunkTop, CX - halfL, groundY, "K", "k");
  if (spec.trunkW >= 4) fillRect(g, CX + halfR, spec.trunkTop, CX + halfR, groundY, "t", "k");

  // branches
  spec.branches.forEach(([x0, y0, x1, y1]) =>
    line(g, x0, y0, x1, y1, "k", level >= 4 ? 3 : 2),
  );

  // canopy fill
  spec.blobs.forEach(([cx, cy, rx, ry]) => fillEllipse(g, cx, cy, rx, ry, "l"));

  // layered shading — light upper-left, two highlight tiers + two shadow tiers
  spec.blobs.forEach(([cx, cy, rx, ry]) => {
    fillEllipse(g, cx - rx * 0.24, cy - ry * 0.28, rx * 0.72, ry * 0.72, "L", "l");
    fillEllipse(g, cx - rx * 0.4, cy - ry * 0.44, rx * 0.4, ry * 0.4, "h", "L");
    fillEllipse(g, cx - rx * 0.46, cy - ry * 0.5, rx * 0.18, ry * 0.18, "B", "h");
    fillEllipse(g, cx + rx * 0.32, cy + ry * 0.34, rx * 0.66, ry * 0.66, "m", "l");
    fillEllipse(g, cx + rx * 0.46, cy + ry * 0.48, rx * 0.32, ry * 0.32, "n", "m");
  });

  // LV6 fruits (빨강·주황 열매)
  spec.coins.forEach(([cx, cy]) => {
    fillEllipse(g, cx, cy, 3.4, 3.4, "f");
    fillEllipse(g, cx - 1, cy - 1, 1.8, 1.8, "F", "f");
    fillEllipse(g, cx + 1.4, cy + 1.4, 1.6, 1.6, "v", "f");
  });

  // outline silhouette
  outline(g, "D");

  // soil mound (after outline so it reads as ground)
  for (let x = CX - 14; x <= CX + 14; x++) {
    const edge = Math.abs(x - CX);
    const top = groundY + 1 + (edge > 10 ? 2 : edge > 6 ? 1 : 0);
    for (let y = top; y < H; y++) {
      setPx(g, x, y, (x + y) % 3 === 0 ? "S" : "s");
    }
  }
  return g;
}

function setPx(g: Grid, x: number, y: number, c: string, only?: string) {
  const xi = Math.round(x);
  const yi = Math.round(y);
  if (yi < 0 || yi >= g.length || xi < 0 || xi >= g[0].length) return;
  if (only && !only.includes(g[yi][xi])) return;
  g[yi][xi] = c;
}

const CACHE = {} as Record<TreeLevel, Grid>;
function treeGrid(level: TreeLevel) {
  return (CACHE[level] ??= buildTree(level));
}

export function PixelTree({
  level = 1,
  health = "healthy",
  cell = 4,
  className = "",
  showLabel = false,
}: {
  level?: TreeLevel;
  health?: TreeHealth;
  cell?: number;
  className?: string;
  showLabel?: boolean;
}) {
  const g = treeGrid(level);
  const wilting = health === "wilting";

  return (
    <div className={`inline-flex flex-col items-center gap-2 ${className}`}>
      <svg
        viewBox={`0 0 ${W * cell} ${H * cell}`}
        width="100%"
        style={{
          shapeRendering: "crispEdges",
          imageRendering: "pixelated",
          maxWidth: W * cell,
          opacity: wilting ? 0.8 : 1,
          transform: wilting ? "skewX(-3deg) translateY(2px)" : undefined,
          transition: "opacity 0.35s, transform 0.35s",
        }}
        role="img"
        aria-label={`매장 나무 LV.${level} ${LABELS[level]}${
          wilting ? " (시듦)" : ""
        }`}
      >
        {g.flatMap((row, y) =>
          row.map((ch, x) => {
            if (ch === ".") return null;
            let fill = COLORS[ch];
            if (wilting && "lLhmnB".includes(ch)) fill = "#86a085";
            return (
              <rect
                key={`${x}-${y}`}
                x={x * cell}
                y={y * cell}
                width={cell}
                height={cell}
                fill={fill}
              />
            );
          }),
        )}
        {SPARKLES[level].map(([x, y], i) => (
          <text
            key={`sp-${i}`}
            x={x * cell}
            y={y * cell + cell * 1.6}
            fontSize={cell * 3.5}
            fill="#ffe14d"
            fontFamily="monospace"
          >
            ✦
          </text>
        ))}
      </svg>
      {showLabel && (
        <span className="font-mono text-[11px] text-muted-foreground">
          LV.{level} · {LABELS[level]}
        </span>
      )}
    </div>
  );
}
