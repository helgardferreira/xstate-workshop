import {
  BoxGeometry,
  Camera,
  Clock,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';

import { html } from '@xstate-workshop/utils';

const SIZES = {
  height: 400,
  width: 400,
};

export function setupCanvas(): HTMLCanvasElement {
  const root = document.getElementById('root');

  if (root === null) throw new Error('Root element is missing');

  root.innerHTML = html`
    <div class="grid h-screen w-screen place-items-center overflow-hidden">
      <div class="outline-primary outline-2 outline-offset-2">
        <canvas class="scene"></canvas>
      </div>
    </div>
  `;

  const canvas = document.querySelector<HTMLCanvasElement>('canvas.scene');

  if (canvas === null) throw new Error('Scene canvas element is missing');

  return canvas;
}

export function setupRenderer(canvas: HTMLCanvasElement): WebGLRenderer {
  const renderer = new WebGLRenderer({ canvas });
  renderer.setSize(SIZES.width, SIZES.height);

  return renderer;
}

export function setupScene() {
  const scene = new Scene();

  const boxGeometry = new BoxGeometry(1, 1, 1);
  const material = new MeshBasicMaterial({ color: 0xff_00_00 });
  const mesh = new Mesh(boxGeometry, material);
  scene.add(mesh);

  const camera = new PerspectiveCamera(
    75,
    SIZES.width / SIZES.height,
    0.1,
    2000
  );
  camera.position.z = 3;
  scene.add(camera);

  return { camera, mesh, scene };
}

export function animate(
  canvas: HTMLCanvasElement,
  scene: Scene,
  camera: Camera,
  mesh: Mesh
) {
  const renderer = setupRenderer(canvas);
  const clock = new Clock();

  const tick = () => {
    const elapsed = clock.getElapsedTime();

    camera.position.x = Math.sin(elapsed);
    camera.position.y = Math.cos(elapsed);
    camera.lookAt(mesh.position);

    renderer.render(scene, camera);

    requestAnimationFrame(tick);
  };

  tick();
}

export function run() {
  const canvas = setupCanvas();
  const { camera, mesh, scene } = setupScene();
  animate(canvas, scene, camera, mesh);
}
