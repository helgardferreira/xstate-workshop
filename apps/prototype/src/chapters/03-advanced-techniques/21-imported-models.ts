import type { GUI } from 'lil-gui';
import { forkJoin, lastValueFrom } from 'rxjs';
import {
  AmbientLight,
  AnimationMixer,
  Camera,
  DirectionalLight,
  DirectionalLightHelper,
  Group,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  Timer,
  WebGLRenderer,
} from 'three';
import { DRACOLoader, type GLTF, GLTFLoader } from 'three/addons';
import { OrbitControls } from 'three-stdlib';

import { clamp, html } from '@xstate-workshop/utils';

import {
  createControlsPanel,
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
  duckOne: GLTF;
  duckTwo: GLTF;
  duckThree: GLTF;
  duckFour: GLTF;
  flightHelmet: GLTF;
  foxOne: GLTF;
  foxTwo: GLTF;
  foxThree: GLTF;
};

function loadModels(): Promise<Models> {
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(getDracoDecoderPathUrl());
  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(dracoLoader);

  return lastValueFrom(
    forkJoin({
      duckOne: gltfLoader.loadAsync(getModelUrl('duck', 'gltf')),
      duckTwo: gltfLoader.loadAsync(getModelUrl('duck', 'gltf-binary')),
      duckThree: gltfLoader.loadAsync(getModelUrl('duck', 'gltf-embedded')),
      duckFour: gltfLoader.loadAsync(getModelUrl('duck', 'gltf-draco')),
      flightHelmet: gltfLoader.loadAsync(getModelUrl('flight-helmet', 'gltf')),
      foxOne: gltfLoader.loadAsync(getModelUrl('fox', 'gltf')),
      foxTwo: gltfLoader.loadAsync(getModelUrl('fox', 'gltf-binary')),
      foxThree: gltfLoader.loadAsync(getModelUrl('fox', 'gltf-embedded')),
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
  camera.position.set(7, 7, 7);

  const ambientLight = new AmbientLight(0xff_ff_ff, 2.1);

  const directionalLight = new DirectionalLight(0xff_ff_ff, 0.6);
  directionalLight.position.set(5, 5, 5);
  const directionalLightHelper = new DirectionalLightHelper(directionalLight);
  directionalLightHelper.visible = false;

  const floor = new Mesh(
    new PlaneGeometry(10, 10),
    new MeshStandardMaterial({
      color: 0x77_77_77,
      metalness: 0.3,
      roughness: 0.4,
    })
  );
  floor.rotation.x = -Math.PI * 0.5;

  const ducks = new Group();

  const duckOne = new Group();
  duckOne.add(models.duckOne.scene);
  duckOne.position.set(0, 0, 0);

  const duckTwo = new Group();
  duckTwo.add(models.duckTwo.scene);
  duckTwo.position.set(0, 0, 1.5);

  const duckThree = new Group();
  duckThree.add(models.duckThree.scene);
  duckThree.position.set(0, 0, 3);

  const duckFour = new Group();
  duckFour.add(models.duckFour.scene);
  duckFour.position.set(0, 0, 4.5);

  ducks.add(duckOne, duckTwo, duckThree, duckFour);
  ducks.position.set(2, 0, -1);
  ducks.rotation.set(0, -Math.PI / 2, 0);

  const flightHelmetModel = models.flightHelmet;

  /*
  while (flightHelmetModel.scene.children.length) {
    scene.add(flightHelmetModel.scene.children[0]);
  }
  */
  /*
  const flightHelmetChildren = [...flightHelmetModel.scene.children];
  flightHelmetChildren.forEach((child) => {
    scene.add(child);
  });
  */

  const flightHelmet = new Group();
  flightHelmet.add(flightHelmetModel.scene);
  flightHelmet.position.set(0, 0, -4);
  flightHelmet.scale.multiplyScalar(5);

  const foxes = new Group();

  const foxOne = new Group();
  const foxOneModel = models.foxOne;
  const foxOneAnimationMixer = new AnimationMixer(foxOneModel.scene);
  foxOneAnimationMixer.clipAction(foxOneModel.animations[0]).play();
  foxOne.position.set(-2, 0, 3);
  foxOne.scale.multiplyScalar(0.025);
  foxOne.add(foxOneModel.scene);

  const foxTwo = new Group();
  const foxTwoModel = models.foxTwo;
  const foxTwoAnimationMixer = new AnimationMixer(foxTwoModel.scene);
  foxTwoAnimationMixer.clipAction(foxTwoModel.animations[1]).play();
  foxTwo.position.set(0, 0, 3);
  foxTwo.scale.multiplyScalar(0.025);
  foxTwo.add(foxTwoModel.scene);

  const foxThree = new Group();
  const foxThreeModel = models.foxThree;
  const foxThreeAnimationMixer = new AnimationMixer(foxThreeModel.scene);
  foxThreeAnimationMixer.clipAction(foxThreeModel.animations[2]).play();
  foxThree.position.set(2, 0, 3);
  foxThree.scale.multiplyScalar(0.025);
  foxThree.add(foxThreeModel.scene);

  foxes.add(foxOne, foxTwo, foxThree);

  scene.add(
    ambientLight,
    camera,
    directionalLight,
    directionalLight.target,
    directionalLightHelper,
    ducks,
    flightHelmet,
    floor,
    foxes
  );

  return {
    ambientLight,
    camera,
    directionalLight,
    directionalLightHelper,
    floor,
    foxOneAnimationMixer,
    foxThreeAnimationMixer,
    foxTwoAnimationMixer,
    scene,
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

function setupPanelControllers(
  gui: GUI,
  ambientLight: AmbientLight,
  directionalLight: DirectionalLight,
  directionalLightHelper: DirectionalLightHelper
) {
  const folderLights = gui.addFolder('Lights');

  const folderLightsAmbient = folderLights.addFolder('Ambient Light');
  folderLightsAmbient.close();

  const folderLightsDirectional = folderLights.addFolder('Directional Light');
  const folderLightsDirectionalPosition =
    folderLightsDirectional.addFolder('Position');
  folderLightsDirectionalPosition.close();

  const controls = {
    lights: {
      ambientLight: {
        color: ambientLight.color.getHex(),
        intensity: ambientLight.intensity,
        visible: ambientLight.visible,
      },
      directionalLight: {
        position: directionalLight.position,
        color: directionalLight.color.getHex(),
        intensity: directionalLight.intensity,
        visible: directionalLight.visible,
        helper: directionalLightHelper.visible,
      },
    },
  };

  const controllers = {
    lights: {
      ambientLight: {
        color: folderLightsAmbient
          .addColor(controls.lights.ambientLight, 'color')
          .name('Color'),
        intensity: folderLightsAmbient
          .add(controls.lights.ambientLight, 'intensity')
          .max(3)
          .min(0)
          .name('Intensity')
          .step(0.001),
        visible: folderLightsAmbient
          .add(controls.lights.ambientLight, 'visible')
          .name('Visible'),
      },
      directionalLight: {
        position: {
          x: folderLightsDirectionalPosition
            .add(controls.lights.directionalLight.position, 'x')
            .max(20)
            .min(-20)
            .step(0.01),
          y: folderLightsDirectionalPosition
            .add(controls.lights.directionalLight.position, 'y')
            .max(20)
            .min(-20)
            .step(0.01),
          z: folderLightsDirectionalPosition
            .add(controls.lights.directionalLight.position, 'z')
            .max(20)
            .min(-20)
            .step(0.01),
        },
        color: folderLightsDirectional
          .addColor(controls.lights.directionalLight, 'color')
          .name('Color'),
        intensity: folderLightsDirectional
          .add(controls.lights.directionalLight, 'intensity')
          .max(3)
          .min(0)
          .name('Intensity')
          .step(0.001),
        visible: folderLightsDirectional
          .add(controls.lights.directionalLight, 'visible')
          .name('Visible'),
        helper: folderLightsDirectional
          .add(controls.lights.directionalLight, 'helper')
          .name('Helper'),
      },
    },
  };

  controllers.lights.ambientLight.color.onChange((value: number) => {
    ambientLight.color.set(value);
  });
  controllers.lights.ambientLight.intensity.onChange((value: number) => {
    ambientLight.intensity = value;
  });
  controllers.lights.ambientLight.visible.onChange((value: boolean) => {
    ambientLight.visible = value;
  });

  const updateDirectionalLightTransform = () => {
    directionalLightHelper.update();
  };

  controllers.lights.directionalLight.position.x.onChange(
    updateDirectionalLightTransform
  );
  controllers.lights.directionalLight.position.y.onChange(
    updateDirectionalLightTransform
  );
  controllers.lights.directionalLight.position.z.onChange(
    updateDirectionalLightTransform
  );

  controllers.lights.directionalLight.color.onChange((value: number) => {
    directionalLight.color.set(value);
    directionalLightHelper.update();
  });
  controllers.lights.directionalLight.intensity.onChange((value: number) => {
    directionalLight.intensity = value;
  });
  controllers.lights.directionalLight.visible.onChange((value: boolean) => {
    directionalLight.visible = value;
    directionalLightHelper.visible =
      value && controls.lights.directionalLight.helper;
  });
  controllers.lights.directionalLight.helper.onChange((value: boolean) => {
    directionalLightHelper.visible =
      value && controls.lights.directionalLight.visible;
  });

  return () => {
    folderLights.destroy();
  };
}

export async function run() {
  const gui = createControlsPanel({ hide: true });
  const canvas = setupCanvas();
  const renderer = setupRenderer(canvas);

  const models = await loadModels();

  const {
    ambientLight,
    camera,
    directionalLight,
    directionalLightHelper,
    foxOneAnimationMixer,
    foxThreeAnimationMixer,
    foxTwoAnimationMixer,
    scene,
  } = setupScene(models);

  setupPanelControllers(
    gui,
    ambientLight,
    directionalLight,
    directionalLightHelper
  );

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
  orbitControls.maxPolarAngle = 1.4;

  animate(renderer, scene, camera, (elapsedTime, deltaTime) => {
    foxOneAnimationMixer.update(deltaTime);
    foxTwoAnimationMixer.update(deltaTime);
    foxThreeAnimationMixer.update(deltaTime);
    orbitControls.update();
  });
}
