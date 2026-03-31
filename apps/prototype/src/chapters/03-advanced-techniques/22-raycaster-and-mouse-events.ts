import { forkJoin, fromEvent, lastValueFrom } from 'rxjs';
import {
  AmbientLight,
  Camera,
  DirectionalLight,
  Group,
  type Intersection,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Raycaster,
  Scene,
  SphereGeometry,
  Timer,
  WebGLRenderer,
} from 'three';
import {
  DRACOLoader,
  type GLTF,
  GLTFLoader,
  OrbitControls,
  RaycasterHelper,
} from 'three-stdlib';

import { clamp, html } from '@xstate-workshop/utils';

import {
  PointerCoordinatesSubject,
  fromFullscreenKeyup,
  fromWindowResize,
  getDracoDecoderPathUrl,
  getModelUrl,
} from '../../utils';

function setupCanvas(): HTMLCanvasElement {
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

function setupRenderer(canvas: HTMLCanvasElement): WebGLRenderer {
  const renderer = new WebGLRenderer({ canvas });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(clamp(window.devicePixelRatio, 1, 2));

  return renderer;
}

type Models = {
  duck: GLTF;
};

function loadModels(): Promise<Models> {
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(getDracoDecoderPathUrl());
  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(dracoLoader);

  return lastValueFrom(
    forkJoin({
      duck: gltfLoader.loadAsync(getModelUrl('duck', 'gltf')),
    })
  );
}

function setupScene(models: Models) {
  const scene = new Scene();

  const camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 0, 3);

  const ambientLight = new AmbientLight(0xff_ff_ff, 2.1);

  const directionalLight = new DirectionalLight(0xff_ff_ff, 0.6);
  directionalLight.position.set(5, 5, 5);

  const sphere1 = new Mesh(
    new SphereGeometry(0.5, 16, 16),
    new MeshBasicMaterial({ color: 0xff_00_00 })
  );
  sphere1.position.set(-2, 0, 0);

  const sphere2 = new Mesh(
    new SphereGeometry(0.5, 16, 16),
    new MeshBasicMaterial({ color: 0xff_00_00 })
  );
  sphere2.position.set(2, 0, 0);

  const duck = new Group();
  duck.add(models.duck.scene);
  duck.position.set(0, -0.5, 0);

  const raycaster = new Raycaster();
  raycaster.far = 100;
  const raycasterHelper = new RaycasterHelper(raycaster);

  scene.add(
    ambientLight,
    camera,
    directionalLight,
    directionalLight.target,
    duck,
    raycasterHelper,
    sphere1,
    sphere2
  );

  return {
    camera,
    duck,
    raycaster,
    raycasterHelper,
    scene,
    sphere1,
    sphere2,
  };
}

function animate(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: Camera,
  onFrame?: (elapsedTime: number, deltaTime: number) => void
) {
  const timer = new Timer();

  let prevElapsedTime = 0;

  const tick = () => {
    timer.update();
    const elapsedTime = timer.getElapsed();
    const deltaTime = elapsedTime - prevElapsedTime;
    prevElapsedTime = elapsedTime;
    onFrame?.(elapsedTime, deltaTime);
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  };

  tick();
}

export async function run() {
  const canvas = setupCanvas();
  const renderer = setupRenderer(canvas);

  const models = await loadModels();

  const { camera, duck, raycaster, raycasterHelper, scene, sphere1, sphere2 } =
    setupScene(models);

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

  const orbitControls = new OrbitControls(camera, canvas);

  const pointerCoordinates = new PointerCoordinatesSubject();

  let currentIntersection: Intersection | null = null;

  /*
   * Naive implementation of `click` event handling using a raycaster.
   */
  fromEvent<PointerEvent>(window, 'click').subscribe((_event) => {
    if (currentIntersection) {
      if (
        duck.getObjectById(currentIntersection.object.id) ===
        currentIntersection.object
      ) {
        console.log('duck clicked');
      } else if (currentIntersection.object === sphere1) {
        console.log('sphere1 clicked');
      } else if (currentIntersection.object === sphere2) {
        console.log('sphere2 clicked');
      }
    }
  });

  animate(renderer, scene, camera, (elapsedTime) => {
    sphere1.position.y = Math.sin(elapsedTime * 0.3) * 1.5;
    sphere2.position.y = Math.sin(elapsedTime * 1.4) * 1.5;

    raycaster.setFromCamera(pointerCoordinates.getValue(), camera);

    const spheres = [sphere1, sphere2];
    const objectsToIntersect = [duck, sphere1, sphere2];
    const intersections = raycaster.intersectObjects(objectsToIntersect);

    spheres.forEach((object) => {
      object.material.color.set(0xff_00_00);
    });

    intersections.forEach((intersection) => {
      const object = intersection.object;

      if (
        object instanceof Mesh &&
        object.material instanceof MeshBasicMaterial
      ) {
        object.material.color.set(0x00_00_ff);
      }
    });

    /*
     * Naive implementation of `pointerenter` / `mouseenter` and
     * `pointerleave` / `mouseleave` events handling using a raycaster.
     */
    if (intersections.length > 0) {
      if (currentIntersection === null) {
        console.log('pointerenter');
      }

      currentIntersection = intersections[0];
    } else {
      if (currentIntersection !== null) {
        console.log('pointerleave');
      }

      currentIntersection = null;
    }

    raycasterHelper.hits = intersections;
    raycasterHelper.update();
    orbitControls.update();
  });
}
