import type { GUI } from 'lil-gui';
import { forkJoin, lastValueFrom } from 'rxjs';
import {
  AmbientLight,
  BufferGeometry,
  Camera,
  CameraHelper,
  Clock,
  DirectionalLight,
  DirectionalLightHelper,
  DoubleSide,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PCFShadowMap,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SphereGeometry,
  Texture,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three-stdlib';

import { clamp, html } from '@xstate-workshop/utils';

import {
  createControlsPanel,
  fromFullscreenKeyup,
  fromTexture,
  fromWindowResize,
  getTextureUrl,
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
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;

  return renderer;
}

type Textures = {
  bakedShadow: Texture<HTMLImageElement>;
  simpleShadow: Texture<HTMLImageElement>;
};

function loadTextures(): Promise<Textures> {
  return lastValueFrom(
    forkJoin({
      bakedShadow: fromTexture(getTextureUrl('shadows', 'baked-shadow')),
      simpleShadow: fromTexture(getTextureUrl('shadows', 'simple-shadow')),
    })
  );
}

function moveSphere(
  sphere: Mesh<BufferGeometry, Material>,
  sphereShadow: Mesh<BufferGeometry, Material>,
  x: number,
  y: number,
  z: number
) {
  sphere.position.set(x, y, z);
  sphereShadow.position.set(x, sphereShadow.position.y, z);
  sphereShadow.material.opacity = 1 - sphere.position.y;
}

export function setupScene(renderer: WebGLRenderer, textures: Textures) {
  const scene = new Scene();

  const camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  camera.position.set(-3.5, 2, 3.5);

  const ambientLight = new AmbientLight(0xff_ff_ff, 0.8);

  const directionalLight = new DirectionalLight(0xff_ff_ff, 2);
  directionalLight.position.set(2, 2, 2);
  directionalLight.shadow.camera.top = 3.5;
  directionalLight.shadow.camera.right = 3.5;
  directionalLight.shadow.camera.bottom = -3.5;
  directionalLight.shadow.camera.left = -3.5;
  directionalLight.shadow.camera.near = 1;
  directionalLight.shadow.camera.far = 7;
  directionalLight.shadow.mapSize.set(1024, 1024);
  directionalLight.shadow.radius = 10;
  const directionalLightCameraHelper = new CameraHelper(
    directionalLight.shadow.camera
  );
  const directionalLightHelper = new DirectionalLightHelper(directionalLight);

  const material = new MeshStandardMaterial({
    roughness: 0.7,
    side: DoubleSide,
  });

  const plane = new Mesh(new PlaneGeometry(5, 5), material);
  plane.rotation.set(-Math.PI * 0.5, 0, 0);
  plane.position.set(0, -0.5, 0);

  const sphere = new Mesh(new SphereGeometry(0.5, 32, 32), material);

  const sphereShadow = new Mesh(
    new PlaneGeometry(1.5, 1.5),
    new MeshBasicMaterial({
      alphaMap: textures.simpleShadow,
      color: 0x00_00_00,
      transparent: true,
    })
  );
  sphereShadow.position.setY(plane.position.y + 0.001);
  sphereShadow.rotation.set(-Math.PI / 2, 0, 0);

  moveSphere(sphere, sphereShadow, 1.5, 0, 0);

  if (renderer.shadowMap.enabled === true) {
    directionalLight.castShadow = true;
    plane.receiveShadow = true;
    sphere.castShadow = true;
    sphereShadow.visible = false;
  } else {
    directionalLightCameraHelper.visible = false;
  }

  scene.add(
    ambientLight,
    camera,
    directionalLight,
    directionalLight.target,
    directionalLightCameraHelper,
    directionalLightHelper,
    plane,
    sphere,
    sphereShadow
  );

  return {
    ambientLight,
    camera,
    directionalLight,
    directionalLightCameraHelper,
    directionalLightHelper,
    material,
    plane,
    scene,
    sphere,
    sphereShadow,
  };
}

export function animate(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: Camera,
  onFrame?: (elapsedTime: number) => void
) {
  const clock = new Clock();

  const tick = () => {
    const elapsedTime = clock.getElapsedTime();
    onFrame?.(elapsedTime);
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  };

  tick();
}

function setupPanelControllers(
  gui: GUI,
  ambientLight: AmbientLight,
  directionalLight: DirectionalLight,
  directionalLightCameraHelper: CameraHelper,
  directionalLightHelper: DirectionalLightHelper,
  material: MeshStandardMaterial,
  plane: Mesh<PlaneGeometry, Material>,
  sphere: Mesh<BufferGeometry, Material>,
  sphereShadow: Mesh<BufferGeometry, Material>,
  renderer: WebGLRenderer
) {
  const folderRenderer = gui.addFolder('Renderer');
  const folderRendererShadowMap = folderRenderer.addFolder('Shadow Map');

  const folderLights = gui.addFolder('Lights');

  const folderLightsAmbient = folderLights.addFolder('Ambient Light');
  folderLightsAmbient.close();

  const folderLightsDirectional = folderLights.addFolder('Directional Light');
  const folderLightsDirectionalPosition =
    folderLightsDirectional.addFolder('Position');
  folderLightsDirectionalPosition.close();
  const folderLightsDirectionalShadow =
    folderLightsDirectional.addFolder('Shadow');
  const folderLightsDirectionalShadowCamera =
    folderLightsDirectionalShadow.addFolder('Camera');
  folderLightsDirectionalShadow.close();

  const folderMaterial = gui.addFolder('Material');
  folderMaterial.close();

  const controls = {
    renderer: {
      shadowMap: {
        enabled: renderer.shadowMap.enabled,
        type: renderer.shadowMap.type,
      },
    },
    lights: {
      ambientLight: {
        color: ambientLight.color.getHex(),
        intensity: ambientLight.intensity,
        visible: ambientLight.visible,
      },
      directionalLight: {
        position: directionalLight.position,
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
          radius: directionalLight.shadow.radius,
        },
        color: directionalLight.color.getHex(),
        intensity: directionalLight.intensity,
        visible: directionalLight.visible,
        helper: directionalLightHelper.visible,
      },
    },
    material: {
      metalness: material.metalness,
      roughness: material.roughness,
    },
  };

  const controllers = {
    renderer: {
      shadowMap: {
        enabled: folderRendererShadowMap
          .add(controls.renderer.shadowMap, 'enabled')
          .name('Enabled'),
        type: folderRendererShadowMap
          .add(controls.renderer.shadowMap, 'type')
          .name('Type')
          .options({
            PCFShadowMap: PCFShadowMap,
            PCFSoftShadowMap: PCFSoftShadowMap,
          }),
      },
    },
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
        shadow: {
          camera: {
            top: folderLightsDirectionalShadowCamera
              .add(controls.lights.directionalLight.shadow.camera, 'top')
              .max(10)
              .min(0.1)
              .name('Top')
              .step(0.01),
            right: folderLightsDirectionalShadowCamera
              .add(controls.lights.directionalLight.shadow.camera, 'right')
              .max(10)
              .min(0.1)
              .name('Right')
              .step(0.01),
            bottom: folderLightsDirectionalShadowCamera
              .add(controls.lights.directionalLight.shadow.camera, 'bottom')
              .max(-0.1)
              .min(-10)
              .name('Bottom')
              .step(0.01),
            left: folderLightsDirectionalShadowCamera
              .add(controls.lights.directionalLight.shadow.camera, 'left')
              .max(-0.1)
              .min(-10)
              .name('Left')
              .step(0.01),
            near: folderLightsDirectionalShadowCamera
              .add(controls.lights.directionalLight.shadow.camera, 'near')
              .max(100)
              .min(0.5)
              .name('Near')
              .step(0.01),
            far: folderLightsDirectionalShadowCamera
              .add(controls.lights.directionalLight.shadow.camera, 'far')
              .max(100)
              .min(0.5)
              .name('Far')
              .step(0.01),
            helper: folderLightsDirectionalShadowCamera
              .add(controls.lights.directionalLight.shadow.camera, 'helper')
              .name('Helper'),
          },
          mapSize: folderLightsDirectionalShadow
            .add(controls.lights.directionalLight.shadow, 'mapSize')
            .name('Map Size')
            .options({
              '128x128': 128,
              '256x256': 256,
              '512x512': 512,
              '1024x1024': 1024,
              '2048x2048': 2048,
            }),
          radius: folderLightsDirectionalShadow
            .add(controls.lights.directionalLight.shadow, 'radius')
            .max(20)
            .min(1)
            .name('Radius')
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
    material: {
      metalness: folderMaterial
        .add(controls.material, 'metalness')
        .max(1)
        .min(0)
        .name('Metalness')
        .step(0.001),
      roughness: folderMaterial
        .add(controls.material, 'roughness')
        .max(1)
        .min(0)
        .name('Roughness')
        .step(0.001),
    },
  };

  if (controls.renderer.shadowMap.enabled === false) {
    controllers.renderer.shadowMap.type.hide();
    folderLightsDirectionalShadow.hide();
  }

  if (controls.renderer.shadowMap.type !== PCFShadowMap) {
    controllers.lights.directionalLight.shadow.radius.hide();
  }

  controllers.renderer.shadowMap.enabled.onChange((value: boolean) => {
    if (value === false) {
      controllers.lights.directionalLight.shadow.camera.helper.setValue(false);
      controllers.renderer.shadowMap.type.hide();
      directionalLight.castShadow = false;
      folderLightsDirectionalShadow.hide();
      plane.receiveShadow = false;
      sphere.castShadow = false;
      sphereShadow.visible = true;
    } else {
      controllers.lights.directionalLight.shadow.camera.helper.setValue(true);
      controllers.renderer.shadowMap.type.show();
      directionalLight.castShadow = true;
      folderLightsDirectionalShadow.show();
      plane.receiveShadow = true;
      sphere.castShadow = true;
      sphereShadow.visible = false;
    }
    renderer.shadowMap.enabled = value;
  });
  controllers.renderer.shadowMap.type.onChange(
    (value: typeof PCFSoftShadowMap | typeof PCFShadowMap) => {
      if (value === PCFShadowMap) {
        controllers.lights.directionalLight.shadow.radius.show();
      } else {
        controllers.lights.directionalLight.shadow.radius.hide();
      }

      renderer.shadowMap.type = value;
    }
  );

  controllers.lights.ambientLight.color.onChange((value: number) => {
    ambientLight.color.set(value);
  });
  controllers.lights.ambientLight.intensity.onChange((value: number) => {
    ambientLight.intensity = value;
  });
  controllers.lights.ambientLight.visible.onChange((value: boolean) => {
    ambientLight.visible = value;
  });

  function updateDirectionalLightTransform() {
    directionalLightHelper.update();
  }

  controllers.lights.directionalLight.position.x.onChange(
    updateDirectionalLightTransform
  );
  controllers.lights.directionalLight.position.y.onChange(
    updateDirectionalLightTransform
  );
  controllers.lights.directionalLight.position.z.onChange(
    updateDirectionalLightTransform
  );
  controllers.lights.directionalLight.shadow.camera.top.onChange(
    (value: number) => {
      directionalLight.shadow.camera.top = value;
      directionalLight.shadow.camera.updateProjectionMatrix();
      directionalLightCameraHelper.update();
    }
  );
  controllers.lights.directionalLight.shadow.camera.right.onChange(
    (value: number) => {
      directionalLight.shadow.camera.right = value;
      directionalLight.shadow.camera.updateProjectionMatrix();
      directionalLightCameraHelper.update();
    }
  );
  controllers.lights.directionalLight.shadow.camera.bottom.onChange(
    (value: number) => {
      directionalLight.shadow.camera.bottom = value;
      directionalLight.shadow.camera.updateProjectionMatrix();
      directionalLightCameraHelper.update();
    }
  );
  controllers.lights.directionalLight.shadow.camera.left.onChange(
    (value: number) => {
      directionalLight.shadow.camera.left = value;
      directionalLight.shadow.camera.updateProjectionMatrix();
      directionalLightCameraHelper.update();
    }
  );
  controllers.lights.directionalLight.shadow.camera.near.onChange(
    (value: number) => {
      directionalLight.shadow.camera.near = value;
      directionalLight.shadow.camera.updateProjectionMatrix();
      directionalLightCameraHelper.update();
    }
  );
  controllers.lights.directionalLight.shadow.camera.far.onChange(
    (value: number) => {
      directionalLight.shadow.camera.far = value;
      directionalLight.shadow.camera.updateProjectionMatrix();
      directionalLightCameraHelper.update();
    }
  );
  controllers.lights.directionalLight.shadow.camera.helper.onChange(
    (value: boolean) => {
      directionalLightCameraHelper.visible =
        value && controls.lights.directionalLight.visible;
    }
  );
  controllers.lights.directionalLight.shadow.mapSize.onChange(
    (value: number) => {
      directionalLight.shadow.mapSize.set(value, value);
      directionalLight.shadow.map?.dispose();
      directionalLight.shadow.map = null;
    }
  );
  controllers.lights.directionalLight.shadow.radius.onChange(
    (value: number) => {
      directionalLight.shadow.radius = value;
    }
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
    directionalLightCameraHelper.visible =
      value && controls.lights.directionalLight.shadow.camera.helper;
    directionalLightHelper.visible =
      value && controls.lights.directionalLight.helper;
  });
  controllers.lights.directionalLight.helper.onChange((value: boolean) => {
    directionalLightHelper.visible =
      value && controls.lights.directionalLight.visible;
  });

  controllers.material.metalness.onChange((value: number) => {
    material.metalness = value;
  });
  controllers.material.roughness.onChange((value: number) => {
    material.roughness = value;
  });

  return () => {
    folderRenderer.destroy();
    folderLights.destroy();
    folderMaterial.destroy();
  };
}

export async function run() {
  const gui = createControlsPanel();
  const canvas = setupCanvas();
  const renderer = setupRenderer(canvas);

  const textures = await loadTextures();

  const {
    ambientLight,
    camera,
    directionalLight,
    directionalLightCameraHelper,
    directionalLightHelper,
    material,
    plane,
    scene,
    sphere,
    sphereShadow,
  } = setupScene(renderer, textures);

  setupPanelControllers(
    gui,
    ambientLight,
    directionalLight,
    directionalLightCameraHelper,
    directionalLightHelper,
    material,
    plane,
    sphere,
    sphereShadow,
    renderer
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

  animate(renderer, scene, camera, (elapsedTime) => {
    controls.update();

    const x = Math.cos(elapsedTime) * 1.5;
    const y = Math.abs(Math.sin(elapsedTime * 3));
    const z = Math.sin(elapsedTime) * 1.5;

    moveSphere(sphere, sphereShadow, x, y, z);
  });
}
