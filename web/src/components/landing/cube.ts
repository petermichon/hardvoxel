export type Vec2 = readonly [number, number];
export type Vec3 = readonly [number, number, number];

/** The 8 corners of a unit cube centred on the origin. */
export const CUBE_VERTICES: readonly Vec3[] = (() => {
  const points: Vec3[] = [];
  for (const x of [-0.5, 0.5]) {
    for (const y of [-0.5, 0.5]) {
      for (const z of [-0.5, 0.5]) {
        points.push([x, y, z]);
      }
    }
  }
  return points;
})();

const AZIMUTH = Math.PI / 4;

/**
 * Isometric elevation: sin(elevation) = 1 / sqrt(3).
 * This is the angle at which the three world axes have equal projected length.
 */
export const ELEVATION = Math.asin(1 / Math.sqrt(3));

const RIGHT: Vec3 = [-Math.sin(AZIMUTH), Math.cos(AZIMUTH), 0];
const UP: Vec3 = [
  -Math.sin(ELEVATION) * Math.cos(AZIMUTH),
  -Math.sin(ELEVATION) * Math.sin(AZIMUTH),
  Math.cos(ELEVATION),
];

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

function projectVector(vector: Vec3, scale: number): Vec2 {
  return [scale * dot(vector, RIGHT), -scale * dot(vector, UP)];
}

function projectPoint(point: Vec3, scale: number, center: Vec2): Vec2 {
  return [center[0] + scale * dot(point, RIGHT), center[1] - scale * dot(point, UP)];
}

function formatNumber(value: number): string {
  // Keep the serialised path effectively exact for a 32-unit viewBox.
  const rounded = Number(value.toFixed(6));
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

function pathFromPoints(points: Vec2[]): string {
  return points
    .map(([x, y], index) => `${index === 0 ? "M" : "L"}${formatNumber(x)} ${formatNumber(y)}`)
    .join("");
}

function polygonPath(points: Vec2[]): string {
  return `${pathFromPoints(points)}Z`;
}

/** Sort a convex face's projected vertices around its centre. */
function orderPolygon(points: Vec2[]): Vec2[] {
  const cx = points.reduce((sum, p) => sum + p[0], 0) / points.length;
  const cy = points.reduce((sum, p) => sum + p[1], 0) / points.length;
  return [...points].sort(
    (a, b) => Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx),
  );
}

function cross(origin: Vec2, a: Vec2, b: Vec2): number {
  return (a[0] - origin[0]) * (b[1] - origin[1]) - (a[1] - origin[1]) * (b[0] - origin[0]);
}

/** Convex hull (monotone chain) of the projected cube. */
function convexHull(points: Vec2[]): Vec2[] {
  const unique = [...new Map(points.map((p) => [`${p[0]},${p[1]}`, p])).values()].sort(
    (a, b) => a[0] - b[0] || a[1] - b[1],
  );

  const lower: Vec2[] = [];
  for (const point of unique) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0
    ) {
      lower.pop();
    }
    lower.push(point);
  }

  const upper: Vec2[] = [];
  for (let i = unique.length - 1; i >= 0; i -= 1) {
    const point = unique[i];
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0
    ) {
      upper.pop();
    }
    upper.push(point);
  }

  lower.pop();
  upper.pop();
  return [...lower, ...upper];
}

export type CubeGeometry = {
  size: number;
  scale: number;
  center: Vec2;
  projectedVertices: Vec2[];
  faces: {
    top: Vec2[];
    left: Vec2[];
    right: Vec2[];
  };
  silhouette: Vec2[];
  axes: {
    x: Vec2;
    y: Vec2;
    z: Vec2;
  };
  topPath: string;
  leftPath: string;
  rightPath: string;
  silhouettePath: string;
};

/**
 * Build a perfect isometric cube. `size` is the projected width of the cube.
 * Every coordinate in the returned paths comes from projecting the 8 corners
 * of the same unit cube, so faces cannot drift apart.
 */
export function createIsometricCube({
  size = 22,
  center = [16, 15.8] as Vec2,
}: {
  size?: number;
  center?: Vec2;
} = {}): CubeGeometry {
  // A unit cube projects to a width of sqrt(2) in this isometric view.
  const scale = size / Math.SQRT2;

  const projectedVertices = CUBE_VERTICES.map((point) => projectPoint(point, scale, center));
  const entries = CUBE_VERTICES.map((vertex, index) => ({
    vertex,
    point: projectedVertices[index],
  }));

  const faceFor = (axis: 0 | 1 | 2, value: number) =>
    orderPolygon(entries.filter(({ vertex }) => vertex[axis] === value).map(({ point }) => point));

  // The camera looks from (+x, +y, +z), so these three faces are visible.
  const top = faceFor(2, 0.5);
  const left = faceFor(0, 0.5);
  const right = faceFor(1, 0.5);

  const silhouette = convexHull(projectedVertices);

  return {
    size,
    scale,
    center,
    projectedVertices,
    faces: { top, left, right },
    silhouette,
    axes: {
      x: projectVector([1, 0, 0], scale),
      y: projectVector([0, 1, 0], scale),
      z: projectVector([0, 0, 1], scale),
    },
    topPath: polygonPath(top),
    leftPath: polygonPath(left),
    rightPath: polygonPath(right),
    silhouettePath: polygonPath(silhouette),
  };
}
