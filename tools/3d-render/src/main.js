import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
import { SSAOPass } from "three/examples/jsm/postprocessing/SSAOPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

const params = new URLSearchParams(location.search);
const preset = params.get("preset") ?? "hero";
const size = Number(params.get("size") ?? 680);

const canvas = document.querySelector("#render");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(size, size, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x080808, 0.032);

const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 120);

// ---------------------------------------------------------------------------
// Procedural textures
// ---------------------------------------------------------------------------

function canvasTexture(width, height, draw, { srgb = true, repeat = [1, 1] } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat[0], repeat[1]);
  texture.anisotropy = 8;
  if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function corrugationTexture(srgb) {
  return canvasTexture(
    512,
    256,
    (ctx, width, height) => {
      ctx.fillStyle = srgb ? "#e8e8e5" : "#808080";
      ctx.fillRect(0, 0, width, height);
      for (let x = 0; x < width; x += 14) {
        const gradient = ctx.createLinearGradient(x, 0, x + 14, 0);
        gradient.addColorStop(0, srgb ? "#b8b8b4" : "#4c4c4c");
        gradient.addColorStop(0.45, srgb ? "#ffffff" : "#b4b4b4");
        gradient.addColorStop(0.62, srgb ? "#d4d4d0" : "#8c8c8c");
        gradient.addColorStop(1, srgb ? "#9a9a96" : "#3a3a3a");
        ctx.fillStyle = gradient;
        ctx.fillRect(x, 0, 14, height);
      }
      for (let i = 0; i < 7000; i += 1) {
        const value = Math.floor(80 + Math.random() * 110);
        ctx.fillStyle = `rgba(${value},${value},${value},${srgb ? 0.05 : 0.12})`;
        ctx.fillRect(Math.random() * width, Math.random() * height, 1, 1);
      }
    },
    { srgb, repeat: [4, 1] },
  );
}

const corrugation = corrugationTexture(false);
const corrugationMap = corrugationTexture(true);

const background = canvasTexture(1024, 512, (ctx, width, height) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#030303");
  gradient.addColorStop(0.55, "#080808");
  gradient.addColorStop(0.82, "#141414");
  gradient.addColorStop(1, "#1c1c1c");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
});
background.mapping = THREE.EquirectangularReflectionMapping;
scene.background = background;

const contactShadowTexture = canvasTexture(512, 512, (ctx, width, height) => {
  const gradient = ctx.createRadialGradient(width / 2, height / 2, 8, width / 2, height / 2, width / 2);
  gradient.addColorStop(0, "rgba(0,0,0,0.9)");
  gradient.addColorStop(0.45, "rgba(0,0,0,0.5)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
});

const glowTexture = canvasTexture(512, 512, (ctx, width, height) => {
  const gradient = ctx.createRadialGradient(width / 2, height / 2, 10, width / 2, height / 2, width / 2);
  gradient.addColorStop(0, "rgba(255,255,255,0.5)");
  gradient.addColorStop(0.4, "rgba(255,255,255,0.16)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
});

const concrete = canvasTexture(
  1024,
  1024,
  (ctx, width, height) => {
    ctx.fillStyle = "#252524";
    ctx.fillRect(0, 0, width, height);
    for (let i = 0; i < 120000; i += 1) {
      const v = Math.floor(18 + Math.random() * 72);
      ctx.fillStyle = `rgba(${v},${v},${v},${0.18 + Math.random() * 0.32})`;
      const s = Math.random() * 2.8 + 0.3;
      ctx.fillRect(Math.random() * width, Math.random() * height, s, s);
    }
    for (let i = 0; i < 32; i += 1) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const r = 40 + Math.random() * 180;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(0,0,0,${0.12 + Math.random() * 0.18})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    ctx.strokeStyle = "rgba(10,10,10,0.35)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 7; i += 1) {
      ctx.beginPath();
      let x = Math.random() * width;
      let y = Math.random() * height;
      ctx.moveTo(x, y);
      for (let s = 0; s < 4; s += 1) {
        x += (Math.random() - 0.5) * 90;
        y += (Math.random() - 0.5) * 90;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  },
  { repeat: [8, 8] },
);

function grilleTexture(lightSlots) {
  return canvasTexture(1024, 512, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    const line = lightSlots ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.62)";
    ctx.strokeStyle = lightSlots ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.28)";
    ctx.lineWidth = 4;
    roundRect(ctx, 18, 18, width - 36, height - 36, 14);
    ctx.stroke();

    for (let x = 46; x < width - 60; x += 30) {
      ctx.fillStyle = line;
      roundRect(ctx, x, 48, 10, height - 96, 5);
      ctx.fill();
    }

    // A small inspection plate, like the stamped details on the references.
    ctx.fillStyle = lightSlots ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.32)";
    roundRect(ctx, 52, 54, 118, 52, 7);
    ctx.fill();
    ctx.fillStyle = lightSlots ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.58)";
    ctx.font = "700 23px 'Arial Narrow', Arial, sans-serif";
    ctx.letterSpacing = "2px";
    ctx.fillText("HX-08", 66, 88);

    // Directional tabs.
    ctx.strokeStyle = lightSlots ? "rgba(255,255,255,0.24)" : "rgba(0,0,0,0.36)";
    ctx.lineWidth = 3;
    for (const x of [width - 190, width - 150]) {
      ctx.beginPath();
      ctx.moveTo(x, 74);
      ctx.lineTo(x + 18, 86);
      ctx.lineTo(x, 98);
      ctx.stroke();
    }
  });
}

