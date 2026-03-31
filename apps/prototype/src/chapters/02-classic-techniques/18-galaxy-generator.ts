import type { GUI } from 'lil-gui';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Camera,
  Color,
  type ColorRepresentation,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  Timer,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three-stdlib';

import { clamp, html } from '@xstate-workshop/utils';

import {
  createControlsPanel,
  fromFullscreenKeyup,
  fromWindowResize,
} from '../../utils';

const DEFAULT_BRANCHES = 3;
const DEFAULT_COUNT = 100_000;
const DEFAULT_CRUSH_POWER = 3;
const DEFAULT_INNER_COLOR = 0xff_60_30;
const DEFAULT_OUTER_COLOR = 0x1b_39_84;
const DEFAULT_RADIUS = 5;
const DEFAULT_RANDOMNESS = 0.2;
const DEFAULT_SIZE = 0.01;
const DEFAULT_SIZE_ATTENUATION = true;
const DEFAULT_SPIN = 1;

export function setupCanvas(): HTMLCanvasElement {
  const root = document.getElementById('root');

  if (root === null) throw new Error('Root element is missing');

  root.innerHTML = html`
    <div class="h-screen w-screen overflow-hidden">
      <canvas class="scene outline-none"></canvas>
    </div>
  `;

  const canvas = document.querySelector<HTMLCanvasElement>('canvas.scene');

  if (canvas === null) throw new Error('Scene canvas element is missing');

  return canvas;
}

export function setupRenderer(canvas: HTMLCanvasElement): WebGLRenderer {
  const renderer = new WebGLRenderer({ canvas });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(clamp(window.devicePixelRatio, 1, 2));

  return renderer;
}

function calculatePositionDither(
  spread: number,
  crushPower: number,
  randomness: number
) {
  const bias = Math.random() < 0.5 ? 1 : -1;
  const crush = Math.pow(Math.random(), crushPower);
  return crush * bias * spread * randomness;
}

type GalaxyBuilderOptions = {
  branches?: number;
  colors?: {
    inner: ColorRepresentation;
    outer: ColorRepresentation;
  };
  count?: number;
  crushPower?: number;
  radius?: number;
  randomness?: number;
  size?: number;
  sizeAttenuation?: boolean;
  spin?: number;
};

type GalaxyBuilder = (
  options?: GalaxyBuilderOptions
) => Points<BufferGeometry, PointsMaterial>;

