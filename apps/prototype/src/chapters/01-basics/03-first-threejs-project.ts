import {
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';

import { html } from '@xstate-workshop/utils';

const SIZES = {
  height: 400,
  width: 600,
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

export function render(renderer: WebGLRenderer) {
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
  camera.position.z = 5;
  scene.add(camera);

  renderer.render(scene, camera);
}

export function run() {
  const canvas = setupCanvas();
  const renderer = setupRenderer(canvas);
  render(renderer);
}
