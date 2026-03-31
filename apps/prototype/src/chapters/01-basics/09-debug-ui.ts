import { GUI } from 'lil-gui';
import {
  BoxGeometry,
  Camera,
  Clock,
  GridHelper,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three-stdlib';

import { clamp, html } from '@xstate-workshop/utils';

import {
  createControlsPanel,
  fromFullscreenKeyup,
  fromWindowResize,
} from '../../utils';

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

export function setupScene() {
  const scene = new Scene();

  const gridHelper = new GridHelper(50, 50);
  scene.add(gridHelper);

  const boxGeometry = new BoxGeometry(1, 1, 1, 2, 2, 2);
  const material = new MeshBasicMaterial({
    color: 0xff_00_00,
    wireframe: true,
  });
  const mesh = new Mesh(boxGeometry, material);
  mesh.position.set(0, 0.5, 0);
  scene.add(mesh);

  const camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  camera.position.set(3, 3, 3);
  scene.add(camera);

  return { camera, mesh, scene };
}

export function animate(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: Camera,
  onFrame?: () => void
) {
  const tick = () => {
    renderer.render(scene, camera);
    onFrame?.();
    requestAnimationFrame(tick);
  };

  tick();
}

function prepareSpinAnimation(mesh: Mesh<BoxGeometry, MeshBasicMaterial>) {
  let requestId: number | undefined;

  return () => {
    if (requestId) cancelAnimationFrame(requestId);

    const clock = new Clock();

    const tick = () => {
      const elapsedTime = clock.getElapsedTime();

      const rotateY = elapsedTime * 10;

      if (rotateY >= Math.PI * 2) {
        mesh.rotation.y = Math.PI * 2;
        requestId = undefined;
      } else {
        mesh.rotation.y = rotateY;
        requestId = requestAnimationFrame(tick);
      }
    };

    tick();
  };
}

export function setupPanelControllers(
  gui: GUI,
  mesh: Mesh<BoxGeometry, MeshBasicMaterial>
) {
  const folderMesh = gui.addFolder('Mesh');
  const folderMeshGeometry = folderMesh.addFolder('Geometry');
  const folderMeshPosition = folderMesh.addFolder('Position');

  const controls = {
    mesh: {
      geometry: {
        width: mesh.geometry.parameters.width,
        height: mesh.geometry.parameters.height,
        depth: mesh.geometry.parameters.depth,
        widthSegments: mesh.geometry.parameters.widthSegments,
        heightSegments: mesh.geometry.parameters.heightSegments,
        depthSegments: mesh.geometry.parameters.depthSegments,
      },
      position: mesh.position.clone(),
      color: mesh.material.color.getHex(),
      visible: mesh.material.visible,
      wireframe: mesh.material.wireframe,
      spin: prepareSpinAnimation(mesh),
    },
  };

  const controllers = {
    mesh: {
      geometry: {
        width: folderMeshGeometry
          .add(controls.mesh.geometry, 'width')
          .max(10)
          .min(0.01)
          .step(0.01),
        height: folderMeshGeometry
          .add(controls.mesh.geometry, 'height')
          .max(10)
          .min(0.01)
          .step(0.01),
        depth: folderMeshGeometry
          .add(controls.mesh.geometry, 'depth')
          .max(10)
          .min(0.01)
          .step(0.01),
        widthSegments: folderMeshGeometry
          .add(controls.mesh.geometry, 'widthSegments')
          .max(10)
          .min(1)
          .step(1),
        heightSegments: folderMeshGeometry
          .add(controls.mesh.geometry, 'heightSegments')
          .max(10)
          .min(1)
          .step(1),
        depthSegments: folderMeshGeometry
          .add(controls.mesh.geometry, 'depthSegments')
          .max(10)
          .min(1)
          .step(1),
      },
      position: {
        x: folderMeshPosition
          .add(controls.mesh.position, 'x')
          .max(10)
          .min(-10)
          .step(0.01),
        y: folderMeshPosition
          .add(controls.mesh.position, 'y')
          .max(10)
          .min(-10)
          .step(0.01),
        z: folderMeshPosition
          .add(controls.mesh.position, 'z')
          .max(10)
          .min(-10)
          .step(0.01),
      },
      color: folderMesh.addColor(controls.mesh, 'color').name('Color'),
      visible: folderMesh.add(controls.mesh, 'visible').name('Is Visible'),
      wireframe: folderMesh
        .add(controls.mesh, 'wireframe')
        .name('Show Wireframe'),
      spin: folderMesh.add(controls.mesh, 'spin'),
    },
  };

  function updateMeshGeometry() {
    const boxGeometry = new BoxGeometry(
      controls.mesh.geometry.width,
      controls.mesh.geometry.height,
      controls.mesh.geometry.depth,
      controls.mesh.geometry.widthSegments,
      controls.mesh.geometry.heightSegments,
      controls.mesh.geometry.depthSegments
    );

    mesh.geometry.dispose();
    mesh.geometry = boxGeometry;
  }

  controllers.mesh.geometry.width.onChange(updateMeshGeometry);
  controllers.mesh.geometry.height.onChange(updateMeshGeometry);
  controllers.mesh.geometry.depth.onChange(updateMeshGeometry);
  controllers.mesh.geometry.widthSegments.onChange(updateMeshGeometry);
  controllers.mesh.geometry.heightSegments.onChange(updateMeshGeometry);
  controllers.mesh.geometry.depthSegments.onChange(updateMeshGeometry);
  controllers.mesh.position.x.onChange((value: number) => {
    mesh.position.setX(value);
  });
  controllers.mesh.position.y.onChange((value: number) => {
    mesh.position.setY(value);
  });
  controllers.mesh.position.z.onChange((value: number) => {
    mesh.position.setZ(value);
  });
  controllers.mesh.color.onChange((value: number) => {
    mesh.material.color.set(value);
  });
  controllers.mesh.visible.onChange((value: boolean) => {
    mesh.material.visible = value;
  });
  controllers.mesh.wireframe.onChange((value: boolean) => {
    mesh.material.wireframe = value;
  });

  return () => {
    controllers.mesh.color.destroy();
    controllers.mesh.position.x.destroy();
    controllers.mesh.position.y.destroy();
    controllers.mesh.position.z.destroy();
    controllers.mesh.visible.destroy();
    controllers.mesh.wireframe.destroy();
  };
}

export function run() {
  const gui = createControlsPanel();

  const canvas = setupCanvas();
  const renderer = setupRenderer(canvas);
  const { camera, mesh, scene } = setupScene();
  setupPanelControllers(gui, mesh);
  const orbitControls = new OrbitControls(camera, canvas);

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

  animate(renderer, scene, camera, () => orbitControls.update());
}
