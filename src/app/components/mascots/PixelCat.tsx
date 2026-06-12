import {
  makeGrid,
  setPx,
  fillEllipse,
  fillTriangle,
  fillRect,
  line,
  outline,
  type Grid,
} from "./pixelGrid";

/**
 * High-res pixel-art customer cat mascot — sleek black cat.
 * 60×62 grid with layered shading (base + 2 highlights + 2 shadows).
 * 3 expressions (default / sleepy / happy) + unlockable costumes.
 */

export type CatExpression = "default" | "sleepy" | "happy";
export type CatCostume = "none" | "ribbon" | "beret" | "tuxedo" | "crown";

const W = 60;
const H = 62;

const COLORS: Record<string, string> = {
  D: "#050806", // outline
  b: "#1d2823", // body base (그린블랙 — 셰이딩 보이게 살짝 밝게)
  B: "#121a15", // body shadow
  V: "#0a0e0b", // deep shadow
  h: "#37433b", // body highlight (차콜, 위-왼쪽 광원)
  H: "#4d5d52", // bright highlight speck
  w: "#f3f7ef", // chest / muzzle / socks — 크림
  W: "#d2ddcb", // chest shade
  e: "#ffe14d", // eyes — 선옐로 황금눈
  E: "#caa400", // eye lower shade
  i: "#ffffff", // eye shine
  p: "#241d05", // pupil
  r: "#ff5c5c", // nose / inner ear — 코랄
  q: "#d8474a", // inner ear shade
  R: "#e0555f", // ribbon
  S: "#b23a47", // ribbon shade
  j: "#243a2c", // cloth (beret / tuxedo)
  J: "#3c5c45", // cloth highlight
  g: "#e0b94a", // gold
  G: "#fff0b0", // gold highlight
  x: "#9c7a28", // gold shade
};

function buildBody(g: Grid) {
  // tail (behind body) — 복슬한 꼬리
  [
    [52, 50, 5, 6],
    [54, 42, 5, 6],
    [54, 33, 4.6, 6],
    [51, 26, 4.2, 5],
  ].forEach(([x, y, rx, ry]) => fillEllipse(g, x, y, rx, ry, "b"));
  // 꼬리 끝 하이라이트
  fillEllipse(g, 51, 25, 2.6, 3, "h", "b");

  // body
  fillEllipse(g, 30, 46, 18, 14, "b");
  // head
  fillEllipse(g, 30, 24, 16, 14, "b");

  // ears
  fillTriangle(g, 16, 3, 10, 18, 25, 15, "b");
  fillTriangle(g, 44, 3, 35, 15, 50, 18, "b");
  // inner ears (coral + shade)
  fillTriangle(g, 16, 7, 12, 16, 22, 15, "r");
  fillTriangle(g, 44, 7, 38, 15, 48, 16, "r");
  fillTriangle(g, 17, 11, 14, 16, 21, 15, "q");
  fillTriangle(g, 43, 11, 39, 15, 46, 16, "q");

  // ── shading: light source upper-left ──
  // head shadows (lower-right), two depths
  fillEllipse(g, 37, 30, 12, 12, "B", "b");
  fillEllipse(g, 41, 34, 8, 8, "V", "b");
  // body shadows
  fillEllipse(g, 37, 52, 14, 10, "B", "b");
  fillEllipse(g, 41, 56, 9, 7, "V", "b");
  // head highlights (upper-left), two brightness
  fillEllipse(g, 22, 15, 9, 8, "h", "b");
  fillEllipse(g, 19, 12, 4.5, 4.5, "H", "h");
  // body highlights
  fillEllipse(g, 20, 38, 8, 8, "h", "b");
  fillEllipse(g, 17, 35, 4, 4, "H", "h");

  // chest fluff + muzzle (cream)
  fillEllipse(g, 30, 50, 11, 10, "w");
  fillEllipse(g, 30, 30, 9, 6, "w");
  fillEllipse(g, 33, 54, 8, 6, "W", "w"); // chest shade lower-right
  fillEllipse(g, 27, 47, 5, 5, "w"); // chest highlight bloom

  // front paws / socks
  fillEllipse(g, 20, 58, 6, 4.4, "w");
  fillEllipse(g, 40, 58, 6, 4.4, "w");
  fillEllipse(g, 22, 59, 3, 2.4, "W", "w");
  fillEllipse(g, 42, 59, 3, 2.4, "W", "w");
}

