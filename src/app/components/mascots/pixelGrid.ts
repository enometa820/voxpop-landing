/**
 * Tiny pixel-art drawing toolkit. Build a character grid with primitive
 * shapes, then a component maps each character to a color and emits <rect>s.
 * Using real shapes (ellipses/triangles/lines) on a dense grid gives the
 * mascots far more expressive detail than hand-typed maps.
 */

export type Grid = string[][];

export function makeGrid(w: number, h: number, fill = "."): Grid {
  return Array.from({ length: h }, () => Array<string>(w).fill(fill));
}

export function dims(g: Grid) {
  return { w: g[0]?.length ?? 0, h: g.length };
}

export function setPx(g: Grid, x: number, y: number, c: string, only?: string) {
  const xi = Math.round(x);
  const yi = Math.round(y);
  if (yi < 0 || yi >= g.length || xi < 0 || xi >= g[0].length) return;
  if (only && !only.includes(g[yi][xi])) return;
  g[yi][xi] = c;
}

export function fillRect(
  g: Grid,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  c: string,
  only?: string,
) {
  for (let y = Math.round(y0); y <= Math.round(y1); y++)
    for (let x = Math.round(x0); x <= Math.round(x1); x++)
      setPx(g, x, y, c, only);
}

export function fillEllipse(
  g: Grid,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  c: string,
  only?: string,
) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) setPx(g, x, y, c, only);
    }
  }
}

export function line(
  g: Grid,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  c: string,
  thick = 1,
) {
  let x = Math.round(x0);
  let y = Math.round(y0);
  const xe = Math.round(x1);
  const ye = Math.round(y1);
  const dx = Math.abs(xe - x);
  const dy = -Math.abs(ye - y);
  const sx = x < xe ? 1 : -1;
  const sy = y < ye ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    if (thick <= 1) setPx(g, x, y, c);
    else fillEllipse(g, x, y, thick / 2, thick / 2, c);
    if (x === xe && y === ye) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

export function fillTriangle(
  g: Grid,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  c: string,
) {
  const minX = Math.floor(Math.min(ax, bx, cx));
  const maxX = Math.ceil(Math.max(ax, bx, cx));
  const minY = Math.floor(Math.min(ay, by, cy));
  const maxY = Math.ceil(Math.max(ay, by, cy));
  const sign = (px: number, py: number, qx: number, qy: number, rx: number, ry: number) =>
    (px - rx) * (qy - ry) - (qx - rx) * (py - ry);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const d1 = sign(x, y, ax, ay, bx, by);
      const d2 = sign(x, y, bx, by, cx, cy);
      const d3 = sign(x, y, cx, cy, ax, ay);
      const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
      const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
      if (!(hasNeg && hasPos)) setPx(g, x, y, c);
    }
  }
}

/** Add a 1px outline ring in empty cells adjacent to any filled cell. */
export function outline(g: Grid, ch = "D") {
  const h = g.length;
  const w = g[0].length;
  const adds: [number, number][] = [];
  const nb = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (g[y][x] !== ".") continue;
      if (
        nb.some(([dx, dy]) => {
          const nx = x + dx;
          const ny = y + dy;
          return (
            nx >= 0 &&
            nx < w &&
            ny >= 0 &&
            ny < h &&
            g[ny][nx] !== "." &&
            g[ny][nx] !== ch
          );
        })
      ) {
        adds.push([x, y]);
      }
    }
  }
  adds.forEach(([x, y]) => (g[y][x] = ch));
}