const grilleDark = grilleTexture(false);
const grilleLight = grilleTexture(true);

function topVentTexture(lightSlots) {
  return canvasTexture(1024, 512, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = lightSlots ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.45)";
    // Wide roof ribs; the previous dense diagonals turned into moire at a shallow angle.
    for (let y = 44; y < height - 30; y += 52) {
      ctx.fillRect(36, y, width - 72, 10);
    }
    ctx.strokeStyle = lightSlots ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.2)";
    ctx.lineWidth = 5;
    ctx.strokeRect(22, 22, width - 44, height - 44);
  });
}

const topVentDark = topVentTexture(false);
const topVentLight = topVentTexture(true);
const topVentBump = canvasTexture(
  1024,
  512,
  (ctx, width, height) => {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#ffffff";
    for (let y = 44; y < height - 30; y += 52) {
      ctx.fillRect(36, y, width - 72, 10);
    }
  },
  { srgb: false },
);

function brandTexture(color, subColor, label = "HARDVOXEL", sub = "CONTAINER HOSTING") {
  return canvasTexture(1024, 256, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.letterSpacing = "7px";
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(0.8, 1.06);
    ctx.font = "900 132px 'Arial Narrow', Arial, sans-serif";
    ctx.fillText(label, 0, -16);
    if (sub) {
      ctx.fillStyle = subColor;
      ctx.letterSpacing = "12px";
      ctx.font = "600 25px 'Arial Narrow', Arial, sans-serif";
      ctx.fillText(sub, 0, 72);
    }
    ctx.restore();
  });
}

const brands = {
  light: brandTexture("rgba(20,20,20,0.52)", "rgba(20,20,20,0.3)"),
  dark: brandTexture("rgba(240,240,238,0.38)", "rgba(240,240,238,0.2)"),
  accent: brandTexture("rgba(255,235,230,0.5)", "rgba(255,235,230,0.26)"),
};

const tones = {
  light: {
    body: 0xcecec9,
    rail: 0x8e8e89,
    darkSlots: true,
    brand: "light",
  },
  mid: {
    body: 0x8f8f8a,
    rail: 0x585853,
    darkSlots: true,
    brand: "light",
  },
  dark: {
    body: 0x3a3a37,
    rail: 0x101010,
    darkSlots: false,
    brand: "dark",
  },
  accent: {
    body: 0x62241e,
    rail: 0x230d0b,
    darkSlots: false,
    brand: "accent",
  },
};

// ---------------------------------------------------------------------------
// Container model
// ---------------------------------------------------------------------------

