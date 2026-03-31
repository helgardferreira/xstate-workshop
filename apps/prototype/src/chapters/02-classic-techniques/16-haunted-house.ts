import type { GUI } from 'lil-gui';
import { forkJoin, lastValueFrom } from 'rxjs';
import {
  AmbientLight,
  BoxGeometry,
  Camera,
  CameraHelper,
  ConeGeometry,
  DirectionalLight,
  DirectionalLightHelper,
  FogExp2,
  Group,
  type Material,
  Mesh,
  MeshStandardMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  RepeatWrapping,
  SRGBColorSpace,
  Scene,
  SphereGeometry,
  type Texture,
  Timer,
  type Vector3,
  WebGLRenderer,
} from 'three';
import { OrbitControls, Sky } from 'three-stdlib';

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
  castleBrickBrokenArm: Texture<HTMLImageElement>;
  castleBrickBrokenColor: Texture<HTMLImageElement>;
  castleBrickBrokenNormal: Texture<HTMLImageElement>;
  coastSandRocksArm: Texture<HTMLImageElement>;
  coastSandRocksColor: Texture<HTMLImageElement>;
  coastSandRocksDisplacement: Texture<HTMLImageElement>;
  coastSandRocksNormal: Texture<HTMLImageElement>;
  doorAlpha: Texture<HTMLImageElement>;
  doorAmbientOcclusion: Texture<HTMLImageElement>;
  doorColor: Texture<HTMLImageElement>;
  doorHeight: Texture<HTMLImageElement>;
  doorMetalness: Texture<HTMLImageElement>;
  doorNormal: Texture<HTMLImageElement>;
  doorRoughness: Texture<HTMLImageElement>;
  floorAlpha: Texture<HTMLImageElement>;
  leavesForestGroundArm: Texture<HTMLImageElement>;
  leavesForestGroundColor: Texture<HTMLImageElement>;
  leavesForestGroundNormal: Texture<HTMLImageElement>;
  plasteredStoneWallArm: Texture<HTMLImageElement>;
  plasteredStoneWallColor: Texture<HTMLImageElement>;
  plasteredStoneWallNormal: Texture<HTMLImageElement>;
  roofSlatesArm: Texture<HTMLImageElement>;
  roofSlatesColor: Texture<HTMLImageElement>;
  roofSlatesNormal: Texture<HTMLImageElement>;
};

function loadTextures(): Promise<Textures> {
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
      coastSandRocksArm: fromTexture(
        getTextureUrl('coast-sand-rocks', 'coast-sand-rocks-arm')
      ),
      coastSandRocksColor: fromTexture(
        getTextureUrl('coast-sand-rocks', 'coast-sand-rocks-diff')
      ),
      coastSandRocksDisplacement: fromTexture(
        getTextureUrl('coast-sand-rocks', 'coast-sand-rocks-disp')
      ),
      coastSandRocksNormal: fromTexture(
        getTextureUrl('coast-sand-rocks', 'coast-sand-rocks-nor-gl')
      ),
      doorAlpha: fromTexture(getTextureUrl('door', 'alpha')),
      doorAmbientOcclusion: fromTexture(
        getTextureUrl('door', 'ambient-occlusion')
      ),
      doorColor: fromTexture(getTextureUrl('door', 'color')),
      doorHeight: fromTexture(getTextureUrl('door', 'height')),
      doorMetalness: fromTexture(getTextureUrl('door', 'metalness')),
      doorNormal: fromTexture(getTextureUrl('door', 'normal')),
      doorRoughness: fromTexture(getTextureUrl('door', 'roughness')),
      floorAlpha: fromTexture(getTextureUrl('floor', 'alpha')),
      leavesForestGroundArm: fromTexture(
        getTextureUrl('leaves-forest-ground', 'leaves-forest-ground-arm')
      ),
      leavesForestGroundColor: fromTexture(
        getTextureUrl('leaves-forest-ground', 'leaves-forest-ground-diff')
      ),
      leavesForestGroundNormal: fromTexture(
        getTextureUrl('leaves-forest-ground', 'leaves-forest-ground-nor-gl')
      ),
      plasteredStoneWallArm: fromTexture(
        getTextureUrl('plastered-stone-wall', 'plastered-stone-wall-arm')
      ),
      plasteredStoneWallColor: fromTexture(
        getTextureUrl('plastered-stone-wall', 'plastered-stone-wall-diff')
      ),
      plasteredStoneWallNormal: fromTexture(
        getTextureUrl('plastered-stone-wall', 'plastered-stone-wall-nor-gl')
      ),
      roofSlatesArm: fromTexture(
        getTextureUrl('roof-slates', 'roof-slates-arm')
      ),
      roofSlatesColor: fromTexture(
        getTextureUrl('roof-slates', 'roof-slates-diff')
      ),
      roofSlatesNormal: fromTexture(
        getTextureUrl('roof-slates', 'roof-slates-nor-gl')
      ),
    })
  );
}