function drawFace(g: Grid, expr: CatExpression) {
  if (expr === "sleepy") {
    line(g, 18, 26, 27, 26, "D", 2);
    line(g, 33, 26, 42, 26, "D", 2);
  } else if (expr === "happy") {
    // 위로 휜 웃는 눈
    line(g, 18, 28, 22, 23, "e", 2);
    line(g, 22, 23, 27, 28, "e", 2);
    line(g, 33, 28, 38, 23, "e", 2);
    line(g, 38, 23, 42, 28, "e", 2);
  } else {
    // 큰 황금 눈 + 동공 + 하이라이트
    fillEllipse(g, 22, 24, 4.6, 5.6, "e");
    fillEllipse(g, 38, 24, 4.6, 5.6, "e");
    fillEllipse(g, 22, 27, 4.2, 2.4, "E", "e"); // 아래 음영
    fillEllipse(g, 38, 27, 4.2, 2.4, "E", "e");
    fillEllipse(g, 23, 25, 2.4, 3.2, "p"); // 동공
    fillEllipse(g, 39, 25, 2.4, 3.2, "p");
    fillEllipse(g, 20.5, 21.5, 1.6, 1.6, "i"); // 하이라이트
    fillEllipse(g, 36.5, 21.5, 1.6, 1.6, "i");
  }
  // nose
  fillTriangle(g, 27, 32, 33, 32, 30, 35.5, "r");
  setPx(g, 29, 33, "i");
  // mouth
  line(g, 30, 35, 30, 37, "D");
  line(g, 30, 37, 26, 39, "D");
  line(g, 30, 37, 34, 39, "D");
  // whiskers
  line(g, 14, 33, 23, 34, "W");
  line(g, 14, 36, 23, 36, "W");
  line(g, 37, 34, 46, 33, "W");
  line(g, 37, 36, 46, 36, "W");
}

function drawCostume(g: Grid, costume: CatCostume) {
  switch (costume) {
    case "ribbon": {
      fillTriangle(g, 13, 5, 21, 11, 13, 17, "R");
      fillTriangle(g, 27, 5, 21, 11, 27, 17, "R");
      fillTriangle(g, 14, 8, 20, 11, 14, 14, "S");
      fillEllipse(g, 21, 11, 2.6, 2.6, "S");
      fillEllipse(g, 21, 11, 1.4, 1.4, "G");
      break;
    }
    case "beret": {
      fillEllipse(g, 27, 8, 15, 6, "j");
      fillEllipse(g, 22, 6, 8, 3.5, "J", "j");
      fillEllipse(g, 14, 5, 2, 2, "j");
      break;
    }
    case "tuxedo": {
      fillEllipse(g, 30, 52, 10, 10, "j");
      fillTriangle(g, 30, 42, 22, 60, 38, 60, "w");
      // bowtie
      fillTriangle(g, 24, 36, 30, 40, 24, 44, "j");
      fillTriangle(g, 36, 36, 30, 40, 36, 44, "j");
      fillEllipse(g, 30, 40, 2.2, 2.6, "D");
      break;
    }
    case "crown": {
      fillRect(g, 18, 8, 42, 11, "g");
      fillTriangle(g, 18, 9, 22, 2, 26, 9, "g");
      fillTriangle(g, 26, 9, 30, 0, 34, 9, "g");
      fillTriangle(g, 34, 9, 38, 2, 42, 9, "g");
      fillRect(g, 18, 10, 42, 11, "x", "g");
      setPx(g, 22, 3, "G");
      setPx(g, 30, 1, "G");
      setPx(g, 38, 3, "G");
      break;
    }
    default:
      break;
  }
}

const CACHE: Record<string, Grid> = {};
function catGrid(expr: CatExpression, costume: CatCostume): Grid {
  const key = `${expr}|${costume}`;
  if (CACHE[key]) return CACHE[key];
  const g = makeGrid(W, H);
  buildBody(g);
  drawFace(g, expr);
  drawCostume(g, costume);
  outline(g, "D");
  CACHE[key] = g;
  return g;
}

export function PixelCat({
  expression = "default",
  costume = "none",
  cell = 4,
  className = "",
}: {
  expression?: CatExpression;
  costume?: CatCostume;
  cell?: number;
  className?: string;
}) {
  const g = catGrid(expression, costume);

  return (
    <svg
      viewBox={`0 0 ${W * cell} ${H * cell}`}
      width="100%"
      className={className}
      style={{
        shapeRendering: "crispEdges",
        imageRendering: "pixelated",
        maxWidth: W * cell,
      }}
      role="img"
      aria-label={`손님 고양이 (${expression}${
        costume !== "none" ? `, ${costume}` : ""
      })`}
    >
      {g.flatMap((row, y) =>
        row.map((ch, x) => {
          if (ch === ".") return null;
          return (
            <rect
              key={`${x}-${y}`}
              x={x * cell}
              y={y * cell}
              width={cell}
              height={cell}
              fill={COLORS[ch]}
            />
          );
        }),
      )}
    </svg>
  );
}
