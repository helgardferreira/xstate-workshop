import { PerspectiveCamera, type Scene } from 'three';
import { OrbitControls } from 'three-stdlib';

import { fromWindowResize } from '../utils';

export type AppCamera = {
  camera: PerspectiveCamera;
  controls: OrbitControls;
  dispose: () => void;
  update: () => void;
};

// TODO: figure out custom camera controls for conveyor scene
// TODO: refactor this to a class
export function createAppCamera(
  scene: Scene,
  canvas: HTMLCanvasElement
): AppCamera {
  const camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  scene.add(camera);

  const controls = new OrbitControls(camera, canvas);

  const windowResizeSubscription = fromWindowResize().subscribe(
    ({ aspect }) => {
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
    }
  );

  const dispose = () => {
    controls.dispose();
    scene.remove(camera);
    windowResizeSubscription.unsubscribe();
  };

  const update = () => {
    controls.update();
  };

  return { camera, controls, dispose, update };
}