function createGalaxyBuilder(): GalaxyBuilder {
  const galaxy = new Points<BufferGeometry, PointsMaterial>();

  return (options?: GalaxyBuilderOptions) => {
    const {
      branches = DEFAULT_BRANCHES,
      colors = {
        inner: DEFAULT_INNER_COLOR,
        outer: DEFAULT_OUTER_COLOR,
      },
      count = DEFAULT_COUNT,
      crushPower = DEFAULT_CRUSH_POWER,
      radius = DEFAULT_RADIUS,
      randomness = DEFAULT_RANDOMNESS,
      size = DEFAULT_SIZE,
      sizeAttenuation = DEFAULT_SIZE_ATTENUATION,
      spin = DEFAULT_SPIN,
    } = options ?? {};

    galaxy.geometry.dispose();
    galaxy.material.dispose();

    const vertexColors = new Float32Array(count * 3);
    const vertexPositions = new Float32Array(count * 3);

    const innerColor = new Color(colors.inner);
    const outerColor = new Color(colors.outer);

    for (let i = 0; i < count; i++) {
      const [xIdx, yIdx, zIdx] = [i * 3, i * 3 + 1, i * 3 + 2];

      const offset = (((i % branches) + 1) / branches) * Math.PI * 2;
      const distance = Math.random();
      const spread = distance * radius;
      const ditherX = calculatePositionDither(spread, crushPower, randomness);
      const ditherY = calculatePositionDither(spread, crushPower, randomness);
      const ditherZ = calculatePositionDither(spread, crushPower, randomness);
      const theta = spread * spin;

      const x = Math.cos(theta + offset) * spread + ditherX;
      const y = ditherY;
      const z = Math.sin(theta + offset) * spread + ditherZ;

      const blendColor = innerColor.clone();
      blendColor.lerp(outerColor, distance);

      vertexColors[xIdx] = blendColor.r;
      vertexColors[yIdx] = blendColor.g;
      vertexColors[zIdx] = blendColor.b;

      vertexPositions[xIdx] = x;
      vertexPositions[yIdx] = y;
      vertexPositions[zIdx] = z;
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute('color', new BufferAttribute(vertexColors, 3));
    geometry.setAttribute('position', new BufferAttribute(vertexPositions, 3));

    const material = new PointsMaterial({
      blending: AdditiveBlending,
      depthWrite: false,
      size,
      sizeAttenuation,
      vertexColors: true,
    });

    galaxy.geometry = geometry;
    galaxy.material = material;

    return galaxy;
  };
}

export function setupScene() {
  const scene = new Scene();

  const camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  camera.position.set(5, 5, 5);

  const buildGalaxy = createGalaxyBuilder();

  scene.add(camera, buildGalaxy());

  return { buildGalaxy, camera, scene };
}

export function animate(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: Camera,
  onFrame?: (elapsedTime: number) => void
) {
  const timer = new Timer();

  const tick = () => {
    timer.update();
    const elapsedTime = timer.getElapsed();
    renderer.render(scene, camera);
    onFrame?.(elapsedTime);
    requestAnimationFrame(tick);
  };

  tick();
}

function setupPanelControllers(gui: GUI, buildGalaxy: GalaxyBuilder) {
  const folderGalaxy = gui.addFolder('Galaxy');

  const folderGalaxyPoints = folderGalaxy.addFolder('Points');
  const folderGalaxyColors = folderGalaxyPoints.addFolder('Colors');

  const folderGalaxyMaterial = folderGalaxy.addFolder('Material');

  const controls = {
    galaxy: {
      points: {
        colors: {
          inner: DEFAULT_INNER_COLOR,
          outer: DEFAULT_OUTER_COLOR,
        },
        branches: DEFAULT_BRANCHES,
        count: DEFAULT_COUNT,
        crushPower: DEFAULT_CRUSH_POWER,
        radius: DEFAULT_RADIUS,
        randomness: DEFAULT_RANDOMNESS,
        spin: DEFAULT_SPIN,
      },
      material: {
        size: DEFAULT_SIZE,
        sizeAttenuation: DEFAULT_SIZE_ATTENUATION,
      },
    },
  };

  const controllers = {
    galaxy: {
      points: {
        colors: {
          inner: folderGalaxyColors
            .addColor(controls.galaxy.points.colors, 'inner')
            .name('Inner'),
          outer: folderGalaxyColors
            .addColor(controls.galaxy.points.colors, 'outer')
            .name('Outer'),
        },
        branches: folderGalaxyPoints
          .add(controls.galaxy.points, 'branches')
          .max(10)
          .min(1)
          .name('Branches')
          .step(1),
        count: folderGalaxyPoints
          .add(controls.galaxy.points, 'count')
          .max(1_000_000)
          .min(100)
          .name('Count')
          .step(100),
        crushPower: folderGalaxyPoints
          .add(controls.galaxy.points, 'crushPower')
          .max(10)
          .min(1)
          .name('Crush Power')
          .step(0.001),
        radius: folderGalaxyPoints
          .add(controls.galaxy.points, 'radius')
          .max(20)
          .min(0.01)
          .name('Radius')
          .step(0.01),
        randomness: folderGalaxyPoints
          .add(controls.galaxy.points, 'randomness')
          .min(0)
          .max(2)
          .name('Randomness')
          .step(0.001),
        spin: folderGalaxyPoints
          .add(controls.galaxy.points, 'spin')
          .max(5)
          .min(-5)
          .name('Spin')
          .step(0.001),
      },
      material: {
        size: folderGalaxyMaterial
          .add(controls.galaxy.material, 'size')
          .max(0.1)
          .min(0.001)
          .name('Size')
          .step(0.001),
        sizeAttenuation: folderGalaxyMaterial
          .add(controls.galaxy.material, 'sizeAttenuation')
          .name('Size Attenuation'),
      },
    },
  };

  function rebuildGalaxy() {
    buildGalaxy({
      colors: {
        inner: controls.galaxy.points.colors.inner,
        outer: controls.galaxy.points.colors.outer,
      },
      branches: controls.galaxy.points.branches,
      count: controls.galaxy.points.count,
      crushPower: controls.galaxy.points.crushPower,
      radius: controls.galaxy.points.radius,
      randomness: controls.galaxy.points.randomness,
      spin: controls.galaxy.points.spin,
      size: controls.galaxy.material.size,
      sizeAttenuation: controls.galaxy.material.sizeAttenuation,
    });
  }

  controllers.galaxy.points.colors.inner.onFinishChange(rebuildGalaxy);
  controllers.galaxy.points.colors.outer.onFinishChange(rebuildGalaxy);
  controllers.galaxy.points.branches.onFinishChange(rebuildGalaxy);
  controllers.galaxy.points.count.onFinishChange(rebuildGalaxy);
  controllers.galaxy.points.crushPower.onFinishChange(rebuildGalaxy);
  controllers.galaxy.points.radius.onFinishChange(rebuildGalaxy);
  controllers.galaxy.points.randomness.onFinishChange(rebuildGalaxy);
  controllers.galaxy.points.spin.onFinishChange(rebuildGalaxy);
  controllers.galaxy.material.size.onFinishChange(rebuildGalaxy);
  controllers.galaxy.material.sizeAttenuation.onFinishChange(rebuildGalaxy);

  return () => {
    folderGalaxy.destroy();
  };
}

export function run() {
  const gui = createControlsPanel({ hide: true });

  const canvas = setupCanvas();
  const renderer = setupRenderer(canvas);

  const { buildGalaxy, camera, scene } = setupScene();

  setupPanelControllers(gui, buildGalaxy);

  fromWindowResize().subscribe(({ aspect, height, width }) => {
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    renderer.setPixelRatio(clamp(window.devicePixelRatio, 1, 2));
  });

  fromFullscreenKeyup().subscribe((shouldFullscreen) => {
    if (shouldFullscreen) canvas.requestFullscreen();
    else document.exitFullscreen();
  });

  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = false;

  animate(renderer, scene, camera, () => {
    controls.update();
  });
}
