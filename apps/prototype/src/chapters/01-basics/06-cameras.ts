import { type Controller, GUI } from 'lil-gui';
import { Observable, filter, fromEvent, map, switchMap, takeUntil } from 'rxjs';
import {
  BoxGeometry,
  Camera,
  Euler,
  GridHelper,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three-stdlib';

import { html, lerp, normalize } from '@xstate-workshop/utils';

const SIZES = {
  height: 400,
  width: 400,
};

export function setupCanvas(): HTMLCanvasElement {
  const root = document.getElementById('root');

  if (root === null) throw new Error('Root element is missing');

  root.innerHTML = html`
    <div class="grid h-screen w-screen place-items-center overflow-hidden">
      <div class="border-primary border-2">
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

type DimensionControllers = {
  x: Controller;
  y: Controller;
  z: Controller;
};

type Controllers<K extends string> = {
  [P in K]: {
    position: DimensionControllers | undefined;
    rotation: DimensionControllers | undefined;
  };
} & {
  addController<T extends { x: number; y: number; z: number }>(
    parentKey: K,
    childKey: 'position' | 'rotation',
    object: T,
    min?: number,
    max?: number
  ): void;
};

type ControllerFolders<K extends string> = {
  folders: {
    [P in K]: [
      parentFolder: GUI,
      childFolders: { position: GUI; rotation: GUI },
    ];
  };
};

class SceneControllers
  implements
    Controllers<'camera' | 'mesh'>,
    ControllerFolders<'camera' | 'mesh'>
{
  folders: {
    camera: [
      parentFolder: GUI,
      childFolders: {
        position: GUI;
        rotation: GUI;
      },
    ];
    mesh: [
      parentFolder: GUI,
      childFolders: {
        position: GUI;
        rotation: GUI;
      },
    ];
  };

  camera: {
    position: DimensionControllers | undefined;
    rotation: DimensionControllers | undefined;
  };
  mesh: {
    position: DimensionControllers | undefined;
    rotation: DimensionControllers | undefined;
  };

  constructor(gui: GUI) {
    const folderCamera = gui.addFolder('Camera');
    const folderCameraPosition = folderCamera.addFolder('Position');
    const folderCameraRotation = folderCamera.addFolder('Rotation');

    const folderMesh = gui.addFolder('Mesh');
    const folderMeshPosition = folderMesh.addFolder('Position');
    const folderMeshRotation = folderMesh.addFolder('Rotation');

    gui.close();
    folderCamera.close();
    folderMesh.close();

    this.folders = {
      camera: [
        folderCamera,
        {
          position: folderCameraPosition,
          rotation: folderCameraRotation,
        },
      ],
      mesh: [
        folderMesh,
        {
          position: folderMeshPosition,
          rotation: folderMeshRotation,
        },
      ],
    };

    this.camera = { position: undefined, rotation: undefined };
    this.mesh = { position: undefined, rotation: undefined };
  }

  addController<T extends { x: number; y: number; z: number }>(
    parentKey: 'camera' | 'mesh',
    childKey: 'position' | 'rotation',
    object: T,
    min?: number,
    max?: number
  ): void {
    const folder = this.folders[parentKey][1][childKey];

    const controllers = this[parentKey][childKey];

    if (controllers !== undefined) return;

    this[parentKey][childKey] = {
      x: folder.add(object, 'x', min, max),
      y: folder.add(object, 'y', min, max),
      z: folder.add(object, 'z', min, max),
    };
  }
}

export function setupScene(controllers: Controllers<'mesh'>): Scene {
  const scene = new Scene();

  const gridHelper = new GridHelper();
  scene.add(gridHelper);

  const boxGeometry = new BoxGeometry(1, 1, 1);

  const mesh = new Mesh(
    boxGeometry,
    new MeshBasicMaterial({ color: 0xff_00_00 })
  );
  mesh.position.set(0, 0.5, 0);
  scene.add(mesh);

  const meshAlt = new Mesh(
    boxGeometry,
    new MeshBasicMaterial({ color: 0x00_00_ff })
  );
  meshAlt.position.set(0, 0.5, -2);
  scene.add(meshAlt);

  controllers.addController('mesh', 'position', mesh.position, -10, 10);
  controllers.addController('mesh', 'rotation', mesh.rotation);

  return scene;
}

export function setupPerspectiveCamera(
  controllers: Controllers<'camera'>,
  scene: Scene
): PerspectiveCamera {
  const camera = new PerspectiveCamera(
    75,
    SIZES.width / SIZES.height,
    0.1,
    100
  );
  camera.position.set(0, 0.5, 5);
  scene.add(camera);

  controllers.addController('camera', 'position', camera.position, -10, 10);
  controllers.addController('camera', 'rotation', camera.rotation);

  return camera;
}

export function setupOrthographicCamera(
  controllers: Controllers<'camera'>,
  scene: Scene
): OrthographicCamera {
  /*
   * One approach to determine an orthographic camera's frustum plane positions
   * is to apply the canvas's aspect ratio to the `left` and `right` frustum
   * planes.
   *
   * This helps to prevent "stretching" of the orthographic camera's projection
   * matrix.
   */
  /*
  const aspectRatio = SIZES.width / SIZES.height;
  const camera = new OrthographicCamera(
    -1 * aspectRatio, // left
    1 * aspectRatio, // right
    1, // top
    -1, // bottom
    0.1, // near
    100 // far
  );
  */

  /*
   * Another approach to determine an orthographic camera's frustum plane
   * positions is to effectively position the frustum planes on the canvas's
   * bounding box - by using the distance relative to the center of the canvas.
   *
   * It's worth noting that this approach will most likely require the camera's
   * `zoom` property to be modified. Otherwise the objects in a scene might
   * appear too small - due to the lack of perspective regardless of camera
   * positioning.
   */
  const camera = new OrthographicCamera(
    SIZES.width / -2, // left
    SIZES.width / 2, // right
    SIZES.height / 2, // top
    SIZES.height / -2, // bottom
    0.1, // near
    100 // far
  );
  camera.zoom = 100;
  camera.updateProjectionMatrix();

  camera.position.set(2, 2, 2);
  camera.lookAt(0, 0, 0);
  scene.add(camera);

  controllers.addController('camera', 'position', camera.position, -10, 10);
  controllers.addController('camera', 'rotation', camera.rotation);

  return camera;
}

type Rect = {
  bottom: number;
  height: number;
  left: number;
  offset: { bottom: number; left: number; right: number; top: number };
  right: number;
  top: number;
  width: number;
};

function getRect(element: HTMLElement): Rect {
  const domRect = element.getBoundingClientRect();
  const styles = getComputedStyle(element);

  const offset = {
    bottom: parseFloat(styles.borderBottomWidth),
    left: parseFloat(styles.borderLeftWidth),
    right: parseFloat(styles.borderRightWidth),
    top: parseFloat(styles.borderTopWidth),
  };

  const bottom = domRect.bottom - offset.bottom;
  const left = domRect.left + offset.left;
  const right = domRect.right - offset.right;
  const top = domRect.top + offset.top;

  const height = bottom - top;
  const width = right - left;

  return { bottom, height, left, offset, right, top, width };
}

type PointerMove = {
  offsetX: number;
  offsetY: number;
  rect: Rect;
  withinBounds: boolean;
  x: number;
  y: number;
};

function fromPointerMove(element: HTMLElement): Observable<PointerMove> {
  const rect = getRect(element);

  return fromEvent<PointerEvent>(document, 'pointermove').pipe(
    map(({ x, y }) => {
      const offsetX = x - rect.left;
      const offsetY = y - rect.top;
      const withinBounds =
        offsetX >= 0 &&
        offsetX <= rect.width &&
        offsetY >= 0 &&
        offsetY <= rect.height;

      return { offsetX, offsetY, rect, withinBounds, x, y };
    })
  );
}

function toDeltaRotation() {
  const POINTER_SENSITIVITY = 0.002;
  let prevCoordinates: { x: number; y: number } | undefined;

  return (source: Observable<PointerMove>) =>
    source.pipe(
      filter((data) => {
        if (!data.withinBounds) prevCoordinates = undefined;

        return data.withinBounds === true;
      }),
      map(({ x, y }) => {
        if (prevCoordinates === undefined) {
          prevCoordinates = { x, y };
        }

        const deltaX = x - prevCoordinates.x;
        const deltaY = y - prevCoordinates.y;

        const rotateX = deltaY * POINTER_SENSITIVITY;

        const rotateY = deltaX * POINTER_SENSITIVITY;

        prevCoordinates = { x, y };

        return { rotateX, rotateY };
      })
    );
}

function toRelativeRotation() {
  return (source: Observable<PointerMove>) =>
    source.pipe(
      filter((data) => data.withinBounds === true),
      map(({ offsetX, offsetY, rect }) => {
        const normalizedX = normalize(offsetX, 0, rect.width);
        const normalizedY = normalize(offsetY, 0, rect.height);

        const rotateX = lerp(normalizedY, -Math.PI / 4, Math.PI / 4) * -1;
        const rotateY = lerp(normalizedX, -Math.PI / 4, Math.PI / 4) * -1;

        return { rotateX, rotateY };
      })
    );
}

export function addBasicDeltaControls(
  canvas: HTMLCanvasElement,
  camera: Camera
) {
  const euler = new Euler(0, 0, 0, 'YXZ');

  const subscription = fromPointerMove(canvas)
    .pipe(toDeltaRotation())
    .subscribe(({ rotateX, rotateY }) => {
      euler.setFromQuaternion(camera.quaternion);
      euler.y -= rotateY;
      euler.x -= rotateX;
      euler.x = Math.max(Math.min(euler.x, Math.PI / 2), Math.PI / 2 - Math.PI);

      camera.quaternion.setFromEuler(euler);
    });

  return () => subscription.unsubscribe();
}

export function addBasicDragControls(
  canvas: HTMLCanvasElement,
  camera: Camera
) {
  const euler = new Euler(0, 0, 0, 'YXZ');

  const subscription = fromEvent<PointerEvent>(canvas, 'pointerdown')
    .pipe(
      switchMap(() =>
        fromPointerMove(document.body).pipe(
          takeUntil(fromEvent(document, 'pointerup')),
          toDeltaRotation()
        )
      )
    )
    .subscribe(({ rotateX, rotateY }) => {
      euler.setFromQuaternion(camera.quaternion);
      euler.y += rotateY;
      euler.x += rotateX;
      euler.x = Math.max(Math.min(euler.x, Math.PI / 2), Math.PI / 2 - Math.PI);

      camera.quaternion.setFromEuler(euler);
    });

  return () => subscription.unsubscribe();
}

export function addBasicOrbitControls(
  canvas: HTMLCanvasElement,
  camera: Camera
): () => void {
  const subscription = fromPointerMove(canvas)
    .pipe(
      filter((data) => data.withinBounds === true),
      map(({ offsetX, offsetY, rect }) => {
        const normalizedX = normalize(offsetX, 0, rect.width);
        const normalizedY = normalize(offsetY, 0, rect.height);

        const positionX = Math.sin(lerp(normalizedX, -Math.PI, Math.PI)) * 5;
        const positionY = lerp(normalizedY, 5, 0.5);
        const positionZ = Math.cos(lerp(normalizedX, -Math.PI, Math.PI)) * 5;

        return { positionX, positionY, positionZ };
      })
    )
    .subscribe(({ positionX, positionY, positionZ }) => {
      camera.position.set(positionX, positionY, positionZ);
      camera.lookAt(0, 0.5, 0);
    });

  return () => subscription.unsubscribe();
}

export function addBasicRelativeControls(
  canvas: HTMLCanvasElement,
  camera: Camera
): () => void {
  const euler = new Euler(0, 0, 0, 'YXZ');

  const subscription = fromPointerMove(canvas)
    .pipe(toRelativeRotation())
    .subscribe(({ rotateX, rotateY }) => {
      euler.setFromQuaternion(camera.quaternion);
      euler.y = rotateY;
      euler.x = rotateX;
      camera.quaternion.setFromEuler(euler);
    });

  return () => subscription.unsubscribe();
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

export function run() {
  const gui = new GUI();
  const controllers = new SceneControllers(gui);

  const canvas = setupCanvas();
  const renderer = setupRenderer(canvas);
  const scene = setupScene(controllers);
  /* const camera = setupOrthographicCamera(controllers, scene); */
  const camera = setupPerspectiveCamera(controllers, scene);

  /*
  addBasicDeltaControls(canvas, camera);
  addBasicDragControls(canvas, camera);
  addBasicOrbitControls(canvas, camera);
  addBasicRelativeControls(canvas, camera);
  */
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;

  animate(renderer, scene, camera, () => controls.update());
}
