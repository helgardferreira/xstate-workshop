import type * as RapierNS from '@dimforge/rapier3d';
import type { GUI } from 'lil-gui';
import { forkJoin, lastValueFrom } from 'rxjs';
import {
  AmbientLight,
  BoxGeometry,
  Camera,
  CameraHelper,
  type DataTexture,
  DirectionalLight,
  DirectionalLightHelper,
  EquirectangularReflectionMapping,
  Euler,
  type Material,
  Mesh,
  MeshStandardMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Quaternion,
  SRGBColorSpace,
  Scene,
  SphereGeometry,
  type Texture,
  Timer,
  Vector3,
  WebGLRenderer,
} from 'three';
import { HDRLoader } from 'three/addons';
import { OrbitControls } from 'three-stdlib';

import { clamp, html, lerp, normalize } from '@xstate-workshop/utils';

import {
  type PhysicsWorldHelper,
  createControlsPanel,
  createPhysicsWorldHelper,
  fromFullscreenKeyup,
  fromTexture,
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
  environmentMap: DataTexture;
  marbleBallAmbientOcclusion: Texture<HTMLImageElement>;
  marbleBallColor: Texture<HTMLImageElement>;
  marbleBallHeight: Texture<HTMLImageElement>;
  marbleBallMetalness: Texture<HTMLImageElement>;
  marbleBallNormal: Texture<HTMLImageElement>;
  marbleBallRoughness: Texture<HTMLImageElement>;
};

function loadTextures(): Promise<Textures> {
  const hdrLoader = new HDRLoader();

  return lastValueFrom(
    forkJoin({
      environmentMap: hdrLoader.loadAsync(
        getTextureUrl('environment-map', ['1', '2k'])
      ),
      marbleBallAmbientOcclusion: fromTexture(
        getTextureUrl('marble-ball', 'ambient-occlusion')
      ),
      marbleBallColor: fromTexture(getTextureUrl('marble-ball', 'color')),
      marbleBallHeight: fromTexture(getTextureUrl('marble-ball', 'height')),
      marbleBallMetalness: fromTexture(
        getTextureUrl('marble-ball', 'metalness')
      ),
      marbleBallNormal: fromTexture(getTextureUrl('marble-ball', 'normal')),
      marbleBallRoughness: fromTexture(
        getTextureUrl('marble-ball', 'roughness')
      ),
    })
  );
}

type Controls = {
  lights: {
    ambientLight: {
      color: number | undefined;
      intensity: number | undefined;
      visible: boolean | undefined;
    };
    directionalLight: {
      position: Vector3 | undefined;
      shadow: {
        camera: {
          top: number | undefined;
          right: number | undefined;
          bottom: number | undefined;
          left: number | undefined;
          near: number | undefined;
          far: number | undefined;
          helper: boolean | undefined;
        };
        mapSize: number | undefined;
      };
      color: number | undefined;
      intensity: number | undefined;
      visible: boolean | undefined;
      helper: boolean | undefined;
    };
  };
  physics: {
    helper: boolean | undefined;
  };
  spheres: {
    spawnSphere: (() => Sphere) | undefined;
    disposeSpheres: ((sphere?: Sphere) => void) | undefined;
  };
};

const controls: Controls = {
  lights: {
    ambientLight: {
      color: undefined,
      intensity: undefined,
      visible: undefined,
    },
    directionalLight: {
      position: undefined,
      shadow: {
        camera: {
          top: undefined,
          right: undefined,
          bottom: undefined,
          left: undefined,
          near: undefined,
          far: undefined,
          helper: undefined,
        },
        mapSize: undefined,
      },
      color: undefined,
      intensity: undefined,
      visible: undefined,
      helper: undefined,
    },
  },
  physics: {
    helper: undefined,
  },
  spheres: {
    spawnSphere: undefined,
    disposeSpheres: undefined,
  },
};

