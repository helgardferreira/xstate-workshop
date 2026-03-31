import type * as RapierNS from '@dimforge/rapier3d';
import type { GUI } from 'lil-gui';
import { forkJoin, lastValueFrom } from 'rxjs';
import {
  BoxGeometry,
  Camera,
  CameraHelper,
  Color,
  type DataTexture,
  DirectionalLight,
  DirectionalLightHelper,
  EquirectangularReflectionMapping,
  type Material,
  Mesh,
  MeshStandardMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  RepeatWrapping,
  SRGBColorSpace,
  Scene,
  SphereGeometry,
  type Texture,
  Timer,
  TubeGeometry,
  Vector3,
  type Vector3Like,
  WebGLRenderer,
} from 'three';
import { HDRLoader } from 'three/addons';
import { OrbitControls } from 'three-stdlib';

import { clamp, html } from '@xstate-workshop/utils';

import {
  type CreateBasicRopeGeometryOptions,
  type PhysicsWorldHelper,
  createBasicRopeGeometry,
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
  // TODO: swap out ropeMaterial for metallic rod
  ropeColor: Texture<HTMLImageElement>;
  ropeHeight: Texture<HTMLImageElement>;
  ropeMetalness: Texture<HTMLImageElement>;
  ropeNormal: Texture<HTMLImageElement>;
  ropeRoughness: Texture<HTMLImageElement>;
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
      ropeColor: fromTexture(getTextureUrl('rope', 'color')),
      ropeHeight: fromTexture(getTextureUrl('rope', 'height')),
      ropeMetalness: fromTexture(getTextureUrl('rope', 'metalness')),
      ropeNormal: fromTexture(getTextureUrl('rope', 'normal')),
      ropeRoughness: fromTexture(getTextureUrl('rope', 'roughness')),
    })
  );
}

