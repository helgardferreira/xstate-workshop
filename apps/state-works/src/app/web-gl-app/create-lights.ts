import {
  AmbientLight,
  CameraHelper,
  Color,
  DirectionalLight,
  DirectionalLightHelper,
  type Scene,
} from 'three';

export type Lights = {
  ambientLight: AmbientLight;
  directionalLight: DirectionalLight;
  dispose: () => void;
  helpers: {
    directionalLight: DirectionalLightHelper;
    directionalLightCamera: CameraHelper;
  };
};

// TODO: implement this later when composing conveyor scene
export function createLights(scene: Scene): Lights {
  const ambientLight = new AmbientLight(0xff_ff_ff, 2.1);
  ambientLight.visible = false;

  const directionalLight = new DirectionalLight(new Color(3, 2, 2.5), 2.1);
  directionalLight.position.set(-20, 14, -7);

  directionalLight.shadow.camera.bottom = -15;
  directionalLight.shadow.camera.near = 5;
  directionalLight.shadow.camera.far = 40;
  directionalLight.shadow.camera.left = -15;
  directionalLight.shadow.camera.right = 15;
  directionalLight.shadow.camera.top = 15;
  directionalLight.shadow.mapSize.set(4096, 4096);
  directionalLight.shadow.normalBias = 0.01;
  directionalLight.shadow.bias = 0;
  directionalLight.castShadow = true;

  const helpers = {
    directionalLight: new DirectionalLightHelper(directionalLight),
    directionalLightCamera: new CameraHelper(directionalLight.shadow.camera),
  };

  helpers.directionalLight.visible = false;
  helpers.directionalLightCamera.visible = false;

  scene.add(
    ambientLight,
    directionalLight,
    directionalLight.target,
    helpers.directionalLight,
    helpers.directionalLightCamera
  );

  const dispose = () => {
    scene.remove(
      ambientLight,
      directionalLight,
      directionalLight.target,
      helpers.directionalLight,
      helpers.directionalLightCamera
    );
  };

  return { ambientLight, directionalLight, dispose, helpers };
}
