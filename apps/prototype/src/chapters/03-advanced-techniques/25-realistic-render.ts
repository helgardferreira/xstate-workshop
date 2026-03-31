import type { GUI } from 'lil-gui';
import { forkJoin, lastValueFrom } from 'rxjs';
import {
  ACESFilmicToneMapping,
  AgXToneMapping,
  Camera,
  CameraHelper,
  CineonToneMapping,
  CustomToneMapping,
  type DataTexture,
  DirectionalLight,
  DirectionalLightHelper,
  EquirectangularReflectionMapping,
  Group,
  LinearToneMapping,
  Mesh,
  MeshStandardMaterial,
  NeutralToneMapping,
  NoToneMapping,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  ReinhardToneMapping,
  SRGBColorSpace,
  Scene,
  type Texture,
  Timer,
  type ToneMapping,
  WebGLRenderer,
} from 'three';
import { type GLTF, GLTFLoader, HDRLoader } from 'three/addons';
import { OrbitControls } from 'three-stdlib';

import { clamp, html } from '@xstate-workshop/utils';

import {
  createControlsPanel,
  filterMesh,
  fromFullscreenKeyup,
  fromObject3dTraverse,
  fromTexture,
  fromWindowResize,
  getModelUrl,
  getTextureUrl,
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
  const renderer = new WebGLRenderer({ antialias: true, canvas });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(clamp(window.devicePixelRatio, 1, 2));

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.toneMapping = ReinhardToneMapping;
  renderer.toneMappingExposure = 1;

  return renderer;
}

enum Model {
  FlightHelmet,
  Hamburger,
}

type Models = {
  flightHelmet: GLTF;
  hamburger: GLTF;
};

function loadModels(): Promise<Models> {
  const gltfLoader = new GLTFLoader();

  return lastValueFrom(
    forkJoin({
      flightHelmet: gltfLoader.loadAsync(getModelUrl('flight-helmet', 'gltf')),
      hamburger: gltfLoader.loadAsync(getModelUrl('hamburger', 'gltf-binary')),
    })
  );
}

type Textures = {
  castleBrickBrokenArm: Texture<HTMLImageElement>;
  castleBrickBrokenColor: Texture<HTMLImageElement>;
  castleBrickBrokenNormal: Texture<HTMLImageElement>;
  environmentMap: DataTexture;
  woodCabinetWornLongArm: Texture<HTMLImageElement>;
  woodCabinetWornLongColor: Texture<HTMLImageElement>;
  woodCabinetWornLongNormal: Texture<HTMLImageElement>;
};

function loadTextures(): Promise<Textures> {
  const hdrLoader = new HDRLoader();

  return lastValueFrom(
    forkJoin({
      castleBrickBrokenArm: fromTexture(
        getTextureUrl('castle-brick-broken', 'castle-brick-broken-arm')
      ),
      castleBrickBrokenColor: fromTexture(
        getTextureUrl('castle-brick-broken', 'castle-brick-broken-diff')
      ),
      castleBrickBrokenNormal: fromTexture(
        getTextureUrl('castle-brick-broken', 'castle-brick-broken-nor-gl')
      ),
      environmentMap: hdrLoader.loadAsync(
        getTextureUrl('environment-map', ['1', '2k'])
      ),
      woodCabinetWornLongArm: fromTexture(
        getTextureUrl('wood-cabinet-worn-long', 'wood-cabinet-worn-long-arm')
      ),
      woodCabinetWornLongColor: fromTexture(
        getTextureUrl('wood-cabinet-worn-long', 'wood-cabinet-worn-long-diff')
      ),
      woodCabinetWornLongNormal: fromTexture(
        getTextureUrl('wood-cabinet-worn-long', 'wood-cabinet-worn-long-nor-gl')
      ),
    })
  );
}