export function setupScene(renderer: WebGLRenderer, textures: Textures) {
  const scene = new Scene();
  scene.fog = new FogExp2(0x04_34_3f, 0.1);

  const camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );

  camera.position.set(4, 2, 5);

  const ambientLight = new AmbientLight(0x86_cd_ff, 0.275);

  const directionalLight = new DirectionalLight(0x86_cd_ff, 1);
  directionalLight.shadow.mapSize.width = 256;
  directionalLight.shadow.mapSize.height = 256;
  directionalLight.shadow.camera.top = 8;
  directionalLight.shadow.camera.right = 8;
  directionalLight.shadow.camera.bottom = -8;
  directionalLight.shadow.camera.left = -8;
  directionalLight.shadow.camera.near = 1;
  directionalLight.shadow.camera.far = 20;

  directionalLight.position.set(3, 2, -8);
  const directionalLightCameraHelper = new CameraHelper(
    directionalLight.shadow.camera
  );
  directionalLightCameraHelper.visible = false;
  const directionalLightHelper = new DirectionalLightHelper(directionalLight);
  directionalLightHelper.visible = false;

  const ghost1 = new PointLight(0x88_00_ff, 6);
  ghost1.shadow.mapSize.width = 256;
  ghost1.shadow.mapSize.height = 256;
  ghost1.shadow.camera.far = 10;

  const ghost2 = new PointLight(0xff_00_88, 6);
  ghost2.shadow.mapSize.width = 256;
  ghost2.shadow.mapSize.height = 256;
  ghost2.shadow.camera.far = 10;

  const ghost3 = new PointLight(0xff_00_00, 6);
  ghost3.shadow.mapSize.width = 256;
  ghost3.shadow.mapSize.height = 256;
  ghost3.shadow.camera.far = 10;

  scene.add(ghost1, ghost2, ghost3);

  const sky = new Sky();
  sky.material.uniforms['turbidity'].value = 10;
  sky.material.uniforms['rayleigh'].value = 3;
  sky.material.uniforms['mieCoefficient'].value = 0.1;
  sky.material.uniforms['mieDirectionalG'].value = 0.95;
  (sky.material.uniforms['sunPosition'].value as Vector3).set(
    0.3,
    -0.038,
    -0.95
  );
  sky.scale.set(100, 100, 100);
  scene.add(sky);

  textures.castleBrickBrokenColor.colorSpace = SRGBColorSpace;
  textures.coastSandRocksColor.colorSpace = SRGBColorSpace;
  textures.doorColor.colorSpace = SRGBColorSpace;
  textures.leavesForestGroundColor.colorSpace = SRGBColorSpace;
  textures.plasteredStoneWallColor.colorSpace = SRGBColorSpace;
  textures.roofSlatesColor.colorSpace = SRGBColorSpace;

  textures.coastSandRocksArm.repeat.set(8, 8);
  textures.coastSandRocksColor.repeat.set(8, 8);
  textures.coastSandRocksDisplacement.repeat.set(8, 8);
  textures.coastSandRocksNormal.repeat.set(8, 8);

  textures.coastSandRocksArm.wrapS = RepeatWrapping;
  textures.coastSandRocksColor.wrapS = RepeatWrapping;
  textures.coastSandRocksDisplacement.wrapS = RepeatWrapping;
  textures.coastSandRocksNormal.wrapS = RepeatWrapping;

  textures.coastSandRocksArm.wrapT = RepeatWrapping;
  textures.coastSandRocksColor.wrapT = RepeatWrapping;
  textures.coastSandRocksDisplacement.wrapT = RepeatWrapping;
  textures.coastSandRocksNormal.wrapT = RepeatWrapping;

  textures.roofSlatesArm.repeat.set(3, 1);
  textures.roofSlatesColor.repeat.set(3, 1);
  textures.roofSlatesNormal.repeat.set(3, 1);

  textures.roofSlatesArm.wrapS = RepeatWrapping;
  textures.roofSlatesColor.wrapS = RepeatWrapping;
  textures.roofSlatesNormal.wrapS = RepeatWrapping;

  textures.leavesForestGroundArm.repeat.set(2, 1);
  textures.leavesForestGroundColor.repeat.set(2, 1);
  textures.leavesForestGroundNormal.repeat.set(2, 1);

  textures.leavesForestGroundArm.wrapS = RepeatWrapping;
  textures.leavesForestGroundColor.wrapS = RepeatWrapping;
  textures.leavesForestGroundNormal.wrapS = RepeatWrapping;

  textures.plasteredStoneWallArm.repeat.set(0.3, 0.4);
  textures.plasteredStoneWallColor.repeat.set(0.3, 0.4);
  textures.plasteredStoneWallNormal.repeat.set(0.3, 0.4);

  const floor = new Mesh(
    new PlaneGeometry(20, 20, 100, 100),
    new MeshStandardMaterial({
      alphaMap: textures.floorAlpha,
      aoMap: textures.coastSandRocksArm,
      displacementBias: -0.2,
      displacementMap: textures.coastSandRocksDisplacement,
      displacementScale: 0.3,
      map: textures.coastSandRocksColor,
      metalnessMap: textures.coastSandRocksArm,
      normalMap: textures.coastSandRocksNormal,
      roughnessMap: textures.coastSandRocksArm,
      transparent: true,
    })
  );
  floor.rotation.x = -Math.PI * 0.5;
  scene.add(floor);

  const house = new Group();
  scene.add(house);

  const doorLight = new PointLight(0xff_7d_46, 5);
  doorLight.position.set(0, 2.2, 2.5);
  house.add(doorLight);

  const walls = new Mesh(
    new BoxGeometry(4, 2.5, 4),
    new MeshStandardMaterial({
      aoMap: textures.castleBrickBrokenArm,
      map: textures.castleBrickBrokenColor,
      metalnessMap: textures.castleBrickBrokenArm,
      normalMap: textures.castleBrickBrokenNormal,
      roughnessMap: textures.castleBrickBrokenArm,
    })
  );
  walls.position.y += 1.25;
  house.add(walls);

  const roof = new Mesh(
    new ConeGeometry(3.5, 1.5, 4),
    new MeshStandardMaterial({
      aoMap: textures.roofSlatesArm,
      map: textures.roofSlatesColor,
      metalnessMap: textures.roofSlatesArm,
      normalMap: textures.roofSlatesNormal,
      roughnessMap: textures.roofSlatesArm,
    })
  );
  roof.position.y = 2.5 + 0.75;
  roof.rotation.y = Math.PI * 0.25;
  house.add(roof);

  const door = new Mesh(
    new PlaneGeometry(2.2, 2.2, 100, 100),
    new MeshStandardMaterial({
      alphaMap: textures.doorAlpha,
      aoMap: textures.doorAmbientOcclusion,
      displacementBias: -0.04,
      displacementMap: textures.doorHeight,
      displacementScale: 0.15,
      map: textures.doorColor,
      metalnessMap: textures.doorMetalness,
      normalMap: textures.doorNormal,
      roughnessMap: textures.doorRoughness,
      transparent: true,
    })
  );
  door.position.y = 1;
  door.position.z = 2.01;
  house.add(door);

  const bushGeometry = new SphereGeometry(1, 16, 16);
  const bushMaterial = new MeshStandardMaterial({
    aoMap: textures.leavesForestGroundArm,
    color: 0xcc_ff_cc,
    map: textures.leavesForestGroundColor,
    metalnessMap: textures.leavesForestGroundArm,
    normalMap: textures.leavesForestGroundNormal,
    roughnessMap: textures.leavesForestGroundArm,
  });

  const bush1 = new Mesh(bushGeometry, bushMaterial);
  bush1.scale.set(0.5, 0.5, 0.5);
  bush1.position.set(0.8, 0.2, 2.2);
  bush1.rotation.x = -0.75;

  const bush2 = new Mesh(bushGeometry, bushMaterial);
  bush2.scale.set(0.25, 0.25, 0.25);
  bush2.position.set(1.4, 0.1, 2.1);
  bush2.rotation.x = -0.75;

  const bush3 = new Mesh(bushGeometry, bushMaterial);
  bush3.scale.set(0.4, 0.4, 0.4);
  bush3.position.set(-0.8, 0.1, 2.2);
  bush3.rotation.x = -0.75;

  const bush4 = new Mesh(bushGeometry, bushMaterial);
  bush4.scale.set(0.15, 0.15, 0.15);
  bush4.position.set(-1, 0.05, 2.6);
  bush4.rotation.x = -0.75;

  house.add(bush1, bush2, bush3, bush4);

  const graveGeometry = new BoxGeometry(0.6, 0.8, 0.2);
  const graveMaterial = new MeshStandardMaterial({
    aoMap: textures.plasteredStoneWallArm,
    map: textures.plasteredStoneWallColor,
    metalnessMap: textures.plasteredStoneWallArm,
    normalMap: textures.plasteredStoneWallNormal,
    roughnessMap: textures.plasteredStoneWallArm,
  });

  const graves = new Group();
  scene.add(graves);

  for (let i = 0; i < 30; i++) {
    const angle = Math.random() * Math.PI * 2;
    const graveRadius = 3 + Math.random() * 4;
    const x = Math.sin(angle) * graveRadius;
    const z = Math.cos(angle) * graveRadius;

    const grave = new Mesh(graveGeometry, graveMaterial);
    grave.position.x = x;
    grave.position.y = Math.random() * 0.4;
    grave.position.z = z;
    grave.rotation.x = (Math.random() - 0.5) * 0.4;
    grave.rotation.y = (Math.random() - 0.5) * 0.4;
    grave.rotation.z = (Math.random() - 0.5) * 0.4;

    graves.add(grave);
  }

  if (renderer.shadowMap.enabled === true) {
    directionalLight.castShadow = true;
    ghost1.castShadow = true;
    ghost2.castShadow = true;
    ghost3.castShadow = true;
    floor.receiveShadow = true;
    graves.children.forEach((grave) => {
      grave.castShadow = true;
      grave.receiveShadow = true;
    });
    roof.castShadow = true;
    walls.castShadow = true;
    walls.receiveShadow = true;
  } else {
    directionalLightCameraHelper.visible = false;
  }

  scene.add(
    ambientLight,
    camera,
    directionalLight,
    directionalLight.target,
    directionalLightCameraHelper,
    directionalLightHelper
  );

  return {
    ambientLight,
    camera,
    directionalLight,
    directionalLightCameraHelper,
    directionalLightHelper,
    floor,
    ghost1,
    ghost2,
    ghost3,
    graves,
    roof,
    scene,
    walls,
  };
}

