import type * as RapierNS from '@dimforge/rapier3d';
import type { GUI } from 'lil-gui';
import { forkJoin, fromEvent, lastValueFrom } from 'rxjs';
import {
  BoxGeometry,
  Camera,
  CameraHelper,
  CircleGeometry,
  Color,
  Curve,
  CylinderGeometry,
  type DataTexture,
  DirectionalLight,
  DirectionalLightHelper,
  DoubleSide,
  EquirectangularReflectionMapping,
  Euler,
  Group,
  type Intersection,
  type Material,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
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
import { OrbitControls, RaycasterHelper } from 'three-stdlib';

import { clamp, html, smootherstep } from '@xstate-workshop/utils';

import {
  type PhysicsWorldHelper,
  PointerCoordinatesSubject,
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
  cobblestoneFloorArm: Texture<HTMLImageElement>;
  cobblestoneFloorColor: Texture<HTMLImageElement>;
  cobblestoneFloorDisplacement: Texture<HTMLImageElement>;
  cobblestoneFloorNormal: Texture<HTMLImageElement>;
  environmentMap: DataTexture;
  marbleBallAmbientOcclusion: Texture<HTMLImageElement>;
  marbleBallColor: Texture<HTMLImageElement>;
  marbleBallHeight: Texture<HTMLImageElement>;
  marbleBallMetalness: Texture<HTMLImageElement>;
  marbleBallNormal: Texture<HTMLImageElement>;
  marbleBallRoughness: Texture<HTMLImageElement>;
  rustyCorrugatedIronArm: Texture<HTMLImageElement>;
  rustyCorrugatedIronColor: Texture<HTMLImageElement>;
  rustyCorrugatedIronNormal: Texture<HTMLImageElement>;
  rustyMetalArm: Texture<HTMLImageElement>;
  rustyMetalColor: Texture<HTMLImageElement>;
  rustyMetalNormal: Texture<HTMLImageElement>;
  woodCabinetWornLongArm: Texture<HTMLImageElement>;
  woodCabinetWornLongColor: Texture<HTMLImageElement>;
  woodCabinetWornLongNormal: Texture<HTMLImageElement>;
};

function loadTextures(): Promise<Textures> {
  const hdrLoader = new HDRLoader();

  return lastValueFrom(
    forkJoin({
      cobblestoneFloorArm: fromTexture(
        getTextureUrl('cobblestone-floor', 'cobblestone-floor-arm')
      ),
      cobblestoneFloorColor: fromTexture(
        getTextureUrl('cobblestone-floor', 'cobblestone-floor-diff')
      ),
      cobblestoneFloorDisplacement: fromTexture(
        getTextureUrl('cobblestone-floor', 'cobblestone-floor-disp')
      ),
      cobblestoneFloorNormal: fromTexture(
        getTextureUrl('cobblestone-floor', 'cobblestone-floor-nor-gl')
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
      environmentMap: hdrLoader.loadAsync(
        getTextureUrl('environment-map', ['1', '2k'])
      ),
      rustyCorrugatedIronArm: fromTexture(
        getTextureUrl('rusty-corrugated-iron', 'rusty-corrugated-iron-arm')
      ),
      rustyCorrugatedIronColor: fromTexture(
        getTextureUrl('rusty-corrugated-iron', 'rusty-corrugated-iron-diff')
      ),
      rustyCorrugatedIronNormal: fromTexture(
        getTextureUrl('rusty-corrugated-iron', 'rusty-corrugated-iron-nor-gl')
      ),
      rustyMetalArm: fromTexture(
        getTextureUrl('rusty-metal', 'rusty-metal-arm')
      ),
      rustyMetalColor: fromTexture(
        getTextureUrl('rusty-metal', 'rusty-metal-diff')
      ),
      rustyMetalNormal: fromTexture(
        getTextureUrl('rusty-metal', 'rusty-metal-nor-gl')
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
        normalBias: number | undefined;
        bias: number | undefined;
      };
      color: number | undefined;
      intensity: number | undefined;
      visible: boolean | undefined;
      helper: boolean | undefined;
    };
  };
  physics: {
    helper: boolean | undefined;
    running: boolean | undefined;
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
        normalBias: undefined,
        bias: undefined,
      },
      color: undefined,
      intensity: undefined,
      visible: undefined,
      helper: undefined,
    },
  },
  physics: {
    helper: true,
    running: undefined,
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
  controls.lights.directionalLight.shadow.normalBias =
    directionalLight.shadow.normalBias;
  controls.lights.directionalLight.shadow.bias = directionalLight.shadow.bias;
  controls.lights.directionalLight.color = directionalLight.color.getHex();
  controls.lights.directionalLight.intensity = directionalLight.intensity;
  controls.lights.directionalLight.visible = directionalLight.visible;
  controls.lights.directionalLight.helper = directionalLightHelper.visible;

  controls.physics.helper = physicsWorldHelper.lines.visible;
  controls.physics.running ??= true;

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
              .max(20)
              .min(0.1)
              .name('Top')
              .step(0.01),
            right: folderLightsDirectionalShadowCamera
              .add(controls.lights.directionalLight.shadow.camera, 'right')
              .max(20)
              .min(0.1)
              .name('Right')
              .step(0.01),
            bottom: folderLightsDirectionalShadowCamera
              .add(controls.lights.directionalLight.shadow.camera, 'bottom')
              .max(-0.1)
              .min(-20)
              .name('Bottom')
              .step(0.01),
            left: folderLightsDirectionalShadowCamera
              .add(controls.lights.directionalLight.shadow.camera, 'left')
              .max(-0.1)
              .min(-20)
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
          normalBias: folderLightsDirectionalShadow
            .add(controls.lights.directionalLight.shadow, 'normalBias')
            .max(0.05)
            .min(-0.05)
            .name('Normal Bias')
            .step(0.001),
          bias: folderLightsDirectionalShadow
            .add(controls.lights.directionalLight.shadow, 'bias')
            .max(0.05)
            .min(-0.05)
            .name('Bias')
            .step(0.001),
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
      running: folderPhysics.add(controls.physics, 'running').name('Running'),
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
  controllers.lights.directionalLight.shadow.normalBias.onChange(
    (value: number) => {
      directionalLight.shadow.normalBias = value;
    }
  );
  controllers.lights.directionalLight.shadow.bias.onChange((value: number) => {
    directionalLight.shadow.bias = value;
  });

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

type DeathZoneTag = {
  type: 'DEATH_ZONE';
};
type BallTag = {
  type: 'BALL';
};
type Tag = DeathZoneTag | BallTag;

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
  depth: number;
  material: Material;
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
  { depth, material, width }: CreateFloorOptions
): Floor {
  const body = world.createRigidBody(
    Rapier.RigidBodyDesc.fixed().setTranslation(0, 0, 0)
  );
  const collider = world.createCollider(
    Rapier.ColliderDesc.cuboid(width * 0.5, 0.05, depth * 0.5)
      .setFriction(0.1)
      .setRestitution(0.5),
    body
  );

  const mesh = new Mesh(new PlaneGeometry(width, depth, 128, 128), material);
  mesh.position.copy(body.translation());
  mesh.rotation.set(-Math.PI / 2, 0, 0);
  mesh.receiveShadow = true;
  scene.add(mesh);

  const dispose = () => {
    scene.remove(mesh);
    world.removeRigidBody(body);
  };

  return { body, collider, dispose, mesh };
}

type CreatePlatformOptions = {
  density?: number;
  depth: number;
  height: number;
  mass?: number;
  material: Material;
  width: number;
};

type Platform = {
  body: RapierNS.RigidBody;
  collider: RapierNS.Collider;
  dispose: () => void;
  mesh: Mesh<BoxGeometry, Material>;
  update: () => void;
};

function createPlatform(
  Rapier: typeof RapierNS,
  world: RapierNS.World,
  scene: Scene,
  { density, depth, height, mass, material, width }: CreatePlatformOptions
): Platform {
  const body = world.createRigidBody(
    Rapier.RigidBodyDesc.dynamic()
      /*
       * It's possible to lock rotations / translations as well as specifying
       * which axes should allow translations / rotations.
       */
      /*
      .lockRotations()
      .lockTranslations()
      .enabledRotations(true, false, true)
      .enabledTranslations(false, true, false)
      */
      .setAngularDamping(1.0)
      .setLinearDamping(0.1)
      .setTranslation(0, 3, 0)
  );
  const colliderDescription = Rapier.ColliderDesc.cuboid(
    width * 0.5,
    height * 0.5,
    depth * 0.5
  )
    .setFriction(0.1)
    .setRestitution(0.8);
  if (density !== undefined) colliderDescription.setDensity(density);
  else if (mass !== undefined) colliderDescription.setMass(mass);
  const collider = world.createCollider(colliderDescription, body);

  const mesh = new Mesh(
    new BoxGeometry(width, height, depth, 128, 128),
    material
  );
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

type CreateBallOptions = {
  density?: number;
  mass?: number;
  material: Material;
  position: Vector3Like;
  radius: number;
};

type Ball = {
  body: RapierNS.RigidBody;
  collider: RapierNS.Collider;
  dispose: () => void;
  mesh: Mesh<SphereGeometry, Material>;
  update: () => void;
};

function createBall(
  Rapier: typeof RapierNS,
  world: RapierNS.World,
  scene: Scene,
  { density, mass, material, position, radius }: CreateBallOptions
): Ball {
  const body = world.createRigidBody(
    Rapier.RigidBodyDesc.dynamic()
      .setAngularDamping(0.2)
      .setLinearDamping(0)
      .setTranslation(position.x, position.y, position.z)
  );
  const colliderDescription = Rapier.ColliderDesc.ball(radius)
    .setFriction(0.5)
    .setRestitution(0.8);
  if (density !== undefined) colliderDescription.setDensity(density);
  else if (mass !== undefined) colliderDescription.setMass(mass);
  const collider = world.createCollider(colliderDescription, body);
  tags.set(collider.handle, { type: 'BALL' });

  const mesh = new Mesh(new SphereGeometry(radius, 64, 64), material);
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

type CreateBallSpawnerOptions = {
  density?: number;
  mass?: number;
  material: Material;
  radius: number;
};

type BallSpawner = {
  balls: Set<Ball>;
  dispose: (ball?: Ball) => void;
  spawn: (position: Vector3Like) => Ball;
  update: () => void;
};

function createBallSpawner(
  Rapier: typeof RapierNS,
  world: RapierNS.World,
  scene: Scene,
  { material, radius, density, mass }: CreateBallSpawnerOptions
): BallSpawner {
  const balls = new Set<Ball>();

  const dispose = (ball?: Ball) => {
    if (ball) {
      ball.dispose();
      balls.delete(ball);
    } else {
      balls.forEach((ball) => ball.dispose());
      balls.clear();
    }
  };

  const spawn = (position: Vector3Like) => {
    const ball = createBall(Rapier, world, scene, {
      density,
      mass,
      material,
      position,
      radius,
    });

    balls.add(ball);

    return ball;
  };

  const update = () => balls.forEach((ball) => ball.update());

  return {
    balls,
    dispose,
    spawn,
    update,
  };
}

type SpringCurveOptions = {
  height?: number;
  radius?: number;
  turns?: number;
  warp?: number;
};

class SpringCurve extends Curve<Vector3> {
  public readonly height: number;
  public readonly radius: number;
  public readonly turns: number;
  public readonly warp: number;

  constructor(options: SpringCurveOptions = {}) {
    super();

    const { height = 1, radius = 1, turns = 4, warp = 1 } = options;

    this.height = height;
    this.radius = radius;
    this.turns = turns;
    this.warp = warp;
  }

  public override getPoint(
    t: number,
    optionalTarget: Vector3 = new Vector3()
  ): Vector3 {
    const tx = this.radius * Math.sin(2 * Math.PI * t * this.turns);
    const ty =
      this.height * (t * (1 - this.warp) + smootherstep(t) * this.warp);
    const tz = this.radius * Math.cos(2 * Math.PI * t * this.turns);

    return optionalTarget.set(tx, ty, tz);
  }

  public getCapRotation(optionalTarget: Euler = new Euler()): Euler {
    const { x, z } = this.getPoint(1);

    return optionalTarget.set(0, Math.atan2(x, z) + Math.PI / 2, 0);
  }
}

enum SpringCorner {
  TopLeft,
  TopRight,
  BottomRight,
  BottomLeft,
}

type CreateSpringAnchorOptions = {
  corner: SpringCorner;
  /**
   * How strongly the spring damps relative motion along the spring direction.
   *
   * Damping reduces oscillation (“bounciness”) and helps the system settle.
   * Too little can wobble forever; too much can feel sluggish or over-damped.
   */
  damping?: number;
  floorBody: RapierNS.RigidBody;
  material: Material;
  platformBody: RapierNS.RigidBody;
  platformCollider: RapierNS.Collider;
  platformMesh: Mesh<BoxGeometry, Material>;
  /**
   * The target (equilibrium) distance between the two joint anchor points.
   *
   * At runtime the spring applies forces to keep the current anchor-to-anchor
   * distance close to this value. If the distance is larger, the spring pulls;
   * if smaller, it pushes.
   */
  restLength?: number;
  /**
   * How strongly the spring resists deviation from `restLength`.
   *
   * Higher values make the spring “stiffer” (it returns to `restLength` more
   * aggressively), but overly large stiffness can require a smaller timestep /
   * more solver iterations to remain stable.
   */
  stiffness?: number;
};

type SpringAnchor = {
  dispose: () => void;
  group: Group;
  joint: RapierNS.ImpulseJoint;
  update: () => void;
};

const SPRING_RADIAL_SEGMENTS = 8;
const SPRING_RADIUS = 0.2;
const SPRING_THICKNESS = 0.05;
const SPRING_TUBULAR_SEGMENTS = 128;
const SPRING_TURNS = 12;
const SPRING_WARP = 0.4;

/**
 * A spring joint tries to keep the distance between two local anchors near a
 * rest length, with stiffness plus damping.
 */
function createSpringAnchor(
  Rapier: typeof RapierNS,
  world: RapierNS.World,
  scene: Scene,
  {
    corner,
    damping = 8,
    floorBody,
    material,
    platformBody,
    platformCollider,
    platformMesh,
    restLength = 2,
    stiffness = 80,
  }: CreateSpringAnchorOptions
): SpringAnchor {
  const floorPosition = floorBody.translation();
  const platformPosition = platformBody.translation();

  if (!(platformCollider.shape instanceof Rapier.Cuboid)) {
    throw new Error('Platform collider must be a cuboid');
  }

  const halfExtents = platformCollider.shape.halfExtents;

  let anchorPlatformPosition: Vector3;

  switch (corner) {
    case SpringCorner.TopLeft: {
      anchorPlatformPosition = new Vector3(
        -halfExtents.x * (2 / 3),
        0,
        -halfExtents.z * (2 / 3)
      );

      break;
    }
    case SpringCorner.TopRight: {
      anchorPlatformPosition = new Vector3(
        halfExtents.x * (2 / 3),
        0,
        -halfExtents.z * (2 / 3)
      );

      break;
    }
    case SpringCorner.BottomRight: {
      anchorPlatformPosition = new Vector3(
        halfExtents.x * (2 / 3),
        0,
        halfExtents.z * (2 / 3)
      );
      break;
    }
    case SpringCorner.BottomLeft: {
      anchorPlatformPosition = new Vector3(
        -halfExtents.x * (2 / 3),
        0,
        halfExtents.z * (2 / 3)
      );

      break;
    }
  }

  const anchorFloorPosition = new Vector3()
    .addVectors(floorPosition, {
      x: platformPosition.x,
      y: 0,
      z: platformPosition.z,
    })
    .add(anchorPlatformPosition);

  /*
   * This only works if the floor has no rotation, is center of the world, and
   * is a fixed rigid body.
   */
  const anchorFloorWorldPosition = new Vector3().addVectors(
    floorPosition,
    anchorFloorPosition
  );

  const joint = world.createImpulseJoint(
    Rapier.JointData.spring(
      restLength,
      stiffness,
      damping,
      anchorFloorPosition,
      anchorPlatformPosition
    ),
    floorBody,
    platformBody,
    true
  );

  const initialHeight = platformMesh
    .localToWorld(anchorPlatformPosition.clone())
    .distanceTo(anchorFloorWorldPosition);

  const path = new SpringCurve({
    height: initialHeight,
    radius: SPRING_RADIUS,
    turns: SPRING_TURNS,
    warp: SPRING_WARP,
  });

  const group = new Group();

  const spring = new Mesh(
    new TubeGeometry(
      path,
      SPRING_TUBULAR_SEGMENTS,
      SPRING_THICKNESS,
      SPRING_RADIAL_SEGMENTS
    ),
    material
  );
  spring.name = 'Spring_spring';
  spring.castShadow = true;
  spring.receiveShadow = true;

  const endCap = new Mesh(new CircleGeometry(SPRING_THICKNESS), material);
  endCap.castShadow = true;
  endCap.receiveShadow = true;
  endCap.name = 'Spring_endCap';
  path.getPoint(1, endCap.position);
  path.getCapRotation(endCap.rotation);

  const startCap = new Mesh(new CircleGeometry(SPRING_THICKNESS), material);
  startCap.castShadow = true;
  startCap.receiveShadow = true;
  startCap.name = 'Spring_startCap';
  path.getPoint(0, startCap.position);
  path.getCapRotation(startCap.rotation);

  group.add(startCap, endCap, spring);
  /*
   * This only works if the floor has no rotation, is center of the world, and
   * is a fixed rigid body.
   */
  group.position.addVectors(
    { x: platformPosition.x, y: 0, z: platformPosition.z },
    anchorPlatformPosition
  );
  scene.add(group);

  const dispose = () => {
    scene.remove(group);
    world.removeImpulseJoint(joint, true);
  };

  const update = () => {
    const height = platformMesh
      .localToWorld(anchorPlatformPosition.clone())
      .distanceTo(anchorFloorWorldPosition);

    const path = new SpringCurve({
      height,
      radius: SPRING_RADIUS,
      turns: SPRING_TURNS,
      warp: SPRING_WARP,
    });

    path.getCapRotation(endCap.rotation);
    path.getCapRotation(startCap.rotation);
    path.getPoint(0, startCap.position);
    path.getPoint(1, endCap.position);

    spring.geometry.dispose();
    spring.geometry = new TubeGeometry(
      path,
      SPRING_TUBULAR_SEGMENTS,
      SPRING_THICKNESS,
      SPRING_RADIAL_SEGMENTS
    );
  };

  return { dispose, group, joint, update };
}

type CreateSpringAnchorsSpawnerOptions = {
  floorBody: RapierNS.RigidBody;
  material: Material;
  platformBody: RapierNS.RigidBody;
  platformCollider: RapierNS.Collider;
  platformMesh: Mesh<BoxGeometry, Material>;
};

type SpringAnchorsSpawner = {
  dispose: () => void;
  spawn: () => SpringAnchor[];
  springAnchors: SpringAnchor[];
  update: () => void;
};

function createSpringAnchorsSpawner(
  Rapier: typeof RapierNS,
  world: RapierNS.World,
  scene: Scene,
  {
    floorBody,
    material,
    platformBody,
    platformCollider,
    platformMesh,
  }: CreateSpringAnchorsSpawnerOptions
): SpringAnchorsSpawner {
  const springAnchors: SpringAnchor[] = [];

  const dispose = () =>
    springAnchors.forEach((springAnchor) => springAnchor.dispose());

  const spawn = () => {
    if (springAnchors.length > 0) return springAnchors;

    springAnchors.push(
      createSpringAnchor(Rapier, world, scene, {
        corner: SpringCorner.TopLeft,
        floorBody,
        material,
        platformBody,
        platformCollider,
        platformMesh,
      }),
      createSpringAnchor(Rapier, world, scene, {
        corner: SpringCorner.TopRight,
        floorBody,
        material,
        platformBody,
        platformCollider,
        platformMesh,
      }),
      createSpringAnchor(Rapier, world, scene, {
        corner: SpringCorner.BottomRight,
        floorBody,
        material,
        platformBody,
        platformCollider,
        platformMesh,
      }),
      createSpringAnchor(Rapier, world, scene, {
        corner: SpringCorner.BottomLeft,
        floorBody,
        material,
        platformBody,
        platformCollider,
        platformMesh,
      })
    );

    return springAnchors;
  };

  const update = () =>
    springAnchors.forEach((springAnchor) => springAnchor.update());

  return {
    dispose,
    spawn,
    springAnchors,
    update,
  };
}

type CreateGuidePostAnchor = {
  floorBody: RapierNS.RigidBody;
  material: Material;
  platformBody: RapierNS.RigidBody;
  platformMesh: Mesh<BoxGeometry, Material>;
};

type GuidePostAnchor = {
  dispose: () => void;
  joint: RapierNS.ImpulseJoint;
  mesh: Mesh<CylinderGeometry, Material>;
  update: () => void;
};

function createGuidePostAnchor(
  Rapier: typeof RapierNS,
  world: RapierNS.World,
  scene: Scene,
  { floorBody, material, platformBody, platformMesh }: CreateGuidePostAnchor
): GuidePostAnchor {
  const floorPosition = floorBody.translation();
  const platformPosition = platformBody.translation();

  const anchorFloorPosition = new Vector3().addVectors(floorPosition, {
    x: platformPosition.x,
    y: 0,
    z: platformPosition.z,
  });
  const anchorPlatformPosition = new Vector3(0, 0, 0);

  /*
   * Lock sideways translation (joint Y/Z) and yaw (rotation about joint X).
   */
  const locked =
    Rapier.JointAxesMask.LinY |
    Rapier.JointAxesMask.LinZ |
    Rapier.JointAxesMask.AngX;

  const joint = world.createImpulseJoint(
    Rapier.JointData.generic(
      anchorFloorPosition,
      anchorPlatformPosition,
      Object3D.DEFAULT_UP,
      locked
    ),
    floorBody,
    platformBody,
    true
  );

  /*
   * This only works if the floor has no rotation, is center of the world, and
   * is a fixed rigid body.
   */
  const anchorFloorWorldPosition = new Vector3().addVectors(
    floorPosition,
    anchorFloorPosition
  );

  const initialHeight = platformMesh
    .localToWorld(anchorPlatformPosition.clone())
    .distanceTo(anchorFloorWorldPosition);

  const GUIDE_POST_RADIUS = 0.4;

  const mesh = new Mesh(
    new CylinderGeometry(GUIDE_POST_RADIUS, GUIDE_POST_RADIUS, initialHeight),
    material
  );
  /*
   * This only works if the floor has no rotation, is center of the world, and
   * is a fixed rigid body.
   */
  mesh.position.addVectors(
    { x: platformPosition.x, y: initialHeight / 2, z: platformPosition.z },
    anchorPlatformPosition
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  const dispose = () => {
    scene.remove(mesh);
    world.removeImpulseJoint(joint, true);
  };

  const update = () => {
    const height = platformMesh
      .localToWorld(anchorPlatformPosition.clone())
      .distanceTo(anchorFloorWorldPosition);

    mesh.position.y = initialHeight / 2 - (initialHeight - height);
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
  camera.position.set(5, 4, 5);

  const directionalLight = new DirectionalLight(new Color(3, 2, 2.5), 2.1);
  directionalLight.position.set(-15, 17, -2);
  directionalLight.shadow.camera.bottom = -7;
  directionalLight.shadow.camera.near = 14;
  directionalLight.shadow.camera.far = 35;
  directionalLight.shadow.camera.left = -14;
  directionalLight.shadow.camera.right = 14;
  directionalLight.shadow.camera.top = 14;
  directionalLight.shadow.mapSize.set(2048, 2048);
  directionalLight.shadow.normalBias = 0.01;
  directionalLight.shadow.bias = 0;
  directionalLight.castShadow = true;

  const directionalLightCameraHelper = new CameraHelper(
    directionalLight.shadow.camera
  );
  directionalLightCameraHelper.visible = false;
  const directionalLightHelper = new DirectionalLightHelper(directionalLight);
  directionalLightHelper.visible = false;

  const raycaster = new Raycaster();
  raycaster.far = 100;
  const raycasterHelper = new RaycasterHelper(raycaster);

  scene.add(
    camera,
    directionalLight,
    directionalLight.target,
    directionalLightCameraHelper,
    directionalLightHelper,
    raycasterHelper
  );

  return {
    camera,
    directionalLight,
    directionalLightCameraHelper,
    directionalLightHelper,
    raycaster,
    raycasterHelper,
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
    raycaster,
    raycasterHelper,
    scene,
  } = setupScene(textures);

  const physicsWorldHelper = createPhysicsWorldHelper(world);
  physicsWorldHelper.lines.visible = controls.physics.helper ?? false;
  scene.add(physicsWorldHelper.lines);

  textures.cobblestoneFloorColor.colorSpace = SRGBColorSpace;
  textures.marbleBallColor.colorSpace = SRGBColorSpace;
  textures.rustyCorrugatedIronColor.colorSpace = SRGBColorSpace;
  textures.rustyMetalColor.colorSpace = SRGBColorSpace;
  textures.woodCabinetWornLongColor.colorSpace = SRGBColorSpace;

  textures.cobblestoneFloorArm.wrapS = RepeatWrapping;
  textures.cobblestoneFloorColor.wrapS = RepeatWrapping;
  textures.cobblestoneFloorDisplacement.wrapS = RepeatWrapping;
  textures.cobblestoneFloorNormal.wrapS = RepeatWrapping;
  textures.rustyMetalArm.wrapS = RepeatWrapping;
  textures.rustyMetalColor.wrapS = RepeatWrapping;
  textures.rustyMetalNormal.wrapS = RepeatWrapping;

  textures.cobblestoneFloorArm.wrapT = RepeatWrapping;
  textures.cobblestoneFloorColor.wrapT = RepeatWrapping;
  textures.cobblestoneFloorDisplacement.wrapT = RepeatWrapping;
  textures.cobblestoneFloorNormal.wrapT = RepeatWrapping;
  textures.rustyMetalArm.wrapT = RepeatWrapping;
  textures.rustyMetalColor.wrapT = RepeatWrapping;
  textures.rustyMetalNormal.wrapT = RepeatWrapping;

  textures.cobblestoneFloorArm.repeat.set(4, 4);
  textures.cobblestoneFloorColor.repeat.set(4, 4);
  textures.cobblestoneFloorDisplacement.repeat.set(4, 4);
  textures.cobblestoneFloorNormal.repeat.set(4, 4);
  textures.rustyMetalArm.repeat.set(60, 3);
  textures.rustyMetalColor.repeat.set(60, 3);
  textures.rustyMetalNormal.repeat.set(60, 3);

  const ballMaterial = new MeshStandardMaterial({
    aoMap: textures.marbleBallAmbientOcclusion,
    envMap: textures.environmentMap,
    map: textures.marbleBallColor,
    metalness: 1,
    metalnessMap: textures.marbleBallMetalness,
    roughness: 0,
    roughnessMap: textures.marbleBallRoughness,
  });
  const floorMaterial = new MeshStandardMaterial({
    aoMap: textures.cobblestoneFloorArm,
    displacementBias: -0.1,
    displacementMap: textures.cobblestoneFloorDisplacement,
    displacementScale: 0.3,
    envMap: textures.environmentMap,
    map: textures.cobblestoneFloorColor,
    metalnessMap: textures.cobblestoneFloorArm,
    normalMap: textures.cobblestoneFloorNormal,
    roughnessMap: textures.cobblestoneFloorArm,
  });
  const guidePostMaterial = new MeshStandardMaterial({
    aoMap: textures.rustyCorrugatedIronArm,
    envMap: textures.environmentMap,
    map: textures.rustyCorrugatedIronColor,
    metalnessMap: textures.rustyCorrugatedIronArm,
    normalMap: textures.rustyCorrugatedIronNormal,
    roughnessMap: textures.rustyCorrugatedIronArm,
  });
  const platformMaterial = new MeshStandardMaterial({
    aoMap: textures.woodCabinetWornLongArm,
    envMap: textures.environmentMap,
    map: textures.woodCabinetWornLongColor,
    metalnessMap: textures.woodCabinetWornLongArm,
    normalMap: textures.woodCabinetWornLongNormal,
    roughnessMap: textures.woodCabinetWornLongArm,
  });
  const springMaterial = new MeshStandardMaterial({
    aoMap: textures.rustyMetalArm,
    envMap: textures.environmentMap,
    map: textures.rustyMetalColor,
    metalnessMap: textures.rustyMetalArm,
    normalMap: textures.rustyMetalNormal,
    roughnessMap: textures.rustyMetalArm,
    side: DoubleSide,
  });

  const deathZone = createDeathZone(Rapier, world);

  const floor = createFloor(Rapier, world, scene, {
    depth: 20,
    material: floorMaterial,
    width: 20,
  });

  const platform = createPlatform(Rapier, world, scene, {
    depth: 5,
    height: 0.4,
    mass: 2.5,
    material: platformMaterial,
    width: 5,
  });

  const ballSpawner = createBallSpawner(Rapier, world, scene, {
    mass: 5,
    material: ballMaterial,
    radius: 0.4,
  });

  const springAnchorsSpawner = createSpringAnchorsSpawner(
    Rapier,
    world,
    scene,
    {
      floorBody: floor.body,
      material: springMaterial,
      platformBody: platform.body,
      platformCollider: platform.collider,
      platformMesh: platform.mesh,
    }
  );
  springAnchorsSpawner.spawn();

  const guidePostAnchor = createGuidePostAnchor(Rapier, world, scene, {
    floorBody: floor.body,
    material: guidePostMaterial,
    platformBody: platform.body,
    platformMesh: platform.mesh,
  });

  let currentIntersection: Intersection | null = null;
  const pointerCoordinates = new PointerCoordinatesSubject();

  const handlePlatformClick = (
    intersection: Intersection<Mesh<BoxGeometry, Material>>
  ) => {
    const { point } = intersection;
    ballSpawner.spawn(point.clone().add({ x: 0, y: 2, z: 0 }));
  };

  const clickEventSub = fromEvent<PointerEvent>(
    window,
    'pointerdown'
  ).subscribe(() => {
    if (currentIntersection && currentIntersection.object === platform.mesh) {
      handlePlatformClick(
        currentIntersection as Intersection<Mesh<BoxGeometry, Material>>
      );
    }
  });

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
  orbitControls.maxPolarAngle = 1.4;

  const eventQueue = new Rapier.EventQueue(true);

  const ballsToRemove = new Set<Ball>();

  const handleCollisionEvent = (
    handle1: number,
    handle2: number,
    started: boolean
  ) => {
    try {
      if (!started) return;

      const tag1 = tags.get(handle1);
      const tag2 = tags.get(handle2);

      let ballHandle: number | undefined;

      if (tag1?.type === 'BALL') ballHandle = handle1;
      else if (tag2?.type === 'BALL') ballHandle = handle2;
      if (ballHandle === undefined) return;

      for (const ball of ballSpawner.balls) {
        if (ball.collider.handle === ballHandle) {
          ballsToRemove.add(ball);

          break;
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const cancelAnimation = animate(renderer, scene, camera, () => {
    orbitControls.update();

    raycaster.setFromCamera(pointerCoordinates.getValue(), camera);

    const intersections = raycaster.intersectObject(platform.mesh);

    if (intersections.length > 0) currentIntersection = intersections[0];
    else currentIntersection = null;

    raycasterHelper.hits = intersections;
    raycasterHelper.update();

    if (controls.physics.running) {
      world.step(eventQueue);
    }

    ballSpawner.update();
    guidePostAnchor.update();
    platform.update();
    springAnchorsSpawner.update();
    physicsWorldHelper.update();
    eventQueue.drainCollisionEvents(handleCollisionEvent);

    ballsToRemove.forEach((ball) => ballSpawner.dispose(ball));
    ballsToRemove.clear();
  });

  return () => {
    cancelAnimation();
    clickEventSub.unsubscribe();
    disposeControllers();
    eventQueue.free();

    ballSpawner.dispose();
    deathZone.dispose();
    floor.dispose();
    guidePostAnchor.dispose();
    platform.dispose();
    springAnchorsSpawner.dispose();
  };
}
