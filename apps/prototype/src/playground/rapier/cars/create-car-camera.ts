import { PerspectiveCamera, type Scene } from 'three';
import { OrbitControls } from 'three-stdlib';

import { fromWindowResize } from '../../../utils';

export type CarCamera = {
  camera: PerspectiveCamera;
  controls: OrbitControls;
  dispose: () => void;
  update: () => void;
};

// TODO: create basic camera controls state machine
//       - perhaps base it off of orbit controls
//       - it should follow car game entity
//       - perhaps support mouse for damped rotating around car
// TODO: continue here...
export function createCarCamera(
  scene: Scene,
  canvas: HTMLCanvasElement
): CarCamera {
  const camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(4, 5, 4);
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
