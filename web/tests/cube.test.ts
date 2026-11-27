import { describe, expect, test } from "bun:test";

import { CUBE_VERTICES, createIsometricCube, type Vec2 } from "../src/components/landing/cube";

const cube = createIsometricCube();

const length2 = ([x, y]: Vec2) => Math.hypot(x, y);
const distance2 = (a: Vec2, b: Vec2) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const distance3 = (a: readonly number[], b: readonly number[]) =>
  Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

function polygonArea(points: Vec2[]): number {
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area) / 2;
}

function edgeLengths(points: Vec2[]): number[] {
  return points.map((point, index) => distance2(point, points[(index + 1) % points.length]));
}

const isCubeEdge = (a: readonly number[], b: readonly number[]) => {
  const diffs = [Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2])];
  return (
    diffs.filter((difference) => difference === 1).length === 1 &&
    diffs.filter((difference) => difference === 0).length === 2
  );
};

describe("cube source geometry", () => {
  test("is a unit cube: exactly 12 edges of length 1", () => {
    const edgeLengths: number[] = [];
    for (let i = 0; i < CUBE_VERTICES.length; i += 1) {
      for (let j = i + 1; j < CUBE_VERTICES.length; j += 1) {
        if (isCubeEdge(CUBE_VERTICES[i], CUBE_VERTICES[j])) {
          edgeLengths.push(distance3(CUBE_VERTICES[i], CUBE_VERTICES[j]));
        }
      }
    }
    expect(edgeLengths).toHaveLength(12);
    for (const length of edgeLengths) {
      expect(Math.abs(length - 1)).toBeLessThan(1e-12);
    }
  });

  test("is a cube, not a cuboid: every edge is the same length", () => {
    const lengths = new Set<number>();
    for (let i = 0; i < CUBE_VERTICES.length; i += 1) {
      for (let j = i + 1; j < CUBE_VERTICES.length; j += 1) {
        if (isCubeEdge(CUBE_VERTICES[i], CUBE_VERTICES[j])) {
          lengths.add(Number(distance3(CUBE_VERTICES[i], CUBE_VERTICES[j]).toFixed(12)));
        }
      }
    }
    expect([...lengths]).toEqual([1]);
  });
});

describe("isometric projection", () => {
  test("the three world axes all project to the same length", () => {
    const lengths = [cube.axes.x, cube.axes.y, cube.axes.z].map(length2);
    const [reference] = lengths;
    for (const length of lengths) {
      expect(Math.abs(length - reference)).toBeLessThan(1e-12);
    }
  });

  test("all three visible faces are congruent rhombi", () => {
    const areas = [cube.faces.top, cube.faces.left, cube.faces.right].map(polygonArea);
    const [reference] = areas;
    for (const area of areas) {
      expect(Math.abs(area - reference)).toBeLessThan(1e-9);
    }

    const edgeLength = length2(cube.axes.x);
    for (const face of [cube.faces.top, cube.faces.left, cube.faces.right]) {
      expect(face).toHaveLength(4);
      for (const length of edgeLengths(face)) {
        expect(Math.abs(length - edgeLength)).toBeLessThan(1e-12);
      }
    }
  });

  test("the silhouette is a hexagon", () => {
    expect(cube.silhouette).toHaveLength(6);
    expect(edgeLengths(cube.silhouette).every((length) => length > 0)).toBe(true);
  });

  test("the eight corners project to seven distinct screen points", () => {
    const unique = new Set(
      cube.projectedVertices.map(([x, y]) => `${x.toFixed(9)}:${y.toFixed(9)}`),
    );
    expect(cube.projectedVertices).toHaveLength(8);
    expect(unique.size).toBe(7);
  });

  test("every generated path is finite and non-empty", () => {
    const paths = [cube.topPath, cube.leftPath, cube.rightPath, cube.silhouettePath];
    for (const path of paths) {
      expect(path.length).toBeGreaterThan(0);
      expect(path).not.toContain("NaN");
      expect(path).not.toContain("Infinity");
    }
  });
});
