import * as CANNON from 'cannon-es';
import type { GUI } from 'lil-gui';
import { forkJoin, lastValueFrom } from 'rxjs';
import {
  AmbientLight,
  BoxGeometry,
  Camera,
  CameraHelper,
  type CubeTexture,
  CubeTextureLoader,
  DirectionalLight,
  DirectionalLightHelper,
  type Material,
  Mesh,
  MeshStandardMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SphereGeometry,
  Timer,
  type Vector3Like,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three-stdlib';

import { clamp, html, lerp, normalize } from '@xstate-workshop/utils';

import {
  createControlsPanel,
  fromFullscreenKeyup,
  fromWindowResize,
  getTextureUrl,
} from '../../../utils';

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
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;

  return renderer;
}

type Textures = {
  environmentMap: CubeTexture;
};

function loadTextures(): Promise<Textures> {
  const cubeTextureLoader = new CubeTextureLoader();

  return lastValueFrom(
    forkJoin({
      environmentMap: cubeTextureLoader.loadAsync([
        getTextureUrl('environment-map', ['0', 'px']),
        getTextureUrl('environment-map', ['0', 'nx']),
        getTextureUrl('environment-map', ['0', 'py']),
        getTextureUrl('environment-map', ['0', 'ny']),
        getTextureUrl('environment-map', ['0', 'pz']),
        getTextureUrl('environment-map', ['0', 'nz']),
      ]),
    })
  );
}

function setupPhysics() {
  const world = new CANNON.World();
  world.gravity.set(0, -9.82, 0);
  /*
   * Using a broadphase other than `NaiveBroadphase` is useful as a performance
   * enhancement.
   *
   * N.B. Depending on the broadphase algorithm, collision may not work
   * perfectly as expected.
   */
  /* world.broadphase = new CANNON.SAPBroadphase(world); */
  /*
   * The `allowSleep` property can also be useful for enhancing application
   * performance
   */
  world.allowSleep = true;

  /*
  const concreteMaterial = new CANNON.Material('concrete');
  const plasticMaterial = new CANNON.Material('plastic');

  const concretePlasticContactMaterial = new CANNON.ContactMaterial(
    concreteMaterial,
    plasticMaterial,
    {
      friction: 0.1,
      restitution: 0.7,
    }
  );
  world.addContactMaterial(concretePlasticContactMaterial);
  */
  const defaultMaterial = new CANNON.Material('default');
  const defaultContactMaterial = new CANNON.ContactMaterial(
    defaultMaterial,
    defaultMaterial,
    {
      friction: 0.1,
      restitution: 0.7,
    }
  );
  world.defaultContactMaterial = defaultContactMaterial;

  const floorBody = new CANNON.Body({
    /* material: concreteMaterial, */
    shape: new CANNON.Plane(),
  });
  /*
   * The cannon physics engine uses quaternions primarily for rotation.
   *
   * However, for simplicity sakes, cannon thankfully provides helper methods
   * to rotate the quaternion of bodies using `setFromAxisAngle` and
   * `setFromEuler`.
   */
  /*
  floorBody.quaternion.setFromAxisAngle(
    new CANNON.Vec3(1, 0, 0),
    -Math.PI / 2
  );
  */
  floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0, 'XYZ');

  world.addBody(floorBody);

  return {
    floorBody,
    world,
  };
}

type CreateSphereOptions = {
  mass?: number;
  meshMaterial: Material;
  physicsMaterial?: CANNON.Material;
  position: Vector3Like;
  radius: number;
};

type Sphere = {
  body: CANNON.Body;
  mesh: Mesh<SphereGeometry, Material>;
  update: () => void;
};

function createSphere({
  mass = 1,
  meshMaterial,
  physicsMaterial,
  position,
  radius,
}: CreateSphereOptions): Sphere {
  const body = new CANNON.Body({
    mass,
    material: physicsMaterial,
    shape: new CANNON.Sphere(radius),
  });
  body.position.set(position.x, position.y, position.z);

  const mesh = new Mesh(new SphereGeometry(radius, 32, 32), meshMaterial);
  mesh.position.copy(position);
  mesh.castShadow = true;

  const update = () => {
    mesh.position.copy(body.position);
    mesh.quaternion.copy(body.quaternion);
  };

  return { body, mesh, update };
}

type CollisionEvent = {
  contact: CANNON.ContactEquation;
};

type SphereCollisionEvent = CollisionEvent & {
  impactVelocity: number;
};

type CreateSphereSpawnerOptions = {
  meshMaterial: Material;
  onCollision?: (event: SphereCollisionEvent) => void;
  physicsMaterial?: CANNON.Material;
  scene: Scene;
  world: CANNON.World;
};

type SphereSpawner = {
  dispose: () => void;
  spawn: () => Sphere;
  spheres: Sphere[];
};

