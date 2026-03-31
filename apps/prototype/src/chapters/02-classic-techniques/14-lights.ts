import type { GUI } from 'lil-gui';
import {
  AmbientLight,
  BoxGeometry,
  Camera,
  Clock,
  DirectionalLight,
  DirectionalLightHelper,
  DoubleSide,
  Euler,
  HemisphereLight,
  HemisphereLightHelper,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  PointLightHelper,
  Quaternion,
  RectAreaLight,
  Scene,
  SphereGeometry,
  SpotLight,
  SpotLightHelper,
  TorusGeometry,
  Vector3,
  WebGLRenderer,
} from 'three';
import {
  OrbitControls,
  RectAreaLightHelper,
  RectAreaLightUniformsLib,
} from 'three-stdlib';

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

  const camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  camera.position.set(1, 1, 2);

  const ambientLight = new AmbientLight(0xff_ff_ff, 1);
  ambientLight.visible = false;
  scene.add(ambientLight);

  const directionalLight = new DirectionalLight(0x00_ff_fc, 0.9);
  directionalLight.position.set(0, 2, 0);
  directionalLight.target.position.copy(
    new Vector3().addVectors(directionalLight.position, new Vector3(0, -1, 0))
  );
  const directionalLightHelper = new DirectionalLightHelper(directionalLight);
  directionalLight.visible = false;
  directionalLightHelper.visible = false;
  scene.add(directionalLight, directionalLight.target, directionalLightHelper);

  const hemisphereLight = new HemisphereLight(0xff_00_00, 0x00_00_ff, 0.9);
  const hemisphereLightHelper = new HemisphereLightHelper(hemisphereLight, 10);
  hemisphereLight.visible = false;
  hemisphereLightHelper.visible = false;
  scene.add(hemisphereLight, hemisphereLightHelper);

  const pointLight = new PointLight(0xff_90_00, 1.5);
  pointLight.position.set(1, -0.5, 1);
  const pointLightHelper = new PointLightHelper(pointLight);
  pointLightHelper.visible = false;
  scene.add(pointLight, pointLightHelper);

  RectAreaLightUniformsLib.init();
  const rectAreaLight = new RectAreaLight(0x4e_00_ff, 6, 1, 1);
  rectAreaLight.position.set(-1.5, 0, 1.5);
  rectAreaLight.lookAt(0, 0, 0);
  const rectAreaLightHelper = new RectAreaLightHelper(rectAreaLight);
  rectAreaLightHelper.visible = false;
  scene.add(rectAreaLight, rectAreaLightHelper);

  const spotLight = new SpotLight(0x78_ff_00, 4.5, 5, Math.PI * 0.1, 0.25, 1);
  spotLight.position.set(0, 2, 0);
  spotLight.target.position.copy(
    new Vector3().addVectors(spotLight.position, new Vector3(0, -1, 0))
  );
  const spotLightHelper = new SpotLightHelper(spotLight);
  spotLightHelper.visible = false;
  scene.add(spotLight, spotLight.target, spotLightHelper);

  const material = new MeshStandardMaterial({
    roughness: 0.4,
    side: DoubleSide,
  });

  const sphere = new Mesh(new SphereGeometry(0.5, 32, 32), material);
  sphere.position.set(-1.5, 0, 0);

  const cube = new Mesh(new BoxGeometry(0.75, 0.75, 0.75), material);

  const torus = new Mesh(new TorusGeometry(0.3, 0.2, 32, 64), material);
  torus.position.set(1.5, 0, 0);

  const plane = new Mesh(new PlaneGeometry(5, 5), material);
  plane.position.set(0, -0.65, 0);
  plane.rotation.set(-Math.PI * 0.5, 0, 0);

  scene.add(camera, cube, plane, sphere, torus);

  return {
    ambientLight,
    camera,
    cube,
    directionalLight,
    directionalLightHelper,
    hemisphereLight,
    hemisphereLightHelper,
    pointLight,
    pointLightHelper,
    rectAreaLight,
    rectAreaLightHelper,
    scene,
    sphere,
    spotLight,
    spotLightHelper,
    torus,
  };
}