function createContainer({
  length = 5.4,
  height = 2,
  depth = 2.2,
  tone = "light",
  baseY = 0,
  position = [0, 0, 0],
  rotation = 0,
  label = "HARDVOXEL",
}) {
  const colors = tones[tone];
  const group = new THREE.Group();
  group.position.set(position[0], baseY + height / 2 + 0.02, position[2]);
  group.rotation.y = rotation;

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: colors.body,
    map: corrugationMap,
    roughness: 0.84,
    metalness: 0.03,
    bumpMap: corrugation,
    bumpScale: 0.014,
    envMapIntensity: 0.32,
  });
  const body = new THREE.Mesh(new RoundedBoxGeometry(length, height, depth, 5, 0.06), bodyMaterial);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const railMaterial = new THREE.MeshStandardMaterial({
    color: colors.rail,
    roughness: 0.8,
    metalness: 0.05,
    envMapIntensity: 0.4,
  });

  for (const y of [-height / 2 + 0.055, height / 2 - 0.055]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(length + 0.04, 0.11, depth + 0.04), railMaterial);
    rail.position.y = y;
    rail.castShadow = true;
    rail.receiveShadow = true;
    group.add(rail);
  }

  for (const x of [-length / 2 + 0.05, length / 2 - 0.05]) {
    for (const z of [-depth / 2 + 0.05, depth / 2 - 0.05]) {
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(0.13, height - 0.18, 0.13),
        railMaterial,
      );
      post.position.set(x, 0, z);
      post.castShadow = true;
      post.receiveShadow = true;
      group.add(post);

      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.1, 0.24), railMaterial);
      foot.position.set(x, -height / 2 + 0.01, z);
      foot.castShadow = true;
      group.add(foot);
    }
  }

  const grille = colors.darkSlots ? grilleDark : grilleLight;
  const vent = colors.darkSlots ? topVentDark : topVentLight;

  const grilleMaterial = new THREE.MeshStandardMaterial({
    map: grille,
    transparent: true,
    roughness: 0.76,
    metalness: 0.04,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
    opacity: 0.9,
  });

  const end = new THREE.Mesh(new THREE.PlaneGeometry(depth - 0.42, height - 0.52), grilleMaterial);
  end.position.set(length / 2 + 0.008, 0, 0);
  end.rotation.y = Math.PI / 2;
  group.add(end);

  const back = new THREE.Mesh(new THREE.PlaneGeometry(length - 0.5, height - 0.56), grilleMaterial);
  back.position.set(0, 0, -depth / 2 - 0.008);
  back.rotation.y = Math.PI;
  group.add(back);

  const topMaterial = new THREE.MeshStandardMaterial({
    color: colors.body,
    bumpMap: topVentBump,
    bumpScale: 0.028,
    roughness: 0.86,
    metalness: 0.02,
    envMapIntensity: 0.25,
  });
  const top = new THREE.Mesh(new THREE.PlaneGeometry(length - 0.5, depth - 0.46), topMaterial);
  top.rotation.x = -Math.PI / 2;
  top.position.y = height / 2 + 0.008;
  group.add(top);

  const brand = new THREE.Mesh(
    new THREE.PlaneGeometry(1.95, 0.49),
    new THREE.MeshStandardMaterial({
      map: brands[colors.brand],
      transparent: true,
      roughness: 0.7,
      metalness: 0.03,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      opacity: 0.64,
    }),
  );
  brand.position.set(-0.86, 0.12, depth / 2 + 0.012);
  group.add(brand);

  const sideGrille = new THREE.Mesh(
    new THREE.PlaneGeometry(1.28, height - 0.52),
    grilleMaterial,
  );
  sideGrille.position.set(length / 2 - 0.94, 0, depth / 2 + 0.012);
  group.add(sideGrille);

  for (const x of [-2.15, 0.45]) {
    const seam = new THREE.Mesh(new THREE.BoxGeometry(0.025, height - 0.3, 0.02), railMaterial);
    seam.position.set(x, 0, depth / 2 + 0.012);
    group.add(seam);
  }



  const small = new THREE.Mesh(
    new THREE.PlaneGeometry(0.82, 0.22),
    new THREE.MeshStandardMaterial({
      map: brandTexture(
        colors.brand === "dark" ? "rgba(240,240,238,0.46)" : "rgba(20,20,20,0.46)",
        "transparent",
        "HX",
        "",
      ),
      transparent: true,
      roughness: 0.7,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    }),
  );
  small.position.set(length / 2 + 0.012, 0.08, depth / 4);
  small.rotation.y = Math.PI / 2;
  group.add(small);

  // Door frame, lock rods, and hardware on the visible end.
  const seamMaterial = new THREE.MeshStandardMaterial({
    color: 0x0b0b0b,
    roughness: 0.72,
    metalness: 0.2,
  });
  for (const z of [-depth / 2 + 0.14, depth / 2 - 0.14]) {
    const edge = new THREE.Mesh(new THREE.BoxGeometry(0.05, height - 0.24, 0.07), seamMaterial);
    edge.position.set(length / 2 + 0.014, 0, z);
    group.add(edge);
  }
  for (const y of [-height / 2 + 0.14, height / 2 - 0.14]) {
    const edge = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, depth - 0.24), seamMaterial);
    edge.position.set(length / 2 + 0.014, y, 0);
    group.add(edge);
  }
  const centerSeam = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, height - 0.24, 0.06),
    seamMaterial,
  );
  centerSeam.position.set(length / 2 + 0.014, 0, 0);
  group.add(centerSeam);

  const rodMaterial = new THREE.MeshStandardMaterial({
    color: 0x7a7a74,
    roughness: 0.38,
    metalness: 0.72,
  });
  for (const z of [-0.76, -0.34, 0.34, 0.76]) {
    const rod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, height - 0.4, 10),
      rodMaterial,
    );
    rod.position.set(length / 2 + 0.045, 0, z);
    group.add(rod);

    for (const y of [-0.44, 0.44]) {
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.055, 0.2), seamMaterial);
      handle.position.set(length / 2 + 0.07, y, z);
      group.add(handle);
    }
  }

  for (const y of [-0.58, 0.58]) {
    for (const z of [-depth / 2 + 0.16, depth / 2 - 0.16]) {
      const hinge = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.16, 0.075), seamMaterial);
      hinge.position.set(length / 2 + 0.018, y, z);
      group.add(hinge);
    }
  }

  for (const x of [-length / 2 + 0.08, length / 2 - 0.08]) {
    for (const z of [-depth / 2 + 0.08, depth / 2 - 0.08]) {
      const casting = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.13, 0.19), railMaterial);
      casting.position.set(x, height / 2 - 0.02, z);
      casting.castShadow = true;
      group.add(casting);
    }
  }

  for (const z of [-depth / 2 + 0.06, depth / 2 - 0.06]) {
    const roofRail = new THREE.Mesh(new THREE.BoxGeometry(length + 0.02, 0.06, 0.1), railMaterial);
    roofRail.position.set(0, height / 2 + 0.005, z);
    roofRail.castShadow = true;
    group.add(roofRail);
  }

  for (const z of [-0.55, 0.55]) {
    const roofRib = new THREE.Mesh(new THREE.BoxGeometry(length - 0.42, 0.025, 0.055), railMaterial);
    roofRib.position.set(0, height / 2 + 0.014, z);
    roofRib.castShadow = true;
    group.add(roofRib);
  }

  const boltGeometry = new THREE.CylinderGeometry(0.026, 0.026, 0.022, 8);
  for (const x of [-2.4, -1.2, 0, 1.2, 2.4]) {
    for (const y of [-0.82, 0.82]) {
      const bolt = new THREE.Mesh(boltGeometry, seamMaterial);
      bolt.rotation.x = Math.PI / 2;
      bolt.position.set(x, y, depth / 2 + 0.012);
      group.add(bolt);
    }
  }

  group.userData.label = label;
  return group;
}