function createSphereSpawner({
  meshMaterial,
  onCollision,
  physicsMaterial,
  scene,
  world,
}: CreateSphereSpawnerOptions): SphereSpawner {
  const spheres: Sphere[] = [];

  const handleCollision = (event: CollisionEvent) => {
    const contact = event.contact;
    const impactVelocity: number = contact.getImpactVelocityAlongNormal();
    onCollision?.({ ...event, impactVelocity });
  };

  const dispose = () => {
    spheres.forEach((sphere) => {
      sphere.body.removeEventListener('collide', handleCollision);
      world.removeBody(sphere.body);
      scene.remove(sphere.mesh);
    });

    spheres.splice(0, spheres.length);
  };

  const spawn = () => {
    const randomPosition = {
      x: lerp(Math.random(), -4, 4),
      y: 3,
      z: lerp(Math.random(), -4, 4),
    };

    const sphere = createSphere({
      meshMaterial,
      physicsMaterial,
      position: randomPosition,
      radius: 0.5,
    });

    sphere.body.addEventListener('collide', handleCollision);

    world.addBody(sphere.body);
    scene.add(sphere.mesh);
    spheres.push(sphere);

    return sphere;
  };

  return {
    dispose,
    spawn,
    spheres,
  };
}

enum WallOrientation {
  North,
  East,
  South,
  West,
}

type CreateWallOptions = {
  depth: number;
  height: number;
  meshMaterial: Material;
  offset: number;
  orientation: WallOrientation;
  physicsMaterial?: CANNON.Material;
  width: number;
};

type Wall = {
  body: CANNON.Body;
  mesh: Mesh<BoxGeometry, Material>;
};

function createWall({
  depth,
  height,
  meshMaterial,
  offset,
  orientation,
  physicsMaterial,
  width,
}: CreateWallOptions): Wall {
  let position: Vector3Like;
  let rotation: Vector3Like;

  switch (orientation) {
    case WallOrientation.North: {
      position = { x: 0, y: height / 2, z: -offset - depth / 2 };
      rotation = { x: 0, y: 0, z: 0 };

      break;
    }
    case WallOrientation.East: {
      position = { x: offset + depth / 2, y: height / 2, z: 0 };
      rotation = { x: 0, y: Math.PI / 2, z: 0 };

      break;
    }
    case WallOrientation.South: {
      position = { x: 0, y: height / 2, z: offset + depth / 2 };
      rotation = { x: 0, y: 0, z: 0 };

      break;
    }
    case WallOrientation.West: {
      position = { x: -offset - depth / 2, y: height / 2, z: 0 };
      rotation = { x: 0, y: Math.PI / 2, z: 0 };

      break;
    }
  }

  const body = new CANNON.Body({
    material: physicsMaterial,
    shape: new CANNON.Box(
      new CANNON.Vec3(width * 0.5, height * 0.5, depth * 0.5)
    ),
  });
  body.position.set(position.x, position.y, position.z);
  body.quaternion.setFromEuler(rotation.x, rotation.y, rotation.z, 'XYZ');

  const mesh = new Mesh(new BoxGeometry(width, height, depth), meshMaterial);
  mesh.position.copy(body.position);
  mesh.quaternion.copy(body.quaternion);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return {
    body,
    mesh,
  };
}

type SpawnWallsOptions = {
  meshMaterial: Material;
  physicsMaterial?: CANNON.Material;
  scene: Scene;
  world: CANNON.World;
};

function spawnWalls({
  meshMaterial,
  scene,
  world,
  physicsMaterial,
}: SpawnWallsOptions): Wall[] {
  const walls: Wall[] = [
    createWall({
      depth: 1,
      height: 1,
      meshMaterial,
      offset: 5,
      orientation: WallOrientation.North,
      physicsMaterial,
      width: 12,
    }),
    createWall({
      depth: 1,
      height: 1,
      meshMaterial,
      offset: 5,
      orientation: WallOrientation.East,
      physicsMaterial,
      width: 10,
    }),
    createWall({
      depth: 1,
      height: 1,
      meshMaterial,
      offset: 5,
      orientation: WallOrientation.South,
      physicsMaterial,
      width: 12,
    }),
    createWall({
      depth: 1,
      height: 3,
      meshMaterial,
      offset: 5,
      orientation: WallOrientation.West,
      physicsMaterial,
      width: 10,
    }),
  ];

  walls.forEach((wall) => {
    world.addBody(wall.body);
    scene.add(wall.mesh);
  });

  return walls;
}

type CreateHitSoundPlayerOptions = {
  maximumImpactVelocity?: number;
  maximumVolume?: number;
  minimumImpactVelocity?: number;
  minimumVolume?: number;
};

type HitSoundPlayer = {
  handleCollision: (event: SphereCollisionEvent) => void;
  play: (volume: number) => void;
};