export function animate(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: Camera,
  onFrame?: (elapsedTime: number) => void
) {
  const timer = new Timer();

  const tick = () => {
    timer.update();
    const elapsedTime = timer.getElapsed();
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
  ghost1: PointLight,
  ghost2: PointLight,
  ghost3: PointLight,
  floor: Mesh<PlaneGeometry, Material>,
  graves: Group,
  roof: Mesh<ConeGeometry, Material>,
  walls: Mesh<BoxGeometry, Material>,
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
  folderLightsDirectionalShadow.close();
  const folderLightsDirectionalShadowCamera =
    folderLightsDirectionalShadow.addFolder('Camera');

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
        },
        color: directionalLight.color.getHex(),
        intensity: directionalLight.intensity,
        visible: directionalLight.visible,
        helper: directionalLightHelper.visible,
      },
    },
  };

  const controllers = {
    renderer: {
      shadowMap: {
        enabled: folderRendererShadowMap
          .add(controls.renderer.shadowMap, 'enabled')
          .name('Enabled'),
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
              .max(500)
              .min(0.5)
              .name('Near')
              .step(0.01),
            far: folderLightsDirectionalShadowCamera
              .add(controls.lights.directionalLight.shadow.camera, 'far')
              .max(500)
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

  if (controls.renderer.shadowMap.enabled === false) {
    folderLightsDirectionalShadow.hide();
  }

  controllers.renderer.shadowMap.enabled.onChange((value: boolean) => {
    if (value === false) {
      controllers.lights.directionalLight.shadow.camera.helper.setValue(false);
      folderLightsDirectionalShadow.hide();

      directionalLight.castShadow = false;
      ghost1.castShadow = false;
      ghost2.castShadow = false;
      ghost3.castShadow = false;

      floor.receiveShadow = false;
      graves.children.forEach((grave) => {
        grave.castShadow = false;
        grave.receiveShadow = false;
      });
      roof.castShadow = false;
      walls.castShadow = false;
      walls.receiveShadow = false;
    } else {
      controllers.lights.directionalLight.shadow.camera.helper.setValue(true);
      folderLightsDirectionalShadow.show();

      directionalLight.castShadow = true;
      ghost1.castShadow = true;
      ghost2.castShadow = true;
      ghost3.castShadow = true;

      floor.receiveShadow = true;
      graves.children.forEach((grave) => {
        grave.castShadow = true;
        grave.receiveShadow = true;
      });
      roof.castShadow = true;
      walls.castShadow = true;
      walls.receiveShadow = true;
    }
    renderer.shadowMap.enabled = value;
  });

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

  return () => {
    folderRenderer.destroy();
    folderLights.destroy();
  };
}

type AnimateGhostOptions = {
  horizontalRadius?: number;
  speed?: number;
  verticalOffset?: number;
};

function animateGhost(
  ghost: PointLight,
  elapsedTime: number,
  options: AnimateGhostOptions = {}
) {
  const { horizontalRadius = 4, speed = 0.5, verticalOffset = 1 } = options;
  const theta = elapsedTime * speed;

  const x = Math.cos(theta) * horizontalRadius;
  const y =
    Math.sin(theta) * Math.sin(theta * 2.34) * Math.sin(theta * 3.45) +
    verticalOffset;
  const z = Math.sin(theta) * horizontalRadius;

  ghost.position.set(x, y, z);
}

export async function run() {
  const gui = createControlsPanel({ hide: true });
  const canvas = setupCanvas();
  const renderer = setupRenderer(canvas);

  const textures = await loadTextures();

  const {
    ambientLight,
    camera,
    directionalLight,
    directionalLightCameraHelper,
    directionalLightHelper,
    floor,
    ghost1,
    ghost2,
    ghost3,
    graves,
    roof,
    scene,
    walls,
  } = setupScene(renderer, textures);

  setupPanelControllers(
    gui,
    ambientLight,
    directionalLight,
    directionalLightCameraHelper,
    directionalLightHelper,
    ghost1,
    ghost2,
    ghost3,
    floor,
    graves,
    roof,
    walls,
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
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.maxPolarAngle = Math.PI * 0.4;
  controls.minPolarAngle = Math.PI * 0.4;

  animate(renderer, scene, camera, (elapsedTime) => {
    animateGhost(ghost1, elapsedTime);
    animateGhost(ghost2, elapsedTime, { horizontalRadius: 5, speed: -0.38 });
    animateGhost(ghost3, elapsedTime, { horizontalRadius: 6, speed: 0.3 });

    controls.update();
  });
}
