import {
  AxesHelper,
  BoxGeometry,
  GridHelper,
  Group,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  Vector3,
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

export function render(renderer: WebGLRenderer) {
  const scene = new Scene();

  const sceneAxes = new AxesHelper(100);
  sceneAxes.setColors(0xff_ff_ff, 0xff_ff_ff, 0xff_ff_ff);
  scene.add(sceneAxes);

  const group = new Group();

  const groupAxes = new AxesHelper(3);
  groupAxes.setColors(0x00_00_ff, 0x00_00_ff, 0x00_00_ff);
  group.add(groupAxes);
  scene.add(group);

  const boxGeometry = new BoxGeometry(1, 1, 1);
  const material = new MeshBasicMaterial({ color: 0xff_00_00 });
  const mesh = new Mesh(boxGeometry, material);

  const meshAxes = new AxesHelper(3);
  meshAxes.setColors(0x00_ff_00, 0x00_ff_00, 0x00_ff_00);
  mesh.add(meshAxes);
  group.add(mesh);

  mesh.scale.x = 3;
  mesh.position.x = 1.5;
  group.position.x = 2;
  group.rotation.y = -Math.PI / 4;

  const gridHelper = new GridHelper(20, 20, 0xff_ff_ff);
  scene.add(gridHelper);

  const camera = new PerspectiveCamera(
    75,
    SIZES.width / SIZES.height,
    0.1,
    2000
  );
  scene.add(camera);

  camera.position.set(5, 5, 5);
  camera.lookAt(new Vector3(0, 0, 0));

  renderer.render(scene, camera);
}

export function run() {
  const canvas = setupCanvas();
  const renderer = setupRenderer(canvas);
  render(renderer);
}
