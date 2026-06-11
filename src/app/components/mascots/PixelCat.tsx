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
 * High-res pixel-art customer cat mascot, monotone green with shading.
 * 3 expressions (default / sleepy / happy) + unlockable costumes.
 */

export type CatExpression = "default" | "sleepy" | "happy";
export type CatCostume = "none" | "ribbon" | "beret" | "tuxedo" | "crown";

const W = 30;
const H = 31;

const COLORS: Record<string, string> = {
  D: "#0c2417", // outline
  b: "#3e8e63", // body
  B: "#2c6a49", // body shadow
  h: "#7fc39a", // body highlight
  w: "#e7efe1", // chest / muzzle / socks
  W: "#cfdec9", // soft white shade
  e: "#0c2417", // eyes / mouth
  i: "#eef5ea", // eye shine
  r: "#b5544a", // nose / inner ear
  R: "#c96a5f", // ribbon
  j: "#26402f", // cloth (beret / tuxedo)
  J: "#3c5c45", // cloth highlight
  g: "#caa24a", // gold
  G: "#e6cf86", // gold highlight
};

function buildBody(g: Grid) {
  // tail (behind body)
  [
    [26, 25, 2.5, 3],
    [27, 21, 2.5, 3],
    [27, 17, 2.3, 3],
    [26, 14, 2.2, 2.5],
  ].forEach(([x, y, rx, ry]) => fillEllipse(g, x, y, rx, ry, "b"));

  // body
  fillEllipse(g, 15, 23, 9, 7, "b");
  // head
  fillEllipse(g, 15, 12, 8, 7, "b");

  // ears
  fillTriangle(g, 8, 2, 5, 9, 12, 8, "b");
  fillTriangle(g, 22, 2, 18, 8, 25, 9, "b");
  // inner ears
  fillTriangle(g, 8, 4, 6.5, 8, 11, 8, "r");
  fillTriangle(g, 22, 4, 19, 8, 23.5, 8, "r");

  // shading — light source upper-left
  fillEllipse(g, 18, 15, 6, 6, "B", "b"); // head lower-right shadow
  fillEllipse(g, 18, 26, 7, 5, "B", "b"); // body lower-right shadow
  fillEllipse(g, 11, 8, 4.5, 4, "h", "b"); // head highlight
  fillEllipse(g, 10, 19, 4, 4, "h", "b"); // body highlight

  // chest fluff + muzzle
  fillEllipse(g, 15, 25, 5.5, 5, "w");
  fillEllipse(g, 15, 15, 4.5, 3, "w");
  fillEllipse(g, 16, 27, 4, 3, "W", "w"); // chest shade

  // front paws / socks
  fillEllipse(g, 10, 29, 3, 2.2, "w");
  fillEllipse(g, 20, 29, 3, 2.2, "w");
}

function drawFace(g: Grid, expr: CatExpression) {
  if (expr === "sleepy") {
    line(g, 9, 13, 13, 13, "e");
    line(g, 9, 14, 12, 14, "e");
    line(g, 17, 13, 21, 13, "e");
    line(g, 18, 14, 21, 14, "e");
  } else if (expr === "happy") {
    line(g, 9, 14, 11, 12, "e");
    line(g, 11, 12, 13, 14, "e");
    line(g, 17, 14, 19, 12, "e");
    line(g, 19, 12, 21, 14, "e");
  } else {
    fillEllipse(g, 11, 12, 2, 2.6, "e");
    fillEllipse(g, 19, 12, 2, 2.6, "e");
    setPx(g, 10, 11, "i");
    setPx(g, 18, 11, "i");
    setPx(g, 11, 13, "i");
    setPx(g, 19, 13, "i");
  }
  // nose + mouth
  fillTriangle(g, 14, 16, 16, 16, 15, 17.5, "r");
  line(g, 15, 17, 15, 18, "e");
  line(g, 15, 18, 13, 19, "e");
  line(g, 15, 18, 17, 19, "e");
}

function drawCostume(g: Grid, costume: CatCostume) {
  switch (costume) {
    case "ribbon": {
      fillTriangle(g, 7, 3, 10, 6, 7, 9, "R");
      fillTriangle(g, 13, 3, 10, 6, 13, 9, "R");
      fillEllipse(g, 10, 6, 1.4, 1.4, "r");
      setPx(g, 8, 4, "G");
      setPx(g, 12, 4, "G");
      break;
    }
    case "beret": {
      fillEllipse(g, 13, 5, 7.5, 3.2, "j");
      fillEllipse(g, 11, 4, 4, 1.6, "J", "j");
      setPx(g, 7, 3, "j");
      setPx(g, 6, 3, "j");
      break;
    }
    case "tuxedo": {
      fillEllipse(g, 15, 26, 5, 5, "j");
      fillTriangle(g, 15, 21, 11, 30, 19, 30, "w");
      // bowtie
      fillTriangle(g, 12, 18, 15, 20, 12, 22, "j");
      fillTriangle(g, 18, 18, 15, 20, 18, 22, "j");
      fillEllipse(g, 15, 20, 1.2, 1.4, "D");
      break;
    }
    case "crown": {
      fillRect(g, 9, 4, 21, 5, "g");
      fillTriangle(g, 9, 5, 11, 1, 13, 5, "g");
      fillTriangle(g, 13, 5, 15, 0, 17, 5, "g");
      fillTriangle(g, 17, 5, 19, 1, 21, 5, "g");
      setPx(g, 11, 2, "G");
      setPx(g, 15, 1, "G");
      setPx(g, 19, 2, "G");
      setPx(g, 12, 5, "G");
      setPx(g, 18, 5, "G");
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
  cell = 6,
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
