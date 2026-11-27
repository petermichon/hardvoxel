import { writeFileSync } from "node:fs";

import { createIsometricCube } from "../src/components/landing/cube";

const cube = createIsometricCube({ size: 24, center: [16, 16] });

const face = (path: string, fill: string) => `<path d="${path}" fill="${fill}" />`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <g>
    <path d="${cube.silhouettePath}" fill="#000000" />
    ${face(cube.topPath, "#121212")}
    ${face(cube.leftPath, "#080808")}
    ${face(cube.rightPath, "#000000")}
  </g>
</svg>
`;

writeFileSync(new URL("../public/favicon.svg", import.meta.url), svg);
console.log("Generated web/public/favicon.svg");