function setupScene(models: Models, textures: Textures) {
  const scene = new Scene();

  textures.environmentMap.mapping = EquirectangularReflectionMapping;

  textures.castleBrickBrokenColor.colorSpace = SRGBColorSpace;
  textures.woodCabinetWornLongColor.colorSpace = SRGBColorSpace;

  scene.background = textures.environmentMap;
  scene.environment = textures.environmentMap;

  scene.backgroundBlurriness = 0;
  scene.backgroundIntensity = 1;
  scene.environmentIntensity = 1;

  const camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(4, 5, 4);

  const directionalLight = new DirectionalLight(0xff_ff_ff, 3);
  directionalLight.castShadow = true;
  directionalLight.position.set(-4, 6.5, 2.5);
  directionalLight.shadow.camera.far = 15;
  directionalLight.shadow.mapSize.set(1024, 1024);
  directionalLight.shadow.normalBias = 0.014;
  directionalLight.shadow.bias = 0;
  directionalLight.target.position.set(0, 4, 0);
  const directionalLightCameraHelper = new CameraHelper(
    directionalLight.shadow.camera
  );
  directionalLightCameraHelper.visible = false;
  const directionalLightHelper = new DirectionalLightHelper(directionalLight);
  directionalLightHelper.visible = false;

  const flightHelmetModel = models.flightHelmet;
  const flightHelmet = new Group();
  flightHelmet.add(flightHelmetModel.scene);
  flightHelmet.scale.multiplyScalar(10);
  flightHelmet.visible = true;

  const hamburgerModel = models.hamburger;
  const hamburger = new Group();
  hamburger.add(hamburgerModel.scene);
  hamburger.position.set(0, 2.5, 0);
  hamburger.scale.multiplyScalar(0.4);
  hamburger.visible = false;

  const floor = new Mesh(
    new PlaneGeometry(8, 8),
    new MeshStandardMaterial({
      aoMap: textures.woodCabinetWornLongArm,
      map: textures.woodCabinetWornLongColor,
      metalnessMap: textures.woodCabinetWornLongArm,
      normalMap: textures.woodCabinetWornLongNormal,
      roughnessMap: textures.woodCabinetWornLongArm,
    })
  );
  floor.rotation.set((Math.PI * -1) / 2, 0, 0);

  const wall = new Mesh(
    new PlaneGeometry(8, 8),
    new MeshStandardMaterial({
      aoMap: textures.castleBrickBrokenArm,
      map: textures.castleBrickBrokenColor,
      metalnessMap: textures.castleBrickBrokenArm,
      normalMap: textures.castleBrickBrokenNormal,
      roughnessMap: textures.castleBrickBrokenArm,
    })
  );
  wall.position.set(0, 4, -4);

  scene.add(
    camera,
    directionalLight,
    directionalLight.target,
    directionalLightCameraHelper,
    directionalLightHelper,
    flightHelmet,
    floor,
    hamburger,
    wall
  );

  fromObject3dTraverse(scene)
    .pipe(filterMesh())
    .subscribe((mesh) => {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });

  return {
    camera,
    directionalLight,
    directionalLightCameraHelper,
    directionalLightHelper,
    flightHelmet,
    hamburger,
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
  directionalLight: DirectionalLight,
  directionalLightCameraHelper: CameraHelper,
  directionalLightHelper: DirectionalLightHelper,
  flightHelmet: Group,
  hamburger: Group,
  renderer: WebGLRenderer,
  scene: Scene
) {
  const folderToneMapping = gui.addFolder('Tone Mapping');

  const folderBackground = gui.addFolder('Background');
  const folderBackgroundRotation = folderBackground.addFolder('Rotation');
  folderBackgroundRotation.close();

  const folderEnvironment = gui.addFolder('Environment');
  const folderEnvironmentRotation = folderEnvironment.addFolder('Rotation');
  folderEnvironmentRotation.close();

  const folderDirectionalLight = gui.addFolder('Directional Light');
  folderDirectionalLight.close();
  const folderDirectionalLightPosition =
    folderDirectionalLight.addFolder('Position');
  folderDirectionalLightPosition.close();
  const folderDirectionalLightShadow =
    folderDirectionalLight.addFolder('Shadow');
  const folderDirectionalLightShadowCamera =
    folderDirectionalLightShadow.addFolder('Camera');
  folderDirectionalLightShadow.close();

  const folderSubject = gui.addFolder('Subject');

  const controls = {
    toneMapping: {
      technique: renderer.toneMapping,
      exposure: renderer.toneMappingExposure,
    },
    background: {
      blurriness: scene.backgroundBlurriness,
      intensity: scene.backgroundIntensity,
      rotation: scene.backgroundRotation.clone(),
    },
    environment: {
      intensity: scene.environmentIntensity,
      rotation: scene.environmentRotation,
    },
    directionalLight: {
      position: directionalLight.position.clone(),
      shadow: {
        camera: {
          top: directionalLight.shadow.camera.top,
          right: directionalLight.shadow.camera.right,
          bottom: directionalLight.shadow.camera.bottom,
          left: directionalLight.shadow.camera.left,
          near: directionalLight.shadow.camera.near,
          far: directionalLight.shadow.camera.far,
          helper: directionalLightCameraHelper.visible,
        },
        mapSize: directionalLight.shadow.mapSize.x,
        normalBias: directionalLight.shadow.normalBias,
        bias: directionalLight.shadow.bias,
      },
      color: directionalLight.color.getHex(),
      intensity: directionalLight.intensity,
      visible: directionalLight.visible,
      helper: directionalLightHelper.visible,
    },
    subject: {
      model: Model.FlightHelmet,
    },
  };

  const controllers = {
    toneMapping: {
      technique: folderToneMapping
        .add(controls.toneMapping, 'technique', {
          No: NoToneMapping,
          ACESFilmic: ACESFilmicToneMapping,
          AgX: AgXToneMapping,
          Cineon: CineonToneMapping,
          Custom: CustomToneMapping,
          Linear: LinearToneMapping,
          Neutral: NeutralToneMapping,
          Reinhard: ReinhardToneMapping,
        })
        .name('Technique'),
      exposure: folderToneMapping
        .add(controls.toneMapping, 'exposure')
        .max(10)
        .min(0)
        .name('Exposure')
        .step(0.01),
    },
    background: {
      blurriness: folderBackground
        .add(controls.background, 'blurriness')
        .max(1)
        .min(0)
        .name('Blurriness')
        .step(0.001),
      intensity: folderBackground
        .add(controls.background, 'intensity')
        .max(10)
        .min(0)
        .name('Intensity')
        .step(0.001),
      rotation: {
        x: folderBackgroundRotation
          .add(controls.background.rotation, 'x')
          .max(Math.PI * 2)
          .min(-Math.PI * 2)
          .step(0.001),
        y: folderBackgroundRotation
          .add(controls.background.rotation, 'y')
          .max(Math.PI * 2)
          .min(-Math.PI * 2)
          .step(0.001),
        z: folderBackgroundRotation
          .add(controls.background.rotation, 'z')
          .max(Math.PI * 2)
          .min(-Math.PI * 2)
          .step(0.001),
      },
    },
    environment: {
      intensity: folderEnvironment
        .add(controls.environment, 'intensity')
        .max(10)
        .min(0)
        .name('Intensity')
        .step(0.001),
      rotation: {
        x: folderEnvironmentRotation
          .add(controls.environment.rotation, 'x')
          .max(Math.PI * 2)
          .min(-Math.PI * 2)
          .step(0.001),
        y: folderEnvironmentRotation
          .add(controls.environment.rotation, 'y')
          .max(Math.PI * 2)
          .min(-Math.PI * 2)
          .step(0.001),
        z: folderEnvironmentRotation
          .add(controls.environment.rotation, 'z')
          .max(Math.PI * 2)
          .min(-Math.PI * 2)
          .step(0.001),
      },
    },
    directionalLight: {
      position: {
        x: folderDirectionalLightPosition
          .add(controls.directionalLight.position, 'x')
          .max(20)
          .min(-20)
          .step(0.01),
        y: folderDirectionalLightPosition
          .add(controls.directionalLight.position, 'y')
          .max(20)
          .min(-20)
          .step(0.01),
        z: folderDirectionalLightPosition
          .add(controls.directionalLight.position, 'z')
          .max(20)
          .min(-20)
          .step(0.01),
      },
      shadow: {
        camera: {
          top: folderDirectionalLightShadowCamera
            .add(controls.directionalLight.shadow.camera, 'top')
            .max(10)
            .min(0.1)
            .name('Top')
            .step(0.01),
          right: folderDirectionalLightShadowCamera
            .add(controls.directionalLight.shadow.camera, 'right')
            .max(10)
            .min(0.1)
            .name('Right')
            .step(0.01),
          bottom: folderDirectionalLightShadowCamera
            .add(controls.directionalLight.shadow.camera, 'bottom')
            .max(-0.1)
            .min(-10)
            .name('Bottom')
            .step(0.01),
          left: folderDirectionalLightShadowCamera
            .add(controls.directionalLight.shadow.camera, 'left')
            .max(-0.1)
            .min(-10)
            .name('Left')
            .step(0.01),
          near: folderDirectionalLightShadowCamera
            .add(controls.directionalLight.shadow.camera, 'near')
            .max(100)
            .min(0.5)
            .name('Near')
            .step(0.01),
          far: folderDirectionalLightShadowCamera
            .add(controls.directionalLight.shadow.camera, 'far')
            .max(100)
            .min(0.5)
            .name('Far')
            .step(0.01),
          helper: folderDirectionalLightShadowCamera
            .add(controls.directionalLight.shadow.camera, 'helper')
            .name('Helper'),
        },
        mapSize: folderDirectionalLightShadow
          .add(controls.directionalLight.shadow, 'mapSize')
          .name('Map Size')
          .options({
            '128x128': 128,
            '256x256': 256,
            '512x512': 512,
            '1024x1024': 1024,
            '2048x2048': 2048,
          }),
        normalBias: folderDirectionalLightShadow
          .add(controls.directionalLight.shadow, 'normalBias')
          .max(0.05)
          .min(-0.05)
          .name('Normal Bias')
          .step(0.001),
        bias: folderDirectionalLightShadow
          .add(controls.directionalLight.shadow, 'bias')
          .max(0.05)
          .min(-0.05)
          .name('Bias')
          .step(0.001),
      },
      color: folderDirectionalLight
        .addColor(controls.directionalLight, 'color')
        .name('Color'),
      intensity: folderDirectionalLight
        .add(controls.directionalLight, 'intensity')
        .max(10)
        .min(0)
        .name('Intensity')
        .step(0.001),
      visible: folderDirectionalLight
        .add(controls.directionalLight, 'visible')
        .name('Visible'),
      helper: folderDirectionalLight
        .add(controls.directionalLight, 'helper')
        .name('Helper'),
    },
    subject: {
      model: folderSubject
        .add(controls.subject, 'model', {
          FlightHelmet: Model.FlightHelmet,
          Hamburger: Model.Hamburger,
        })
        .name('Model'),
    },
  };

  controllers.toneMapping.technique.onChange((value: ToneMapping) => {
    renderer.toneMapping = value;
  });
  controllers.toneMapping.exposure.onChange((value: number) => {
    renderer.toneMappingExposure = value;
  });

  controllers.background.blurriness.onChange((value: number) => {
    scene.backgroundBlurriness = value;
  });
  controllers.background.intensity.onChange((value: number) => {
    scene.backgroundIntensity = value;
  });

  const handleBackgroundRotationChange = () => {
    scene.backgroundRotation.set(
      controls.background.rotation.x,
      controls.background.rotation.y,
      controls.background.rotation.z
    );
  };

  controllers.background.rotation.x.onChange(handleBackgroundRotationChange);
  controllers.background.rotation.y.onChange(handleBackgroundRotationChange);
  controllers.background.rotation.z.onChange(handleBackgroundRotationChange);

  controllers.environment.intensity.onChange((value: number) => {
    scene.environmentIntensity = value;
  });

  const handleEnvironmentRotationChange = () => {
    scene.environmentRotation.set(
      controls.environment.rotation.x,
      controls.environment.rotation.y,
      controls.environment.rotation.z
    );
  };

  controllers.environment.rotation.x.onChange(handleEnvironmentRotationChange);
  controllers.environment.rotation.y.onChange(handleEnvironmentRotationChange);
  controllers.environment.rotation.z.onChange(handleEnvironmentRotationChange);

  function updateDirectionalLightTransform() {
    directionalLight.position.set(
      controls.directionalLight.position.x,
      controls.directionalLight.position.y,
      controls.directionalLight.position.z
    );
    directionalLightHelper.update();
  }

  controllers.directionalLight.position.x.onChange(
    updateDirectionalLightTransform
  );
  controllers.directionalLight.position.y.onChange(
    updateDirectionalLightTransform
  );
  controllers.directionalLight.position.z.onChange(
    updateDirectionalLightTransform
  );

  controllers.directionalLight.shadow.camera.top.onChange((value: number) => {
    directionalLight.shadow.camera.top = value;
    directionalLight.shadow.camera.updateProjectionMatrix();
    directionalLightCameraHelper.update();
  });
  controllers.directionalLight.shadow.camera.right.onChange((value: number) => {
    directionalLight.shadow.camera.right = value;
    directionalLight.shadow.camera.updateProjectionMatrix();
    directionalLightCameraHelper.update();
  });
  controllers.directionalLight.shadow.camera.bottom.onChange(
    (value: number) => {
      directionalLight.shadow.camera.bottom = value;
      directionalLight.shadow.camera.updateProjectionMatrix();
      directionalLightCameraHelper.update();
    }
  );
  controllers.directionalLight.shadow.camera.left.onChange((value: number) => {
    directionalLight.shadow.camera.left = value;
    directionalLight.shadow.camera.updateProjectionMatrix();
    directionalLightCameraHelper.update();
  });
  controllers.directionalLight.shadow.camera.near.onChange((value: number) => {
    directionalLight.shadow.camera.near = value;
    directionalLight.shadow.camera.updateProjectionMatrix();
    directionalLightCameraHelper.update();
  });
  controllers.directionalLight.shadow.camera.far.onChange((value: number) => {
    directionalLight.shadow.camera.far = value;
    directionalLight.shadow.camera.updateProjectionMatrix();
    directionalLightCameraHelper.update();
  });
  controllers.directionalLight.shadow.camera.helper.onChange(
    (value: boolean) => {
      directionalLightCameraHelper.visible =
        value && controls.directionalLight.visible;
    }
  );
  controllers.directionalLight.shadow.mapSize.onChange((value: number) => {
    directionalLight.shadow.mapSize.set(value, value);
    directionalLight.shadow.map?.dispose();
    directionalLight.shadow.map = null;
  });
  controllers.directionalLight.shadow.normalBias.onChange((value: number) => {
    directionalLight.shadow.normalBias = value;
  });
  controllers.directionalLight.shadow.bias.onChange((value: number) => {
    directionalLight.shadow.bias = value;
  });

  controllers.directionalLight.color.onChange((value: number) => {
    directionalLight.color.set(value);
    directionalLightHelper.update();
  });
  controllers.directionalLight.intensity.onChange((value: number) => {
    directionalLight.intensity = value;
  });
  controllers.directionalLight.visible.onChange((value: boolean) => {
    directionalLight.visible = value;
    directionalLightCameraHelper.visible =
      value && controls.directionalLight.shadow.camera.helper;
    directionalLightHelper.visible = value && controls.directionalLight.helper;
  });
  controllers.directionalLight.helper.onChange((value: boolean) => {
    directionalLightHelper.visible = value && controls.directionalLight.visible;
  });

  controllers.subject.model.onChange((value: Model) => {
    switch (value) {
      case Model.FlightHelmet: {
        flightHelmet.visible = true;
        hamburger.visible = false;
        break;
      }
      case Model.Hamburger: {
        flightHelmet.visible = false;
        hamburger.visible = true;
        break;
      }
    }
  });

  return () => {
    folderToneMapping.destroy();
    folderBackground.destroy();
    folderEnvironment.destroy();
    folderDirectionalLight.destroy();
    folderSubject.destroy();
  };
}

export async function run() {
  const gui = createControlsPanel();
  const canvas = setupCanvas();
  const renderer = setupRenderer(canvas);

  const models = await loadModels();
  const textures = await loadTextures();

  const {
    camera,
    directionalLight,
    directionalLightCameraHelper,
    directionalLightHelper,
    flightHelmet,
    hamburger,
    scene,
  } = setupScene(models, textures);

  setupPanelControllers(
    gui,
    directionalLight,
    directionalLightCameraHelper,
    directionalLightHelper,
    flightHelmet,
    hamburger,
    renderer,
    scene
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
  orbitControls.target.set(0, 3.5, 0);

  animate(renderer, scene, camera, () => {
    orbitControls.update();
  });
}