function setupPanelControllers(
  gui: GUI,
  ambientLight: AmbientLight,
  directionalLight: DirectionalLight,
  directionalLightCameraHelper: CameraHelper,
  directionalLightHelper: DirectionalLightHelper,
  floor: Floor,
  sphereSpawner: SphereSpawner,
  walls: Wall[],
  physicsWorldHelper: PhysicsWorldHelper
) {
  const folderLights = gui.addFolder('Lights');

  const folderLightsAmbient = folderLights.addFolder('Ambient Light');
  folderLightsAmbient.close();

  const folderLightsDirectional = folderLights.addFolder('Directional Light');
  folderLightsDirectional.close();

  const folderLightsDirectionalPosition =
    folderLightsDirectional.addFolder('Position');
  folderLightsDirectionalPosition.close();
  const folderLightsDirectionalShadow =
    folderLightsDirectional.addFolder('Shadow');
  const folderLightsDirectionalShadowCamera =
    folderLightsDirectionalShadow.addFolder('Camera');
  folderLightsDirectionalShadow.close();

  const folderPhysics = gui.addFolder('Physics');

  const folderSpheres = gui.addFolder('Spheres');

  controls.lights.ambientLight.color = ambientLight.color.getHex();
  controls.lights.ambientLight.intensity = ambientLight.intensity;
  controls.lights.ambientLight.visible = ambientLight.visible;
  controls.lights.directionalLight.position = directionalLight.position;
  controls.lights.directionalLight.shadow.camera.top =
    directionalLight.shadow.camera.top;
  controls.lights.directionalLight.shadow.camera.right =
    directionalLight.shadow.camera.right;
  controls.lights.directionalLight.shadow.camera.bottom =
    directionalLight.shadow.camera.bottom;
  controls.lights.directionalLight.shadow.camera.left =
    directionalLight.shadow.camera.left;
  controls.lights.directionalLight.shadow.camera.near =
    directionalLight.shadow.camera.near;
  controls.lights.directionalLight.shadow.camera.far =
    directionalLight.shadow.camera.far;
  controls.lights.directionalLight.shadow.camera.helper =
    directionalLightCameraHelper.visible;
  controls.lights.directionalLight.shadow.mapSize =
    directionalLight.shadow.mapSize.x;
  controls.lights.directionalLight.color = directionalLight.color.getHex();
  controls.lights.directionalLight.intensity = directionalLight.intensity;
  controls.lights.directionalLight.visible = directionalLight.visible;
  controls.lights.directionalLight.helper = directionalLightHelper.visible;
  controls.physics.helper = physicsWorldHelper.lines.visible;
  controls.spheres.spawnSphere = sphereSpawner.spawn;
  controls.spheres.disposeSpheres = sphereSpawner.dispose;

  const controllers = {
    lights: {
      ambientLight: {
        color: folderLightsAmbient
          .addColor(controls.lights.ambientLight, 'color')
          .name('Color'),
        intensity: folderLightsAmbient
          .add(controls.lights.ambientLight, 'intensity')
          .max(10)
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
          .max(10)
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
    physics: {
      helper: folderPhysics.add(controls.physics, 'helper').name('Helper'),
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
        value && (controls.lights.directionalLight.visible ?? false);
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
      value && (controls.lights.directionalLight.shadow.camera.helper ?? false);
    directionalLightHelper.visible =
      value && (controls.lights.directionalLight.helper ?? false);
  });
  controllers.lights.directionalLight.helper.onChange((value: boolean) => {
    directionalLightHelper.visible =
      value && (controls.lights.directionalLight.visible ?? false);
  });

  controllers.physics.helper.onChange((value: boolean) => {
    if (value) {
      floor.mesh.visible = false;
      sphereSpawner.spheres.forEach((sphere) => {
        sphere.mesh.visible = false;
      });
      walls.forEach((wall) => {
        wall.mesh.visible = false;
      });
    } else {
      floor.mesh.visible = true;
      sphereSpawner.spheres.forEach((sphere) => {
        sphere.mesh.visible = true;
      });
      walls.forEach((wall) => {
        wall.mesh.visible = true;
      });
    }

    physicsWorldHelper.lines.visible = value;
  });

  return () => {
    folderLights.destroy();
    folderPhysics.destroy();
    folderSpheres.destroy();
  };
}

type DeathZoneTag = {
  type: 'DEATH_ZONE';
};
type EnvironmentTag = {
  type: 'ENVIRONMENT';
};
type SphereTag = {
  type: 'SPHERE';
};
type Tag = DeathZoneTag | EnvironmentTag | SphereTag;

const tags = new Map<number, Tag>();

async function setupPhysics() {
  const Rapier = await import('@dimforge/rapier3d');

  const world = new Rapier.World({ x: 0, y: -9.82, z: 0 });

  return { Rapier, world };
}

type DeathZone = {
  body: RapierNS.RigidBody;
  collider: RapierNS.Collider;
  dispose: () => void;
};

function createDeathZone(
  Rapier: typeof RapierNS,
  world: RapierNS.World
): DeathZone {
  const body = world.createRigidBody(
    Rapier.RigidBodyDesc.fixed().setTranslation(0, -20, 0)
  );
  const collider = world.createCollider(
    Rapier.ColliderDesc.cuboid(50, 1, 50)
      .setSensor(true)
      .setActiveEvents(Rapier.ActiveEvents.COLLISION_EVENTS),
    body
  );
  tags.set(collider.handle, { type: 'DEATH_ZONE' });

  const dispose = () => world.removeRigidBody(body);

  return { body, collider, dispose };
}

type CreateFloorOptions = {
  height: number;
  meshMaterial: Material;
  width: number;
};

type Floor = {
  body: RapierNS.RigidBody;
  collider: RapierNS.Collider;
  dispose: () => void;
  mesh: Mesh<PlaneGeometry, Material>;
};

function createFloor(
  Rapier: typeof RapierNS,
  world: RapierNS.World,
  scene: Scene,
  { height, meshMaterial, width }: CreateFloorOptions
): Floor {
  const body = world.createRigidBody(Rapier.RigidBodyDesc.fixed());
  const collider = world.createCollider(
    Rapier.ColliderDesc.cuboid(5, 0.1, 5).setFriction(0.1).setRestitution(0.8),
    body
  );
  tags.set(collider.handle, { type: 'ENVIRONMENT' });

  const mesh = new Mesh(new PlaneGeometry(width, height), meshMaterial);
  mesh.rotation.x = -Math.PI * 0.5;
  mesh.receiveShadow = true;
  if (controls.physics.helper === true) mesh.visible = false;
  scene.add(mesh);

  const dispose = () => {
    scene.remove(mesh);
    tags.delete(collider.handle);
    world.removeRigidBody(body);
  };

  return { body, collider, dispose, mesh };
}

type CreateSphereOptions = {
  meshMaterial: Material;
  position: Vector3;
  radius: number;
};

type Sphere = {
  body: RapierNS.RigidBody;
  collider: RapierNS.Collider;
  dispose: () => void;
  mesh: Mesh<SphereGeometry, Material>;
  update: () => void;
};

function createSphere(
  Rapier: typeof RapierNS,
  world: RapierNS.World,
  scene: Scene,
  { meshMaterial, position, radius }: CreateSphereOptions
): Sphere {
  const body = world.createRigidBody(
    Rapier.RigidBodyDesc.dynamic()
      .setAngularDamping(0.2)
      .setLinearDamping(0)
      .setTranslation(position.x, position.y, position.z)
  );
  const collider = world.createCollider(
    Rapier.ColliderDesc.ball(radius)
      .setActiveEvents(Rapier.ActiveEvents.CONTACT_FORCE_EVENTS)
      .setFriction(0.5)
      .setMass(1)
      .setRestitution(0.8),
    body
  );
  tags.set(collider.handle, { type: 'SPHERE' });

  const mesh = new Mesh(new SphereGeometry(radius, 32, 32), meshMaterial);
  mesh.position.copy(position);
  mesh.castShadow = true;
  if (controls.physics.helper === true) mesh.visible = false;
  scene.add(mesh);

  const dispose = () => {
    scene.remove(mesh);
    tags.delete(collider.handle);
    world.removeRigidBody(body);
  };

  const update = () => {
    mesh.position.copy(body.translation());
    mesh.quaternion.copy(body.rotation());
  };

  return { body, collider, dispose, mesh, update };
}

type CreateSphereSpawnerOptions = {
  meshMaterial: Material;
};

type SphereSpawner = {
  dispose: (sphere?: Sphere) => void;
  spawn: () => Sphere;
  spheres: Set<Sphere>;
  update: () => void;
};

function createSphereSpawner(
  Rapier: typeof RapierNS,
  world: RapierNS.World,
  scene: Scene,
  { meshMaterial }: CreateSphereSpawnerOptions
): SphereSpawner {
  const spheres = new Set<Sphere>();

  const dispose = (sphere?: Sphere) => {
    if (sphere) {
      sphere.dispose();
      spheres.delete(sphere);
    } else {
      spheres.forEach((sphere) => sphere.dispose());
      spheres.clear();
    }
  };

  const spawn = () => {
    const randomPosition = new Vector3(
      lerp(Math.random(), -1, 1),
      3,
      lerp(Math.random(), -1, 1)
    );

    const sphere = createSphere(Rapier, world, scene, {
      meshMaterial,
      position: randomPosition,
      radius: 0.5,
    });

    spheres.add(sphere);

    return sphere;
  };

  const update = () => spheres.forEach((sphere) => sphere.update());

  return { dispose, spawn, spheres, update };
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
  width: number;
};

type Wall = {
  body: RapierNS.RigidBody;
  collider: RapierNS.Collider;
  dispose: () => void;
  mesh: Mesh<BoxGeometry, Material>;
};

function createWall(
  Rapier: typeof RapierNS,
  world: RapierNS.World,
  scene: Scene,
  { depth, height, meshMaterial, offset, orientation, width }: CreateWallOptions
): Wall {
  const position = new Vector3();
  const rotation = new Quaternion();

  switch (orientation) {
    case WallOrientation.North: {
      position.set(0, height / 2, -offset - depth / 2);
      rotation.setFromEuler(new Euler(0, 0, 0));
      break;
    }
    case WallOrientation.East: {
      position.set(offset + depth / 2, height / 2, 0);
      rotation.setFromEuler(new Euler(0, Math.PI / 2, 0));
      break;
    }
    case WallOrientation.South: {
      position.set(0, height / 2, offset + depth / 2);
      rotation.setFromEuler(new Euler(0, 0, 0));
      break;
    }
    case WallOrientation.West: {
      position.set(-offset - depth / 2, height / 2, 0);
      rotation.setFromEuler(new Euler(0, Math.PI / 2, 0));
      break;
    }
  }

  const body = world.createRigidBody(
    Rapier.RigidBodyDesc.fixed()
      .setRotation(rotation)
      .setTranslation(position.x, position.y, position.z)
  );
  const collider = world.createCollider(
    Rapier.ColliderDesc.cuboid(width * 0.5, height * 0.5, depth * 0.5)
      .setFriction(0.1)
      .setRestitution(0.8),
    body
  );
  tags.set(collider.handle, { type: 'ENVIRONMENT' });

  const mesh = new Mesh(new BoxGeometry(width, height, depth), meshMaterial);
  mesh.position.copy(body.translation());
  mesh.quaternion.copy(body.rotation());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (controls.physics.helper === true) mesh.visible = false;
  scene.add(mesh);

  const dispose = () => {
    scene.remove(mesh);
    tags.delete(collider.handle);
    world.removeRigidBody(body);
  };

  return { body, collider, dispose, mesh };
}

type SpawnWallsOptions = {
  meshMaterial: Material;
};

function spawnWalls(
  Rapier: typeof RapierNS,
  world: RapierNS.World,
  scene: Scene,
  { meshMaterial }: SpawnWallsOptions
): Wall[] {
  const walls: Wall[] = [
    createWall(Rapier, world, scene, {
      depth: 1,
      height: 1,
      meshMaterial,
      offset: 5,
      orientation: WallOrientation.North,
      width: 12,
    }),
    createWall(Rapier, world, scene, {
      depth: 1,
      height: 1,
      meshMaterial,
      offset: 5,
      orientation: WallOrientation.East,
      width: 10,
    }),
    createWall(Rapier, world, scene, {
      depth: 1,
      height: 1,
      meshMaterial,
      offset: 5,
      orientation: WallOrientation.South,
      width: 12,
    }),
    createWall(Rapier, world, scene, {
      depth: 1,
      height: 1,
      meshMaterial,
      offset: 5,
      orientation: WallOrientation.West,
      width: 10,
    }),
  ];

  return walls;
}

type CreateHitSoundPlayerOptions = {
  compression: number;
  maxIntensity: number;
  minIntensity: number;
};

type HitSoundPlayer = {
  play: (force: number, dt: number, mass1: number, mass2: number) => void;
};

function createHitSoundPlayer(
  options?: CreateHitSoundPlayerOptions
): HitSoundPlayer {
  const {
    compression = 9,
    maxIntensity = 13,
    minIntensity = 1,
  } = options ?? {};

  const hitSound = new Audio(
    new URL('../../../assets/audio/hit.mp3', import.meta.url).href
  );

  const playHitSound = (volume: number) => {
    const currentTime = hitSound.currentTime;
    const currentVolume = hitSound.volume;
    const duration = hitSound.duration;
    const isPlaying = currentTime > 0 && !hitSound.paused && !hitSound.ended;
    const progress = currentTime / duration;

    if (isPlaying && volume < currentVolume && progress < 0.5) return;

    hitSound.currentTime = 0;
    hitSound.volume = volume;
    hitSound.play();
  };

  const impactToVolume = (
    force: number,
    dt: number,
    mass1: number,
    mass2: number
  ) => {
    const impulse = Math.max(0, force) * Math.max(0, dt);

    const clampedMass1 = clamp(mass1, 1e-9, Infinity);
    const clampedMass2 = clamp(mass2, 1e-9, Infinity);
    const reducedMass =
      (clampedMass1 * clampedMass2) / (clampedMass1 + clampedMass2);

    const intensity = impulse / reducedMass;

    const t = clamp(normalize(intensity, minIntensity, maxIntensity), 0, 1);
    if (t === 0) return 0;

    return Math.log1p(compression * t) / Math.log1p(compression);
  };

  const play = (force: number, dt: number, mass1: number, mass2: number) => {
    const volume = impactToVolume(force, dt, mass1, mass2);
    if (volume === 0) return;
    playHitSound(volume);
  };

  return { play };
}

function setupScene(textures: Textures) {
  const scene = new Scene();
  scene.background = textures.environmentMap;
  scene.environment = textures.environmentMap;

  const camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(8, 4, 8);

  const ambientLight = new AmbientLight(0xff_ff_ff, 0.6);

  const directionalLight = new DirectionalLight(0xff_ff_ff, 2.1);
  directionalLight.position.set(-10, 10, -5);
  directionalLight.shadow.camera.bottom = -7;
  directionalLight.shadow.camera.near = 8;
  directionalLight.shadow.camera.far = 22;
  directionalLight.shadow.camera.left = -7;
  directionalLight.shadow.camera.right = 7;
  directionalLight.shadow.camera.top = 7;
  directionalLight.shadow.mapSize.set(1024, 1024);
  directionalLight.castShadow = true;

  const directionalLightCameraHelper = new CameraHelper(
    directionalLight.shadow.camera
  );
  directionalLightCameraHelper.visible = false;
  const directionalLightHelper = new DirectionalLightHelper(directionalLight);
  directionalLightHelper.visible = false;

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

  let animationFrameHandle: number | undefined;

  const tick = () => {
    timer.update();
    const elapsedTime = timer.getElapsed();
    const deltaTime = elapsedTime - prevElapsedTime;
    prevElapsedTime = elapsedTime;
    onFrame?.(elapsedTime, deltaTime);
    renderer.render(scene, camera);
    animationFrameHandle = requestAnimationFrame(tick);
  };

  tick();

  return () => {
    if (animationFrameHandle) {
      cancelAnimationFrame(animationFrameHandle);
    }
  };
}

export async function run() {
  const gui = createControlsPanel();
  const canvas = setupCanvas();
  const renderer = setupRenderer(canvas);

  const textures = await loadTextures();
  textures.environmentMap.mapping = EquirectangularReflectionMapping;

  const { Rapier, world } = await setupPhysics();

  const {
    ambientLight,
    camera,
    directionalLight,
    directionalLightCameraHelper,
    directionalLightHelper,
    scene,
  } = setupScene(textures);

  const physicsWorldHelper = createPhysicsWorldHelper(world);
  physicsWorldHelper.lines.visible = false;
  scene.add(physicsWorldHelper.lines);

  textures.marbleBallColor.colorSpace = SRGBColorSpace;

  const sphereMaterial = new MeshStandardMaterial({
    aoMap: textures.marbleBallAmbientOcclusion,
    envMap: textures.environmentMap,
    map: textures.marbleBallColor,
    metalness: 1,
    metalnessMap: textures.marbleBallMetalness,
    roughness: 0,
    roughnessMap: textures.marbleBallRoughness,
  });
  const environmentMaterial = new MeshStandardMaterial({
    color: 0x77_77_77,
    envMap: textures.environmentMap,
    metalness: 0.8,
    roughness: 1,
  });

  const hitSoundPlayer = createHitSoundPlayer();

  const deathZone = createDeathZone(Rapier, world);
  const floor = createFloor(Rapier, world, scene, {
    height: 10,
    width: 10,
    meshMaterial: environmentMaterial,
  });
  const sphereSpawner = createSphereSpawner(Rapier, world, scene, {
    meshMaterial: sphereMaterial,
  });
  const walls = spawnWalls(Rapier, world, scene, {
    meshMaterial: environmentMaterial,
  });

  const disposeControllers = setupPanelControllers(
    gui,
    ambientLight,
    directionalLight,
    directionalLightCameraHelper,
    directionalLightHelper,
    floor,
    sphereSpawner,
    walls,
    physicsWorldHelper
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
  orbitControls.enablePan = false;
  orbitControls.enableZoom = false;
  orbitControls.maxPolarAngle = 1.4;

  const eventQueue = new Rapier.EventQueue(true);

  const spheresToRemove = new Set<Sphere>();

  const handleCollisionEvent = (
    handle1: number,
    handle2: number,
    started: boolean
  ) => {
    try {
      if (!started) return;

      const tag1 = tags.get(handle1);
      const tag2 = tags.get(handle2);

      let sphereHandle: number | undefined;

      if (tag1?.type === 'SPHERE') sphereHandle = handle1;
      else if (tag2?.type === 'SPHERE') sphereHandle = handle2;
      if (sphereHandle === undefined) return;

      for (const sphere of sphereSpawner.spheres) {
        if (sphere.collider.handle === sphereHandle) {
          spheresToRemove.add(sphere);

          break;
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleContactForceEvent = (event: RapierNS.TempContactForceEvent) => {
    try {
      hitSoundPlayer.play(
        event.maxForceMagnitude(),
        world.timestep,
        world.getCollider(event.collider1()).mass(),
        world.getCollider(event.collider2()).mass()
      );
    } catch (error) {
      console.error(error);
    }
  };

  const cancelAnimation = animate(renderer, scene, camera, () => {
    orbitControls.update();
    world.step(eventQueue);
    sphereSpawner.update();
    physicsWorldHelper.update();
    eventQueue.drainCollisionEvents(handleCollisionEvent);
    eventQueue.drainContactForceEvents(handleContactForceEvent);

    spheresToRemove.forEach((sphere) => sphereSpawner.dispose(sphere));
    spheresToRemove.clear();
  });

  return () => {
    cancelAnimation();
    disposeControllers();
    eventQueue.free();

    deathZone.dispose();
    floor.dispose();
    sphereSpawner.dispose();
    walls.forEach((wall) => wall.dispose());
  };
}