export function animate(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: Camera,
  cube: Mesh,
  sphere: Mesh,
  torus: Mesh,
  onFrame?: () => void
) {
  const clock = new Clock();

  const tick = () => {
    const elapsedTime = clock.getElapsedTime();

    sphere.rotation.y = 0.1 * elapsedTime;
    cube.rotation.y = 0.1 * elapsedTime;
    torus.rotation.y = 0.1 * elapsedTime;

    sphere.rotation.x = 0.15 * elapsedTime;
    cube.rotation.x = 0.15 * elapsedTime;
    torus.rotation.x = 0.15 * elapsedTime;

    renderer.render(scene, camera);
    onFrame?.();
    requestAnimationFrame(tick);
  };

  tick();
}

function setupPanelControllers(
  gui: GUI,
  ambientLight: AmbientLight,
  directionalLight: DirectionalLight,
  directionalLightHelper: DirectionalLightHelper,
  hemisphereLight: HemisphereLight,
  hemisphereLightHelper: HemisphereLightHelper,
  pointLight: PointLight,
  pointLightHelper: PointLightHelper,
  rectAreaLight: RectAreaLight,
  rectAreaLightHelper: RectAreaLightHelper,
  spotLight: SpotLight,
  spotLightHelper: SpotLightHelper
) {
  const folderLights = gui.addFolder('Lights');

  const folderLightsAmbient = folderLights.addFolder('Ambient Light');
  folderLightsAmbient.close();

  const folderLightsDirectional = folderLights.addFolder('Directional Light');
  const folderLightsDirectionalPosition =
    folderLightsDirectional.addFolder('Position');
  const folderLightsDirectionalRotation =
    folderLightsDirectional.addFolder('Rotation');
  folderLightsDirectional.close();

  const folderLightsHemisphere = folderLights.addFolder('Hemisphere Light');
  const folderLightsHemispherePosition =
    folderLightsHemisphere.addFolder('Position');
  folderLightsHemisphere.close();

  const folderLightsPoint = folderLights.addFolder('Point Light');
  const folderLightsPointPosition = folderLightsPoint.addFolder('Position');

  const folderLightsRectArea = folderLights.addFolder('Rect Area Light');
  const folderLightsRectAreaPosition =
    folderLightsRectArea.addFolder('Position');
  const folderLightsRectAreaRotation =
    folderLightsRectArea.addFolder('Rotation');

  const folderLightsSpot = folderLights.addFolder('Spot Light');
  const folderLightsSpotPosition = folderLightsSpot.addFolder('Position');
  const folderLightsSpotRotation = folderLightsSpot.addFolder('Rotation');

  const controls = {
    lights: {
      ambientLight: {
        color: ambientLight.color.getHex(),
        intensity: ambientLight.intensity,
        visible: ambientLight.visible,
      },
      directionalLight: {
        position: directionalLight.position,
        rotation: new Euler(0, 0, 0, 'YXZ'),
        color: directionalLight.color.getHex(),
        intensity: directionalLight.intensity,
        visible: directionalLight.visible,
        helper: directionalLightHelper.visible,
      },
      hemisphereLight: {
        position: hemisphereLight.position,
        color: hemisphereLight.color.getHex(),
        groundColor: hemisphereLight.groundColor.getHex(),
        intensity: hemisphereLight.intensity,
        visible: hemisphereLight.visible,
        helper: hemisphereLightHelper.visible,
      },
      pointLight: {
        position: pointLight.position,
        color: pointLight.color.getHex(),
        intensity: pointLight.intensity,
        distance: pointLight.distance,
        decay: pointLight.decay,
        visible: pointLight.visible,
        helper: pointLightHelper.visible,
      },
      rectAreaLight: {
        position: rectAreaLight.position,
        rotation: rectAreaLight.rotation,
        color: rectAreaLight.color.getHex(),
        intensity: rectAreaLight.intensity,
        width: rectAreaLight.width,
        height: rectAreaLight.height,
        visible: rectAreaLight.visible,
        helper: rectAreaLightHelper.visible,
      },
      spotLight: {
        position: spotLight.position,
        rotation: new Euler(0, 0, 0, 'YXZ'),
        color: spotLight.color.getHex(),
        intensity: spotLight.intensity,
        distance: spotLight.distance,
        angle: spotLight.angle,
        penumbra: spotLight.penumbra,
        decay: spotLight.decay,
        visible: spotLight.visible,
        helper: spotLightHelper.visible,
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
        rotation: {
          x: folderLightsDirectionalRotation
            .add(controls.lights.directionalLight.rotation, 'x')
            .max(Math.PI * 2)
            .min(-Math.PI * 2)
            .step(0.001),
          y: folderLightsDirectionalRotation
            .add(controls.lights.directionalLight.rotation, 'y')
            .max(Math.PI * 2)
            .min(-Math.PI * 2)
            .step(0.001),
          z: folderLightsDirectionalRotation
            .add(controls.lights.directionalLight.rotation, 'z')
            .max(Math.PI * 2)
            .min(-Math.PI * 2)
            .step(0.001),
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
      hemisphereLight: {
        position: {
          x: folderLightsHemispherePosition
            .add(controls.lights.hemisphereLight.position, 'x')
            .max(20)
            .min(-20)
            .step(0.01),
          y: folderLightsHemispherePosition
            .add(controls.lights.hemisphereLight.position, 'y')
            .max(20)
            .min(-20)
            .step(0.01),
          z: folderLightsHemispherePosition
            .add(controls.lights.hemisphereLight.position, 'z')
            .max(20)
            .min(-20)
            .step(0.01),
        },
        color: folderLightsHemisphere
          .addColor(controls.lights.hemisphereLight, 'color')
          .name('Color'),
        groundColor: folderLightsHemisphere
          .addColor(controls.lights.hemisphereLight, 'groundColor')
          .name('Ground Color'),
        intensity: folderLightsHemisphere
          .add(controls.lights.hemisphereLight, 'intensity')
          .max(3)
          .min(0)
          .name('Intensity')
          .step(0.001),
        visible: folderLightsHemisphere
          .add(controls.lights.hemisphereLight, 'visible')
          .name('Visible'),
        helper: folderLightsHemisphere
          .add(controls.lights.hemisphereLight, 'helper')
          .name('Helper'),
      },
      pointLight: {
        position: {
          x: folderLightsPointPosition
            .add(controls.lights.pointLight.position, 'x')
            .max(20)
            .min(-20)
            .step(0.01),
          y: folderLightsPointPosition
            .add(controls.lights.pointLight.position, 'y')
            .max(20)
            .min(-20)
            .step(0.01),
          z: folderLightsPointPosition
            .add(controls.lights.pointLight.position, 'z')
            .max(20)
            .min(-20)
            .step(0.01),
        },
        color: folderLightsPoint
          .addColor(controls.lights.pointLight, 'color')
          .name('Color'),
        intensity: folderLightsPoint
          .add(controls.lights.pointLight, 'intensity')
          .max(200)
          .min(0)
          .name('Intensity')
          .step(0.05),
        distance: folderLightsPoint
          .add(controls.lights.pointLight, 'distance')
          .max(100)
          .min(0)
          .name('Distance')
          .step(0.05),
        decay: folderLightsPoint
          .add(controls.lights.pointLight, 'decay')
          .max(10)
          .min(1)
          .name('Decay')
          .step(0.05),
        visible: folderLightsPoint
          .add(controls.lights.pointLight, 'visible')
          .name('Visible'),
        helper: folderLightsPoint
          .add(controls.lights.pointLight, 'helper')
          .name('Helper'),
      },
      rectAreaLight: {
        position: {
          x: folderLightsRectAreaPosition
            .add(controls.lights.rectAreaLight.position, 'x')
            .max(20)
            .min(-20)
            .step(0.01),
          y: folderLightsRectAreaPosition
            .add(controls.lights.rectAreaLight.position, 'y')
            .max(20)
            .min(-20)
            .step(0.01),
          z: folderLightsRectAreaPosition
            .add(controls.lights.rectAreaLight.position, 'z')
            .max(20)
            .min(-20)
            .step(0.01),
        },
        rotation: {
          x: folderLightsRectAreaRotation
            .add(controls.lights.rectAreaLight.rotation, 'x')
            .max(Math.PI * 2)
            .min(-Math.PI * 2)
            .step(0.001),
          y: folderLightsRectAreaRotation
            .add(controls.lights.rectAreaLight.rotation, 'y')
            .max(Math.PI * 2)
            .min(-Math.PI * 2)
            .step(0.001),
          z: folderLightsRectAreaRotation
            .add(controls.lights.rectAreaLight.rotation, 'z')
            .max(Math.PI * 2)
            .min(-Math.PI * 2)
            .step(0.001),
        },
        color: folderLightsRectArea
          .addColor(controls.lights.rectAreaLight, 'color')
          .name('Color'),
        intensity: folderLightsRectArea
          .add(controls.lights.rectAreaLight, 'intensity')
          .max(200)
          .min(0)
          .name('Intensity')
          .step(0.05),
        width: folderLightsRectArea
          .add(controls.lights.rectAreaLight, 'width')
          .max(20)
          .min(0)
          .name('Width')
          .step(0.01),
        height: folderLightsRectArea
          .add(controls.lights.rectAreaLight, 'height')
          .max(20)
          .min(0)
          .name('Height')
          .step(0.01),
        visible: folderLightsRectArea
          .add(controls.lights.rectAreaLight, 'visible')
          .name('Visible'),
        helper: folderLightsRectArea
          .add(controls.lights.rectAreaLight, 'helper')
          .name('Helper'),
      },
      spotLight: {
        position: {
          x: folderLightsSpotPosition
            .add(controls.lights.spotLight.position, 'x')
            .max(20)
            .min(-20)
            .step(0.01),
          y: folderLightsSpotPosition
            .add(controls.lights.spotLight.position, 'y')
            .max(20)
            .min(-20)
            .step(0.01),
          z: folderLightsSpotPosition
            .add(controls.lights.spotLight.position, 'z')
            .max(20)
            .min(-20)
            .step(0.01),
        },
        rotation: {
          x: folderLightsSpotRotation
            .add(controls.lights.spotLight.rotation, 'x')
            .max(Math.PI * 2)
            .min(-Math.PI * 2)
            .step(0.001),
          y: folderLightsSpotRotation
            .add(controls.lights.spotLight.rotation, 'y')
            .max(Math.PI * 2)
            .min(-Math.PI * 2)
            .step(0.001),
          z: folderLightsSpotRotation
            .add(controls.lights.spotLight.rotation, 'z')
            .max(Math.PI * 2)
            .min(-Math.PI * 2)
            .step(0.001),
        },
        color: folderLightsSpot
          .addColor(controls.lights.spotLight, 'color')
          .name('Color'),
        intensity: folderLightsSpot
          .add(controls.lights.spotLight, 'intensity')
          .max(200)
          .min(0)
          .name('Intensity')
          .step(0.05),
        distance: folderLightsSpot
          .add(controls.lights.spotLight, 'distance')
          .max(100)
          .min(0)
          .name('Distance')
          .step(0.05),
        angle: folderLightsSpot
          .add(controls.lights.spotLight, 'angle')
          .max(Math.PI / 2)
          .min(0)
          .name('Angle')
          .step(0.001),
        penumbra: folderLightsSpot
          .add(controls.lights.spotLight, 'penumbra')
          .max(1)
          .min(0)
          .name('Penumbra')
          .step(0.001),
        decay: folderLightsSpot
          .add(controls.lights.spotLight, 'decay')
          .max(10)
          .min(1)
          .name('Decay')
          .step(0.05),
        visible: folderLightsSpot
          .add(controls.lights.spotLight, 'visible')
          .name('Visible'),
        helper: folderLightsSpot
          .add(controls.lights.spotLight, 'helper')
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

  const updateDirectionalLightTarget = lightTargetUpdater(
    controls.lights.directionalLight.rotation,
    directionalLight,
    directionalLightHelper
  );

  controllers.lights.directionalLight.position.x.onChange(
    updateDirectionalLightTarget
  );
  controllers.lights.directionalLight.position.y.onChange(
    updateDirectionalLightTarget
  );
  controllers.lights.directionalLight.position.z.onChange(
    updateDirectionalLightTarget
  );
  controllers.lights.directionalLight.rotation.x.onChange(
    updateDirectionalLightTarget
  );
  controllers.lights.directionalLight.rotation.y.onChange(
    updateDirectionalLightTarget
  );
  controllers.lights.directionalLight.rotation.z.onChange(
    updateDirectionalLightTarget
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

  function updateHemisphereLightTransform() {
    hemisphereLightHelper.update();
  }

  controllers.lights.hemisphereLight.position.x.onChange(
    updateHemisphereLightTransform
  );
  controllers.lights.hemisphereLight.position.y.onChange(
    updateHemisphereLightTransform
  );
  controllers.lights.hemisphereLight.position.z.onChange(
    updateHemisphereLightTransform
  );

  controllers.lights.hemisphereLight.color.onChange((value: number) => {
    hemisphereLight.color.set(value);
    hemisphereLightHelper.update();
  });
  controllers.lights.hemisphereLight.groundColor.onChange((value: number) => {
    hemisphereLight.groundColor.set(value);
    hemisphereLightHelper.update();
  });
  controllers.lights.hemisphereLight.intensity.onChange((value: number) => {
    hemisphereLight.intensity = value;
  });
  controllers.lights.hemisphereLight.visible.onChange((value: boolean) => {
    hemisphereLight.visible = value;
    hemisphereLightHelper.visible =
      value && controls.lights.hemisphereLight.helper;
  });
  controllers.lights.hemisphereLight.helper.onChange((value: boolean) => {
    hemisphereLightHelper.visible =
      value && controls.lights.hemisphereLight.visible;
  });

  function updatePointLightTransform() {
    pointLightHelper.update();
  }

  controllers.lights.pointLight.position.x.onChange(updatePointLightTransform);
  controllers.lights.pointLight.position.y.onChange(updatePointLightTransform);
  controllers.lights.pointLight.position.z.onChange(updatePointLightTransform);

  controllers.lights.pointLight.color.onChange((value: number) => {
    pointLight.color.set(value);
    pointLightHelper.update();
  });
  controllers.lights.pointLight.intensity.onChange((value: number) => {
    pointLight.intensity = value;
  });
  controllers.lights.pointLight.distance.onChange((value: number) => {
    pointLight.distance = value;
    pointLightHelper.update();
  });
  controllers.lights.pointLight.decay.onChange((value: number) => {
    pointLight.decay = value;
  });
  controllers.lights.pointLight.visible.onChange((value: boolean) => {
    pointLight.visible = value;
    pointLightHelper.visible = value && controls.lights.pointLight.helper;
  });
  controllers.lights.pointLight.helper.onChange((value: boolean) => {
    pointLightHelper.visible = value && controls.lights.pointLight.visible;
  });

  controllers.lights.rectAreaLight.color.onChange((value: number) => {
    rectAreaLight.color.set(value);
  });
  controllers.lights.rectAreaLight.intensity.onChange((value: number) => {
    rectAreaLight.intensity = value;
  });
  controllers.lights.rectAreaLight.width.onChange((value: number) => {
    rectAreaLight.width = value;
  });
  controllers.lights.rectAreaLight.height.onChange((value: number) => {
    rectAreaLight.height = value;
  });
  controllers.lights.rectAreaLight.visible.onChange((value: boolean) => {
    rectAreaLight.visible = value;
    rectAreaLightHelper.visible = value && controls.lights.rectAreaLight.helper;
  });
  controllers.lights.rectAreaLight.helper.onChange((value: boolean) => {
    rectAreaLightHelper.visible =
      value && controls.lights.rectAreaLight.visible;
  });

  const updateSpotLightTarget = lightTargetUpdater(
    controls.lights.spotLight.rotation,
    spotLight,
    spotLightHelper
  );

  controllers.lights.spotLight.position.x.onChange(updateSpotLightTarget);
  controllers.lights.spotLight.position.y.onChange(updateSpotLightTarget);
  controllers.lights.spotLight.position.z.onChange(updateSpotLightTarget);
  controllers.lights.spotLight.rotation.x.onChange(updateSpotLightTarget);
  controllers.lights.spotLight.rotation.y.onChange(updateSpotLightTarget);
  controllers.lights.spotLight.rotation.z.onChange(updateSpotLightTarget);

  controllers.lights.spotLight.color.onChange((value: number) => {
    spotLight.color.set(value);
    spotLightHelper.update();
  });
  controllers.lights.spotLight.intensity.onChange((value: number) => {
    spotLight.intensity = value;
  });
  controllers.lights.spotLight.distance.onChange((value: number) => {
    spotLight.distance = value;
    spotLightHelper.update();
  });
  controllers.lights.spotLight.angle.onChange((value: number) => {
    spotLight.angle = value;
    spotLightHelper.update();
  });
  controllers.lights.spotLight.penumbra.onChange((value: number) => {
    spotLight.penumbra = value;
  });
  controllers.lights.spotLight.decay.onChange((value: number) => {
    spotLight.decay = value;
  });
  controllers.lights.spotLight.visible.onChange((value: boolean) => {
    spotLight.visible = value;
    spotLightHelper.visible = value && controls.lights.spotLight.helper;
  });
  controllers.lights.spotLight.helper.onChange((value: boolean) => {
    spotLightHelper.visible = value && controls.lights.spotLight.visible;
  });

  return () => folderLights.destroy();
}

export function run() {
  const gui = createControlsPanel({ hide: true });
  const canvas = setupCanvas();
  const renderer = setupRenderer(canvas);
  const {
    ambientLight,
    camera,
    cube,
    directionalLight,
    directionalLightHelper,
    hemisphereLight,
    hemisphereLightHelper,
    pointLight,
    pointLightHelper,
    rectAreaLight,
    rectAreaLightHelper,
    scene,
    sphere,
    spotLight,
    spotLightHelper,
    torus,
  } = setupScene();

  setupPanelControllers(
    gui,
    ambientLight,
    directionalLight,
    directionalLightHelper,
    hemisphereLight,
    hemisphereLightHelper,
    pointLight,
    pointLightHelper,
    rectAreaLight,
    rectAreaLightHelper,
    spotLight,
    spotLightHelper
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

  const controls = new OrbitControls(camera, canvas);

  animate(renderer, scene, camera, cube, sphere, torus, () =>
    controls.update()
  );
}

function lightTargetUpdater<T extends SpotLight | DirectionalLight>(
  euler: Euler,
  light: T,
  lightHelper?: T extends SpotLight ? SpotLightHelper : DirectionalLightHelper
) {
  const DOWN = new Vector3(0, -1, 0);
  const direction = new Vector3();
  const quaternion = new Quaternion();

  return () => {
    quaternion.setFromEuler(euler);
    direction.copy(DOWN).applyQuaternion(quaternion);
    direction.normalize();

    light.target.position.copy(light.position).addScaledVector(direction, 1);
    lightHelper?.update();
  };
}