function createHitSoundPlayer(
  options?: CreateHitSoundPlayerOptions
): HitSoundPlayer {
  const {
    maximumImpactVelocity = 7,
    maximumVolume = 1,
    minimumImpactVelocity = 0.3,
    minimumVolume = 0.05,
  } = options ?? {};

  const hitSound = new Audio(
    new URL('../../../assets/audio/hit.mp3', import.meta.url).href
  );

  const play = (volume: number) => {
    hitSound.currentTime = 0;
    hitSound.volume = volume;
    hitSound.play();
  };

  const handleCollision = (event: SphereCollisionEvent) => {
    if (event.impactVelocity < minimumImpactVelocity) return;

    const clamped = Math.min(event.impactVelocity, maximumImpactVelocity);
    const normalized = normalize(
      clamped,
      minimumImpactVelocity,
      maximumImpactVelocity
    );
    const volume = lerp(normalized, minimumVolume, maximumVolume);

    play(volume);
  };

  return { handleCollision, play };
}

function setupScene(textures: Textures) {
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
  directionalLight.shadow.camera.bottom = -7;
  directionalLight.shadow.camera.far = 15;
  directionalLight.shadow.camera.left = -7;
  directionalLight.shadow.camera.right = 7;
  directionalLight.shadow.camera.top = 7;
  directionalLight.shadow.mapSize.set(1024, 1024);

  const directionalLightCameraHelper = new CameraHelper(
    directionalLight.shadow.camera
  );
  directionalLightCameraHelper.visible = false;
  const directionalLightHelper = new DirectionalLightHelper(directionalLight);
  directionalLightHelper.visible = false;

  const floor = new Mesh(
    new PlaneGeometry(10, 10),
    new MeshStandardMaterial({
      color: 0x77_77_77,
      metalness: 0.3,
      roughness: 0.4,
      envMap: textures.environmentMap,
      envMapIntensity: 0.5,
    })
  );
  floor.rotation.x = -Math.PI * 0.5;

  directionalLight.castShadow = true;
  floor.receiveShadow = true;

  scene.add(
    ambientLight,
    camera,
    directionalLight,
    directionalLight.target,
    directionalLightCameraHelper,
    directionalLightHelper,
    floor
  );

  return {
    ambientLight,
    camera,
    directionalLight,
    directionalLightCameraHelper,
    directionalLightHelper,
    floor,
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
  directionalLightCameraHelper: CameraHelper,
  directionalLightHelper: DirectionalLightHelper,
  sphereSpawner: SphereSpawner
) {
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

  const folderSpheres = gui.addFolder('Spheres');

  const controls = {
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
    spheres: {
      spawnSphere: sphereSpawner.spawn,
      disposeSpheres: sphereSpawner.dispose,
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
    spheres: {
      spawnSphere: folderSpheres
        .add(controls.spheres, 'spawnSphere')
        .name('Spawn Sphere'),
      disposeSpheres: folderSpheres
        .add(controls.spheres, 'disposeSpheres')
        .name('Dispose Spheres'),
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
    folderLights.destroy();
    folderSpheres.destroy();
  };
}

export async function run() {
  const gui = createControlsPanel();
  const canvas = setupCanvas();
  const renderer = setupRenderer(canvas);

  const textures = await loadTextures();

  const { world } = setupPhysics();

  const {
    ambientLight,
    camera,
    directionalLight,
    directionalLightCameraHelper,
    directionalLightHelper,
    scene,
  } = setupScene(textures);

  const sphereMaterial = new MeshStandardMaterial({
    envMap: textures.environmentMap,
    envMapIntensity: 0.5,
    metalness: 0.3,
    roughness: 0.4,
  });
  const wallMaterial = new MeshStandardMaterial({
    color: 0x77_77_77,
    metalness: 0.3,
    roughness: 0.4,
    envMap: textures.environmentMap,
    envMapIntensity: 0.5,
  });

  const hitSoundPlayer = createHitSoundPlayer();

  const sphereSpawner = createSphereSpawner({
    meshMaterial: sphereMaterial,
    onCollision: hitSoundPlayer.handleCollision,
    scene,
    world,
  });

  spawnWalls({ meshMaterial: wallMaterial, scene, world });

  setupPanelControllers(
    gui,
    ambientLight,
    directionalLight,
    directionalLightCameraHelper,
    directionalLightHelper,
    sphereSpawner
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
  controls.maxPolarAngle = 1.4;

  animate(renderer, scene, camera, () => {
    sphereSpawner.spheres.forEach((sphere) => {
      /*
      sphere.body.applyLocalForce(
        new CANNON.Vec3(200, 0, 0),
        new CANNON.Vec3(0, 0, 0)
      );
      */
      /* sphere.body.applyForce(new CANNON.Vec3(-0.5, 0, 0), sphere.body.position); */

      sphere.update();
    });

    world.fixedStep();

    controls.update();
  });
}