// ---------------------------------------------------------------------------
// Scene setup
// ---------------------------------------------------------------------------

const pmrem = new THREE.PMREMGenerator(renderer);
const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environment = environment;
scene.environmentIntensity = 0.18;

const floorMaterial = new THREE.MeshStandardMaterial({
  map: concrete,
  bumpMap: concrete,
  bumpScale: 0.06,
  color: 0xc4c4c4,
  roughness: 0.94,
  metalness: 0.02,
  envMapIntensity: 0.2,
});
const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.01;
floor.receiveShadow = true;
scene.add(floor);

const backdrop = new THREE.Mesh(
  new THREE.CylinderGeometry(20, 20, 24, 64, 1, true),
  new THREE.MeshBasicMaterial({ map: background, side: THREE.BackSide }),
);
backdrop.position.y = 10;
scene.add(backdrop);

const glow = new THREE.Mesh(
  new THREE.PlaneGeometry(28, 28),
  new THREE.MeshBasicMaterial({
    map: glowTexture,
    transparent: true,
    opacity: 0.26,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
);
glow.rotation.x = -Math.PI / 2;
glow.position.set(0, 0.002, -2.5);
scene.add(glow);

const key = new THREE.DirectionalLight(0xfff5e8, 3.9);
key.position.set(5, 9, 7);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -12;
key.shadow.camera.right = 12;
key.shadow.camera.top = 12;
key.shadow.camera.bottom = -12;
key.shadow.camera.near = 1;
key.shadow.camera.far = 35;
key.shadow.bias = -0.0004;
key.shadow.normalBias = 0.02;
key.shadow.radius = 5;
scene.add(key);

const fill = new THREE.DirectionalLight(0xbcc4cf, 0.8);
fill.position.set(-7, 4, 3);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xffffff, 1.7);
rim.position.set(6, 6, -7);
scene.add(rim);

const ambient = new THREE.HemisphereLight(0xffffff, 0x0b0b0b, 0.55);
scene.add(ambient);

const bounce = new THREE.PointLight(0xc9d2dd, 16, 28, 2);
bounce.position.set(7, 3.2, 8);
scene.add(bounce);

function addSpot(position, intensity = 18) {
  const spot = new THREE.SpotLight(0xfff1de, intensity, 22, Math.PI / 5, 0.65, 1.4);
  spot.position.set(...position);
  spot.castShadow = true;
  spot.shadow.mapSize.set(1024, 1024);
  spot.shadow.bias = -0.0004;
  scene.add(spot);
  scene.add(spot.target);
  return spot;
}

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

const heroContainers = [
  {
    length: 5.6,
    height: 2.1,
    depth: 2.4,
    tone: "light",
    position: [0, 0, 0],
    rotation: 0.31,
  },
];

const heroDarkContainers = [
  {
    length: 5.6,
    height: 2.1,
    depth: 2.4,
    tone: "dark",
    position: [0, 0, 0],
    rotation: 0.31,
  },
];

const registryContainers = [
  { length: 5.1, tone: "light", position: [0, 0, 0], rotation: 0.14 },
];

const isolationContainers = [
  { length: 4.8, tone: "dark", position: [0, 0, 0], rotation: -0.12 },
];

const pairContainers = [
  { length: 4.2, tone: "light", position: [-2.4, 0, 0.45], rotation: 0.13 },
  { length: 4.2, tone: "dark", position: [2.35, 0, -0.35], rotation: -0.18 },
];

const presets = {
  hero: {
    containers: heroContainers,
    camera: [7.2, 3.5, 8.6],
    target: [0, 0.95, 0],
    fov: 35,
    exposure: 0.9,
  },
  heroDark: {
    containers: heroDarkContainers,
    camera: [7.2, 3.5, 8.6],
    target: [0, 0.95, 0],
    fov: 35,
    exposure: 1.12,
  },
  heroClose: {
    containers: heroDarkContainers,
    camera: [6.3, 3.15, 7.5],
    target: [0, 0.95, 0],
    fov: 36,
    exposure: 1.12,
  },
  registry: {
    containers: registryContainers,
    camera: [5.6, 3.2, 7.2],
    target: [0, 1, 0],
    fov: 33,
    exposure: 1.12,
  },
  isolation: {
    containers: isolationContainers,
    camera: [5.1, 3.1, 6.8],
    target: [0, 1, 0],
    fov: 32,
    exposure: 1.05,
  },
  pair: {
    containers: pairContainers,
    camera: [8.1, 4.4, 10.4],
    target: [0, 0.95, 0],
    fov: 38,
    exposure: 1.1,
  },
};

const config = presets[preset] ?? presets.hero;
renderer.toneMappingExposure = config.exposure;
camera.fov = config.fov;
camera.position.set(...config.camera);
camera.lookAt(...config.target);
camera.updateProjectionMatrix();

for (const item of config.containers) {
  scene.add(createContainer(item));
}

if (preset === "hero" || preset === "heroDark" || preset === "heroClose") {
  addSpot([2, 10, 5], 14).target.position.set(0, 0.4, 0);
  const darkScene = preset !== "hero";
  const floorSpot = addSpot([0, 10, 8], darkScene ? 12 : 7);
  floorSpot.target.position.set(0, 0, 3.5);
  floorSpot.angle = Math.PI / 4.6;
  floorSpot.penumbra = 1;
  floorSpot.castShadow = false;
  key.intensity = darkScene ? 3.8 : 2.6;
  fill.intensity = darkScene ? 0.7 : 0.2;
  rim.intensity = darkScene ? 3.2 : 1.6;
  ambient.intensity = darkScene ? 0.34 : 0.2;
  bounce.intensity = darkScene ? 20 : 8;
  scene.fog.density = 0.04;

  const contact = new THREE.Mesh(
    new THREE.PlaneGeometry(8.4, 5.4),
    new THREE.MeshBasicMaterial({
      map: contactShadowTexture,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    }),
  );
  contact.rotation.x = -Math.PI / 2;
  contact.position.set(0, 0.001, 0.25);
  scene.add(contact);
}

if (preset === "isolation") {
  addSpot([0, 9, 1.2], 28).target.position.set(0, 0, 0);
  key.intensity = 1.5;
  fill.intensity = 0.35;
  rim.intensity = 1.2;
  scene.fog.density = 0.045;
}

if (preset === "pair") {
  scene.fog.density = 0.026;
}

// A soft pool of light on the floor for the single-container scenes.
if (preset === "registry" || preset === "isolation") {
  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(7, 64),
    new THREE.MeshBasicMaterial({
      color: preset === "isolation" ? 0x2a2a2a : 0x242424,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    }),
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.002;
  scene.add(pool);
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

const composer = new EffectComposer(renderer);
composer.setPixelRatio(renderer.getPixelRatio());
composer.setSize(size, size);
composer.addPass(new RenderPass(scene, camera));

const ssao = new SSAOPass(scene, camera, size, size);
ssao.kernelRadius = 0.18;
ssao.minDistance = 0.002;
ssao.maxDistance = 0.12;
composer.addPass(ssao);

const focusDistance = camera.position.distanceTo(new THREE.Vector3(...config.target));
const bokeh = new BokehPass(scene, camera, {
  focus: focusDistance,
  aperture: 0.00014,
  maxblur: 0.006,
});
composer.addPass(bokeh);
composer.addPass(new OutputPass());

const vignetteGrain = new ShaderPass({
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uVignette: { value: 0.78 },
    uGrain: { value: 0.028 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uVignette;
    uniform float uGrain;
    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float d = distance(vUv, vec2(0.5));
      float vig = smoothstep(0.82, 0.28, d);
      color.rgb *= mix(uVignette, 1.0, vig);
      float grain = (hash(vUv * vec2(1920.0, 1080.0) + uTime) - 0.5) * uGrain;
      color.rgb += grain;
      gl_FragColor = color;
    }
  `,
});
composer.addPass(vignetteGrain);

function render() {
  composer.render();
  window.__renderReady = true;
  document.documentElement.dataset.ready = "true";
}

requestAnimationFrame(() => {
  render();
  requestAnimationFrame(render);
});

window.__render = { scene, camera, renderer, composer };
