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
 * High-res pixel-art store tree mascot, monotone green with shading.
 * 6 growth levels: 씨앗 → 새싹 → 줄기 → 앙상한 나무 → 푸른 나무 → 열매(최종).
 * Owner-only `health="wilting"` fades/droops — never dead.
 */

export type TreeHealth = "healthy" | "wilting";

const W = 34;
const H = 38;
const CX = 17;

const COLORS: Record<string, string> = {
  D: "#0c2417", // outline
  l: "#1b6b42", // leaf base
  L: "#3e8e63", // leaf light
  h: "#7fc39a", // leaf highlight
  m: "#155737", // leaf shadow
  k: "#3a2f22", // trunk
  K: "#5a4a36", // trunk light
  s: "#b2c8ab", // soil
  S: "#9bb394", // soil dark
  f: "#e0483a", // fruit base (빨강)
  F: "#ff7a4d", // fruit highlight (주황)
  v: "#b8322a", // fruit shadow
};

type Blob = [number, number, number, number]; // cx, cy, rx, ry
type Branch = [number, number, number, number]; // x0,y0,x1,y1

type Spec = {
  trunkTop: number;
  trunkW: number;
  blobs: Blob[];
  branches: Branch[];
  coins: [number, number][]; // LV6: 열매 위치
};

const SPECS: Record<TreeLevel, Spec> = {
  1: {
    // 씨앗 — 흙 위로 막 튼 작은 싹 끝
    trunkTop: 30,
    trunkW: 1,
    blobs: [[17, 29, 2.4, 1.8]],
    branches: [],
    coins: [],
  },
  2: {
    // (옛 1 새싹)
    trunkTop: 27,
    trunkW: 1,
    blobs: [
      [13, 26, 3.6, 2.7],
      [21, 26, 3.6, 2.7],
      [17, 24, 3, 2.4],
    ],
    branches: [],
    coins: [],
  },
  3: {
    // (옛 2 어린싹 → 줄기)
    trunkTop: 19,
    trunkW: 1,
    blobs: [
      [17, 16, 5, 4],
      [11, 19, 4, 3.5],
      [23, 19, 4, 3.5],
    ],
    branches: [],
    coins: [],
  },
  4: {
    // (옛 3 묘목 → 앙상한 나무)
    trunkTop: 17,
    trunkW: 2,
    blobs: [
      [17, 13, 7, 5.5],
      [10, 16, 5, 4.5],
      [24, 16, 5, 4.5],
      [17, 18, 6, 4],
    ],
    branches: [
      [17, 22, 10, 17],
      [17, 22, 24, 17],
    ],
    coins: [],
  },
  5: {
    // (옛 4 나무 → 푸른 나무)
    trunkTop: 15,
    trunkW: 3,
    blobs: [
      [17, 11, 9, 7],
      [8, 15, 6, 6],
      [26, 15, 6, 6],
      [17, 17, 8, 5.5],
      [12, 9, 5, 4.5],
      [22, 9, 5, 4.5],
    ],
    branches: [
      [17, 24, 9, 17],
      [17, 24, 25, 17],
    ],
    coins: [],
  },
  6: {
    // (옛 5 금전수 → 열매) — coins 위치를 열매로 재사용
    trunkTop: 13,
    trunkW: 4,
    blobs: [
      [17, 10, 10, 8],
      [7, 14, 7, 6.5],
      [27, 14, 7, 6.5],
      [17, 16, 9, 6],
      [11, 8, 6, 5],
      [23, 8, 6, 5],
    ],
    branches: [
      [17, 26, 8, 18],
      [17, 26, 26, 18],
      [17, 28, 13, 22],
      [17, 28, 21, 22],
    ],
    coins: [
      [8, 18],
      [26, 18],
      [12, 22],
      [22, 22],
      [17, 24],
      [6, 13],
      [28, 13],
    ],
  },
};

const SPARKLES: Record<TreeLevel, [number, number][]> = {
  1: [],
  2: [],
  3: [],
  4: [],
  5: [],
  6: [
    [4, 6],
    [30, 9],
    [17, 2],
    [2, 16],
  ],
};

function buildTree(level: TreeLevel): Grid {
  const g = makeGrid(W, H);
  const spec = SPECS[level];
  const groundY = H - 5;

  // trunk
  const halfL = Math.floor(spec.trunkW / 2);
  const halfR = Math.ceil(spec.trunkW / 2) - 1;
  fillRect(g, CX - halfL, spec.trunkTop, CX + halfR, groundY, "k");
  // light edge on the left of the trunk
  fillRect(g, CX - halfL, spec.trunkTop, CX - halfL, groundY, "K", "k");

  // branches
  spec.branches.forEach(([x0, y0, x1, y1]) =>
    line(g, x0, y0, x1, y1, "k", level >= 4 ? 2 : 1),
  );

  // canopy fill
  spec.blobs.forEach(([cx, cy, rx, ry]) => fillEllipse(g, cx, cy, rx, ry, "l"));

  // shading layered light source from the upper-left:
  // light wash over the upper-left, bright highlight speck, then a shadow
  // crescent painted only onto leaf base still showing at the lower-right.
  spec.blobs.forEach(([cx, cy, rx, ry]) => {
    fillEllipse(g, cx - rx * 0.26, cy - ry * 0.3, rx * 0.7, ry * 0.7, "L", "l");
    fillEllipse(g, cx - rx * 0.42, cy - ry * 0.46, rx * 0.32, ry * 0.32, "h", "L");
    fillEllipse(g, cx + rx * 0.34, cy + ry * 0.36, rx * 0.66, ry * 0.66, "m", "l");
  });

  // LV6 fruits (옛 금전수 동전 → 빨강·주황 열매)
  spec.coins.forEach(([cx, cy]) => {
    fillEllipse(g, cx, cy, 2, 2, "f");
    setPx(g, cx, cy - 1, "F", "f");
    setPx(g, cx - 1, cy, "F", "f");
    setPx(g, cx + 1, cy + 1, "v", "f");
  });

  // outline silhouette
  outline(g, "D");

  // soil mound (drawn after outline so it reads as ground)
  for (let x = CX - 7; x <= CX + 7; x++) {
    const edge = Math.abs(x - CX);
    const top = groundY + 1 + (edge > 5 ? 1 : 0);
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
  cell = 6,
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
        aria-label={`매장 나무 LV.${level} ${TREE_LABELS[level]}${
          wilting ? " (시듦)" : ""
        }`}
      >
        {g.flatMap((row, y) =>
          row.map((ch, x) => {
            if (ch === ".") return null;
            let fill = COLORS[ch];
            if (wilting && "lLhm".includes(ch)) fill = "#86a085";
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
            fontSize={cell * 2}
            fill="#ffe14d"
            fontFamily="monospace"
          >
            ✦
          </text>
        ))}
      </svg>
      {showLabel && (
        <span className="font-mono text-[11px] text-muted-foreground">
          LV.{level} · {TREE_LABELS[level]}
        </span>
      )}
    </div>
  );
}