type Controls = {
  lights: {
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
};

const controls: Controls = {
  lights: {
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
};

function setupPanelControllers(
  gui: GUI,
  directionalLight: DirectionalLight,
  directionalLightCameraHelper: CameraHelper,
  directionalLightHelper: DirectionalLightHelper,
  physicsWorldHelper: PhysicsWorldHelper
) {
  const folderLights = gui.addFolder('Lights');

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

  const controllers = {
    lights: {
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
  };

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
    physicsWorldHelper.lines.visible = value;
  });

  return () => {
    folderLights.destroy();
    folderPhysics.destroy();
  };
}

async function setupPhysics() {
  const Rapier = await import('@dimforge/rapier3d');

  const world = new Rapier.World({ x: 0, y: -9.82, z: 0 });

  return { Rapier, world };
}

type CreateCeilingOptions = {
  depth: number;
  height: number;
  material: Material;
  width: number;
};

type Ceiling = {
  body: RapierNS.RigidBody;
  collider: RapierNS.Collider;
  dispose: () => void;
  mesh: Mesh<BoxGeometry, Material>;
};

function createCeiling(
  Rapier: typeof RapierNS,
  world: RapierNS.World,
  scene: Scene,
  { depth, height, material, width }: CreateCeilingOptions
): Ceiling {
  const body = world.createRigidBody(
    Rapier.RigidBodyDesc.fixed().setTranslation(0, 3, 0)
  );
  const collider = world.createCollider(
    Rapier.ColliderDesc.cuboid(width * 0.5, height * 0.5, depth * 0.5)
      .setFriction(0.1)
      .setRestitution(0.8),
    body
  );

  const mesh = new Mesh(new BoxGeometry(width, height, depth), material);
  mesh.position.copy(body.translation());
  mesh.quaternion.copy(body.rotation());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  const dispose = () => {
    scene.remove(mesh);
    world.removeRigidBody(body);
  };

  return { body, collider, dispose, mesh };
}

type CreateBobOptions = {
  material: Material;
  radius: number;
};

type Bob = {
  body: RapierNS.RigidBody;
  collider: RapierNS.Collider;
  dispose: () => void;
  mesh: Mesh<SphereGeometry, Material>;
  update: () => void;
};

function createBob(
  Rapier: typeof RapierNS,
  world: RapierNS.World,
  scene: Scene,
  { material, radius }: CreateBobOptions
): Bob {
  const body = world.createRigidBody(
    Rapier.RigidBodyDesc.dynamic()
      /*
       * Linear / angular damping (via `setLinearDamping` and
       * `setAngularDamping` respectively) can be used to slow down a rigid body
       * separate from contact friction.
       *
       * For example, introducing "air" / "rope tension" resistance for
       * something like a pendulum.
       */
      /*
      .setAngularDamping(0.2)
      .setLinearDamping(0.1)
      */
      .setTranslation(0, -1, 0)
  );
  const collider = world.createCollider(
    Rapier.ColliderDesc.ball(radius).setMass(1).setRestitution(0.8),
    body
  );

  const mesh = new Mesh(new SphereGeometry(radius, 32, 32), material);
  mesh.position.copy(body.translation());
  mesh.quaternion.copy(body.rotation());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  const dispose = () => {
    scene.remove(mesh);
    world.removeRigidBody(body);
  };

  const update = () => {
    mesh.position.copy(body.translation());
    mesh.quaternion.copy(body.rotation());
  };

  return { body, collider, dispose, mesh, update };
}

type CreateSphericalAnchorOptions = {
  anchorOffset?: Vector3Like;
  bobBody: RapierNS.RigidBody;
  ceilingBody: RapierNS.RigidBody;
  material: Material;
  // TODO: rename this
  rope?: Omit<CreateBasicRopeGeometryOptions, 'points'>;
};

type SphericalAnchor = {
  dispose: () => void;
  joint: RapierNS.ImpulseJoint;
  mesh: Mesh<TubeGeometry, Material>;
  update: () => void;
};

/**
 * The spherical joint ensures that two points on the local-spaces of two
 * rigid-bodies always coincide (it prevents any relative translational motion
 * at this points).
 *
 * This is typically used to simulate ragdolls arms, pendulums, etc.
 *
 * They are characterized by one local anchor on each rigid-body. Each anchor
 * represents the location of the points that need to coincide on the
 * local-space of each rigid-body.
 */
function createSphericalAnchor(
  Rapier: typeof RapierNS,
  world: RapierNS.World,
  scene: Scene,
  {
    anchorOffset = { x: 0, y: 0, z: 0 },
    bobBody,
    ceilingBody,
    material,
    rope,
  }: CreateSphericalAnchorOptions
): SphericalAnchor {
  const ceilingPosition = new Vector3().copy(ceilingBody.translation());
  const bobPosition = new Vector3().copy(bobBody.translation());

  const jointPosition = new Vector3().addVectors(ceilingPosition, anchorOffset);
  const anchorCeilingPosition = new Vector3().subVectors(
    jointPosition,
    ceilingPosition
  );
  const anchorBobPosition = new Vector3().subVectors(
    jointPosition,
    bobPosition
  );

  const joint = world.createImpulseJoint(
    Rapier.JointData.spherical(anchorCeilingPosition, anchorBobPosition),
    ceilingBody,
    bobBody,
    true
  );

  const mesh = new Mesh(
    createBasicRopeGeometry({
      points: [ceilingPosition, jointPosition, bobPosition],
      ...rope,
    }),
    material
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  const dispose = () => {
    scene.remove(mesh);
    world.removeImpulseJoint(joint, true);
  };

  const update = () => {
    ceilingPosition.copy(ceilingBody.translation());
    jointPosition.copy(jointPosition);
    bobPosition.copy(bobBody.translation());

    mesh.geometry.dispose();
    mesh.geometry = createBasicRopeGeometry({
      points: [ceilingPosition, jointPosition, bobPosition],
      ...rope,
    });
  };

  return { dispose, joint, mesh, update };
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
  camera.position.set(7, 0, 7);

  const directionalLight = new DirectionalLight(new Color(3, 2, 2.5), 2.1);
  directionalLight.position.set(-15, -0.5, -2);

  directionalLight.shadow.camera.bottom = -7;
  directionalLight.shadow.camera.near = 4;
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
    camera,
    directionalLight,
    directionalLight.target,
    directionalLightCameraHelper,
    directionalLightHelper
  );

  return {
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
    camera,
    directionalLight,
    directionalLightCameraHelper,
    directionalLightHelper,
    scene,
  } = setupScene(textures);

  const physicsWorldHelper = createPhysicsWorldHelper(world);
  physicsWorldHelper.lines.visible = controls.physics.helper ?? false;
  scene.add(physicsWorldHelper.lines);

  textures.marbleBallColor.colorSpace = SRGBColorSpace;
  textures.ropeColor.colorSpace = SRGBColorSpace;

  textures.ropeColor.repeat.x = 2;
  textures.ropeColor.wrapS = RepeatWrapping;
  textures.ropeHeight.repeat.x = 2;
  textures.ropeHeight.wrapS = RepeatWrapping;
  textures.ropeMetalness.repeat.x = 2;
  textures.ropeMetalness.wrapS = RepeatWrapping;
  textures.ropeNormal.repeat.x = 2;
  textures.ropeNormal.wrapS = RepeatWrapping;
  textures.ropeRoughness.repeat.x = 2;
  textures.ropeRoughness.wrapS = RepeatWrapping;

  const bobMaterial = new MeshStandardMaterial({
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
  // TODO: swap out ropeMaterial for metallic rod
  const ropeMaterial = new MeshStandardMaterial({
    displacementMap: textures.ropeHeight,
    displacementScale: 0.05,
    envMap: textures.environmentMap,
    map: textures.ropeColor,
    metalness: 1,
    metalnessMap: textures.ropeMetalness,
    normalMap: textures.ropeNormal,
    roughness: 1,
    roughnessMap: textures.ropeRoughness,
  });

  const ceiling = createCeiling(Rapier, world, scene, {
    depth: 10,
    height: 0.1,
    material: environmentMaterial,
    width: 10,
  });

  const bob = createBob(Rapier, world, scene, {
    material: bobMaterial,
    radius: 0.8,
  });

  const sphericalAnchor = createSphericalAnchor(Rapier, world, scene, {
    bobBody: bob.body,
    ceilingBody: ceiling.body,
    anchorOffset: { x: 0, y: -0.1, z: 0 },
    material: ropeMaterial,
  });

  bob.body.applyImpulse({ x: 0, y: 0, z: 6 }, true);

  const disposeControllers = setupPanelControllers(
    gui,
    directionalLight,
    directionalLightCameraHelper,
    directionalLightHelper,
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
  orbitControls.minPolarAngle = 1.4;

  const eventQueue = new Rapier.EventQueue(true);

  const cancelAnimation = animate(renderer, scene, camera, () => {
    orbitControls.update();
    world.step(eventQueue);
    bob.update();
    sphericalAnchor.update();
    physicsWorldHelper.update();
  });

  return () => {
    cancelAnimation();
    disposeControllers();
    eventQueue.free();

    bob.dispose();
    ceiling.dispose();
    sphericalAnchor.dispose();
  };
}
