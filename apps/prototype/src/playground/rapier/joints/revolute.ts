import type * as RapierNS from '@dimforge/rapier3d';
import type { GUI } from 'lil-gui';
import { forkJoin, lastValueFrom } from 'rxjs';
import {
  BoxGeometry,
  BufferGeometry,
  Camera,
  CameraHelper,
  Color,
  type DataTexture,
  DirectionalLight,
  DirectionalLightHelper,
  EquirectangularReflectionMapping,
  Group,
  type Material,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  type Object3D,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Quaternion,
  Scene,
  Timer,
  Vector3,
  type Vector3Like,
  WebGLRenderer,
} from 'three';
import { type GLTF, GLTFLoader, HDRLoader } from 'three/addons';
import { OrbitControls } from 'three-stdlib';

import { clamp, html } from '@xstate-workshop/utils';

import {
  type PhysicsWorldHelper,
  createCollisionGroupMask,
  createControlsPanel,
  createPhysicsWorldHelper,
  fromFullscreenKeyup,
  fromWindowResize,
  getModelUrl,
  getTextureUrl,
  packCollisionGroupMasks,
  setWorldFrom,
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

type Models = {
  ceilingFan: GLTF;
};

function loadModels(): Promise<Models> {
  const gltfLoader = new GLTFLoader();

  return lastValueFrom(
    forkJoin({
      ceilingFan: gltfLoader.loadAsync(getModelUrl('ceiling-fan', 'gltf')),
    })
  );
}

type Textures = {
  environmentMap: DataTexture;
};

function loadTextures(): Promise<Textures> {
  const hdrLoader = new HDRLoader();

  return lastValueFrom(
    forkJoin({
      environmentMap: hdrLoader.loadAsync(
        getTextureUrl('environment-map', ['1', '2k'])
      ),
    })
  );
}

type CeilingFanMesh = Mesh<BufferGeometry, MeshPhysicalMaterial>;

function isCeilingFanMesh(object: Object3D): object is CeilingFanMesh {
  return (
    object instanceof Mesh &&
    object.geometry instanceof BufferGeometry &&
    object.material instanceof MeshPhysicalMaterial &&
    object.name === 'ceiling-fan'
  );
}

type CeilingFanBladesMesh = Mesh<BufferGeometry, MeshPhysicalMaterial>;

function isCeilingFanBladesMesh(
  object: Object3D
): object is CeilingFanBladesMesh {
  return (
    object instanceof Mesh &&
    object.geometry instanceof BufferGeometry &&
    object.material instanceof MeshPhysicalMaterial &&
    object.name === 'ceiling-fan-blades'
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
  ceilingFan: {
    motorVelocity: number | undefined;
    motorDamping: number | undefined;
    angularDamping: number | undefined;
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
    helper: undefined,
    running: undefined,
  },
  ceilingFan: {
    motorVelocity: 10,
    motorDamping: 0.5,
    angularDamping: undefined,
  },
};

function setupPanelControllers(
  gui: GUI,
  directionalLight: DirectionalLight,
  directionalLightCameraHelper: CameraHelper,
  directionalLightHelper: DirectionalLightHelper,
  physicsWorldHelper: PhysicsWorldHelper,
  ceilingFanBladesBody: RapierNS.RigidBody,
  ceilingFanJoint: RapierNS.RevoluteImpulseJoint
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

  const folderCeilingFan = gui.addFolder('Ceiling Fan');

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
  controls.ceilingFan.angularDamping = Number.parseFloat(
    ceilingFanBladesBody.angularDamping().toFixed(2)
  );

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
    ceilingFan: {
      motorVelocity: folderCeilingFan
        .add(controls.ceilingFan, 'motorVelocity')
        .max(100)
        .min(0)
        .name('Motor Velocity')
        .step(0.5),
      motorDamping: folderCeilingFan
        .add(controls.ceilingFan, 'motorDamping')
        .max(10)
        .min(0.01)
        .name('Motor Damping')
        .step(0.01),
      angularDamping: folderCeilingFan
        .add(controls.ceilingFan, 'angularDamping')
        .max(1)
        .min(0)
        .name('Angular Damping')
        .step(0.01),
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

  const handleConfigureJointMotor = () => {
    ceilingFanJoint.configureMotorVelocity(
      controls.ceilingFan.motorVelocity ?? 0,
      controls.ceilingFan.motorDamping ?? 0
    );
  };

  controllers.ceilingFan.motorVelocity.onChange(handleConfigureJointMotor);
  controllers.ceilingFan.motorDamping.onChange(handleConfigureJointMotor);
  controllers.ceilingFan.angularDamping.onChange((value: number) => {
    ceilingFanBladesBody.setAngularDamping(value);
    handleConfigureJointMotor();
  });

  handleConfigureJointMotor();

  return () => {
    folderLights.destroy();
    folderPhysics.destroy();
    folderCeilingFan.destroy();
  };
}

enum PhysicsJointType {
  Revolute = 'revolute',
}

enum PhysicsRole {
  Collider = 'collider',
  Joint = 'joint',
}

enum PhysicsShape {
  Cuboid = 'cuboid',
  Cylinder = 'cylinder',
}

type CylinderColliderPhysicsData = {
  'physics.halfHeight': number;
  'physics.radius': number;
  'physics.role': PhysicsRole.Collider;
  'physics.shape': PhysicsShape.Cylinder;
  'physics.target': string;
};

function isCylinderColliderPhysicsData(
  userData: Record<string, unknown>
): userData is CylinderColliderPhysicsData {
  return !(
    typeof userData !== 'object' ||
    userData === null ||
    !('physics.halfHeight' in userData) ||
    !('physics.radius' in userData) ||
    !('physics.role' in userData) ||
    !('physics.shape' in userData) ||
    !('physics.target' in userData) ||
    typeof userData['physics.halfHeight'] !== 'number' ||
    typeof userData['physics.radius'] !== 'number' ||
    userData['physics.role'] !== PhysicsRole.Collider ||
    userData['physics.shape'] !== PhysicsShape.Cylinder ||
    typeof userData['physics.target'] !== 'string'
  );
}

type CuboidColliderPhysicsData = {
  'physics.halfExtents': [number, number, number];
  'physics.role': PhysicsRole.Collider;
  'physics.shape': PhysicsShape.Cuboid;
  'physics.target': string;
};

function isCuboidColliderPhysicsData(
  userData: Record<string, unknown>
): userData is CuboidColliderPhysicsData {
  return !(
    typeof userData !== 'object' ||
    userData === null ||
    !('physics.halfExtents' in userData) ||
    !('physics.role' in userData) ||
    !('physics.shape' in userData) ||
    !('physics.target' in userData) ||
    !Array.isArray(userData['physics.halfExtents']) ||
    userData['physics.halfExtents'].length !== 3 ||
    typeof userData['physics.halfExtents'][0] !== 'number' ||
    typeof userData['physics.halfExtents'][1] !== 'number' ||
    typeof userData['physics.halfExtents'][2] !== 'number' ||
    userData['physics.role'] !== PhysicsRole.Collider ||
    userData['physics.shape'] !== PhysicsShape.Cuboid ||
    typeof userData['physics.target'] !== 'string'
  );
}

type RevoluteJointPhysicsData = {
  'physics.bodyA': string;
  'physics.bodyB': string;
  'physics.jointType': PhysicsJointType.Revolute;
  'physics.role': PhysicsRole.Joint;
};

function isRevoluteJointPhysicsData(
  userData: Record<string, unknown>
): userData is RevoluteJointPhysicsData {
  return !(
    typeof userData !== 'object' ||
    userData === null ||
    !('physics.bodyA' in userData) ||
    !('physics.bodyB' in userData) ||
    !('physics.jointType' in userData) ||
    !('physics.role' in userData) ||
    typeof userData['physics.bodyA'] !== 'string' ||
    typeof userData['physics.bodyB'] !== 'string' ||
    userData['physics.jointType'] !== PhysicsJointType.Revolute ||
    userData['physics.role'] !== PhysicsRole.Joint
  );
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
  position?: Vector3Like;
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
  {
    depth,
    height,
    material,
    position = { x: 0, y: 0, z: 0 },
    width,
  }: CreateCeilingOptions
): Ceiling {
  const body = world.createRigidBody(
    Rapier.RigidBodyDesc.fixed().setTranslation(
      position.x,
      position.y,
      position.z
    )
  );
  const collider = world.createCollider(
    Rapier.ColliderDesc.cuboid(width * 0.5, height * 0.5, depth * 0.5)
      .setFriction(0.1)
      .setRestitution(0.8),
    body
  );

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

  return { body, collider, dispose, mesh };
}

const WORLD_COLLISION_GROUP_MASK = createCollisionGroupMask(0);
const CEILING_FAN_COLLISION_GROUP_MASK = createCollisionGroupMask(1);
const CEILING_FAN_BLADES_COLLISION_GROUP_MASK = createCollisionGroupMask(2);

type CreateCeilingFanBodyColliderOptions = {
  halfExtents: [number, number, number];
  mass: number;
  mesh: CeilingFanMesh;
  position: Vector3;
  worldPosition: Vector3;
  worldRotation: Quaternion;
};

type CeilingFanBodyCollider = {
  body: RapierNS.RigidBody;
  collider: RapierNS.Collider;
  dispose: () => void;
  update: () => void;
};

function createCeilingFanBodyCollider(
  Rapier: typeof RapierNS,
  world: RapierNS.World,
  group: Group,
  {
    halfExtents,
    mass,
    mesh,
    position,
    worldPosition,
    worldRotation,
  }: CreateCeilingFanBodyColliderOptions
): CeilingFanBodyCollider {
  const {
    x: hx,
    y: hy,
    z: hz,
  } = new Vector3(halfExtents[0], halfExtents[1], halfExtents[2]).multiply(
    group.scale
  );

  const body = world.createRigidBody(
    Rapier.RigidBodyDesc.dynamic()
      .setRotation(worldRotation)
      .setTranslation(worldPosition.x, worldPosition.y, worldPosition.z)
  );
  const collider = world.createCollider(
    Rapier.ColliderDesc.cuboid(hx, hy, hz)
      .setCollisionGroups(
        packCollisionGroupMasks(
          CEILING_FAN_COLLISION_GROUP_MASK,
          WORLD_COLLISION_GROUP_MASK
        )
      )
      .setMass(mass),
    body
  );

  const dispose = () => {
    world.removeRigidBody(body);
  };

  const offsetPosition = new Vector3()
    .subVectors(position, mesh.position)
    .multiply(group.scale);

  const update = () => {
    setWorldFrom(mesh, body.translation(), body.rotation(), { offsetPosition });
  };

  return { body, collider, dispose, update };
}

type CreateCeilingFanBladesBodyColliderOptions = {
  halfHeight: number;
  mass: number;
  mesh: CeilingFanBladesMesh;
  position: Vector3;
  radius: number;
  worldPosition: Vector3;
  worldRotation: Quaternion;
};

type CeilingFanBladesBodyCollider = {
  body: RapierNS.RigidBody;
  collider: RapierNS.Collider;
  dispose: () => void;
  update: () => void;
};

function createCeilingFanBladesBodyCollider(
  Rapier: typeof RapierNS,
  world: RapierNS.World,
  group: Group,
  {
    halfHeight,
    mass,
    mesh,
    position,
    radius,
    worldPosition,
    worldRotation,
  }: CreateCeilingFanBladesBodyColliderOptions
): CeilingFanBladesBodyCollider {
  const body = world.createRigidBody(
    Rapier.RigidBodyDesc.dynamic()
      .setAngularDamping(0.05)
      .setRotation(worldRotation)
      .setTranslation(worldPosition.x, worldPosition.y, worldPosition.z)
  );
  const collider = world.createCollider(
    Rapier.ColliderDesc.roundCylinder(
      halfHeight * group.scale.y,
      radius * group.scale.x,
      group.scale.y / 100
    )
      .setCollisionGroups(
        packCollisionGroupMasks(
          CEILING_FAN_BLADES_COLLISION_GROUP_MASK,
          WORLD_COLLISION_GROUP_MASK
        )
      )
      .setFriction(0)
      .setMass(mass)
      .setRestitution(1),
    body
  );

  const dispose = () => {
    world.removeRigidBody(body);
  };

  const offsetPosition = new Vector3()
    .subVectors(position, mesh.position)
    .multiply(group.scale);

  const update = () => {
    setWorldFrom(mesh, body.translation(), body.rotation(), { offsetPosition });
  };

  return { body, collider, dispose, update };
}

type CreateCeilingFanJointOptions = {
  ceilingFanBladesBody: RapierNS.RigidBody;
  ceilingFanBladesPosition: Vector3;
  ceilingFanBody: RapierNS.RigidBody;
  ceilingFanPosition: Vector3;
  position: Vector3;
};

type CeilingFanJoint = {
  joint: RapierNS.RevoluteImpulseJoint;
  dispose: () => void;
};

function createCeilingFanJoint(
  Rapier: typeof RapierNS,
  world: RapierNS.World,
  group: Group,
  {
    ceilingFanBladesBody,
    ceilingFanBladesPosition,
    ceilingFanBody,
    ceilingFanPosition,
    position,
  }: CreateCeilingFanJointOptions
): CeilingFanJoint {
  const anchorCeilingFan = new Vector3()
    .subVectors(position, ceilingFanPosition)
    .multiply(group.scale);
  const anchorCeilingFanBlades = new Vector3()
    .subVectors(position, ceilingFanBladesPosition)
    .multiply(group.scale);
  const axis = new Vector3(0, 1, 0);

  const joint = world.createImpulseJoint(
    Rapier.JointData.revolute(anchorCeilingFan, anchorCeilingFanBlades, axis),
    ceilingFanBody,
    ceilingFanBladesBody,
    true
  ) as RapierNS.RevoluteImpulseJoint;

  const dispose = () => {
    world.removeImpulseJoint(joint, false);
  };

  return { dispose, joint };
}

type CreateCeilingFanOptions = {
  ceilingFanBladesMass?: number;
  ceilingFanMass?: number;
  model: GLTF;
  position?: Vector3Like;
  rotation?: Vector3Like;
  scale?: number;
};

type CeilingFan = {
  ceilingFanBladesBody: RapierNS.RigidBody;
  ceilingFanBladesCollider: RapierNS.Collider;
  ceilingFanBody: RapierNS.RigidBody;
  ceilingFanCollider: RapierNS.Collider;
  dispose: () => void;
  group: Group;
  joint: RapierNS.RevoluteImpulseJoint;
  update: () => void;
};

function createCeilingFan(
  Rapier: typeof RapierNS,
  world: RapierNS.World,
  scene: Scene,
  {
    ceilingFanBladesMass = 1,
    ceilingFanMass = 10,
    model,
    position = { x: 0, y: 0, z: 0 },
    rotation = { x: 0, y: 0, z: 0 },
    scale = 1,
  }: CreateCeilingFanOptions
): CeilingFan {
  const ceilingFan = model.scene.getObjectByName('ceiling-fan');
  const ceilingFanBlades = model.scene.getObjectByName('ceiling-fan-blades');
  const ceilingFanColliderObject = model.scene.getObjectByName(
    'collider-ceiling-fan'
  );
  const ceilingFanBladesColliderObject = model.scene.getObjectByName(
    'collider-ceiling-fan-blades'
  );
  const ceilingFanBladesJointObject = model.scene.getObjectByName(
    'joint-ceiling-fan-blades'
  );

  if (ceilingFan === undefined || !isCeilingFanMesh(ceilingFan)) {
    throw new Error('Failure to detect ceiling fan body mesh');
  }
  if (
    ceilingFanBlades === undefined ||
    !isCeilingFanBladesMesh(ceilingFanBlades)
  ) {
    throw new Error('Failure to detect ceiling fan blades mesh');
  }
  if (
    ceilingFanColliderObject === undefined ||
    !isCuboidColliderPhysicsData(ceilingFanColliderObject.userData)
  ) {
    throw new Error('Failure to detect ceiling fan body collider physics data');
  }
  if (
    ceilingFanBladesColliderObject === undefined ||
    !isCylinderColliderPhysicsData(ceilingFanBladesColliderObject.userData)
  ) {
    throw new Error(
      'Failure to detect ceiling fan blades collider physics data'
    );
  }
  if (
    ceilingFanBladesJointObject === undefined ||
    !isRevoluteJointPhysicsData(ceilingFanBladesJointObject.userData)
  ) {
    throw new Error('Failure to detect ceiling fan blades joint physics data');
  }

  ceilingFan.castShadow = true;
  ceilingFan.receiveShadow = true;
  ceilingFanBlades.castShadow = true;
  ceilingFanBlades.receiveShadow = true;

  const group = new Group();
  group.add(model.scene);
  group.scale.multiplyScalar(scale);
  group.position.set(position.x, position.y, position.z);
  group.rotation.set(rotation.x, rotation.y, rotation.z);

  scene.add(group);

  const {
    body: ceilingFanBody,
    collider: ceilingFanCollider,
    dispose: disposeCeilingFan,
    update: updateCeilingFan,
  } = createCeilingFanBodyCollider(Rapier, world, group, {
    halfExtents: ceilingFanColliderObject.userData['physics.halfExtents'],
    mass: ceilingFanMass,
    mesh: ceilingFan,
    position: ceilingFanColliderObject.position,
    worldPosition: ceilingFanColliderObject.getWorldPosition(new Vector3()),
    worldRotation: ceilingFanColliderObject.getWorldQuaternion(
      new Quaternion()
    ),
  });

  const {
    body: ceilingFanBladesBody,
    collider: ceilingFanBladesCollider,
    dispose: disposeCeilingFanBlades,
    update: updateCeilingFanBlades,
  } = createCeilingFanBladesBodyCollider(Rapier, world, group, {
    halfHeight: ceilingFanBladesColliderObject.userData['physics.halfHeight'],
    mass: ceilingFanBladesMass,
    mesh: ceilingFanBlades,
    position: ceilingFanBladesColliderObject.position,
    radius: ceilingFanBladesColliderObject.userData['physics.radius'],
    worldPosition: ceilingFanBladesColliderObject.getWorldPosition(
      new Vector3()
    ),
    worldRotation: ceilingFanBladesColliderObject.getWorldQuaternion(
      new Quaternion()
    ),
  });

  const { dispose: disposeJoint, joint } = createCeilingFanJoint(
    Rapier,
    world,
    group,
    {
      ceilingFanBladesBody,
      ceilingFanBladesPosition: ceilingFanBladesColliderObject.position,
      ceilingFanBody,
      ceilingFanPosition: ceilingFanColliderObject.position,
      position: ceilingFanBladesJointObject.position,
    }
  );

  const dispose = () => {
    scene.remove(group);
    disposeJoint();
    disposeCeilingFanBlades();
    disposeCeilingFan();
  };

  const update = () => {
    updateCeilingFanBlades();
    updateCeilingFan();
  };

  return {
    ceilingFanBladesBody,
    ceilingFanBladesCollider,
    ceilingFanBody,
    ceilingFanCollider,
    dispose,
    group,
    joint,
    update,
  };
}

type CreateFixedAnchorOptions = {
  anchorOffset?: Vector3Like;
  ceilingBody: RapierNS.RigidBody;
  ceilingFanBody: RapierNS.RigidBody;
};

type FixedAnchor = {
  dispose: () => void;
  joint: RapierNS.ImpulseJoint;
};

function createFixedAnchor(
  Rapier: typeof RapierNS,
  world: RapierNS.World,
  {
    anchorOffset = { x: 0, y: 0, z: 0 },
    ceilingBody,
    ceilingFanBody,
  }: CreateFixedAnchorOptions
): FixedAnchor {
  const ceilingPosition = new Vector3().copy(ceilingBody.translation());
  const ceilingFanPosition = new Vector3().copy(ceilingFanBody.translation());

  const jointPosition = new Vector3().addVectors(ceilingPosition, anchorOffset);
  const anchorCeilingPosition = new Vector3().subVectors(
    jointPosition,
    ceilingPosition
  );
  const anchorCeilingFanPosition = new Vector3().subVectors(
    jointPosition,
    ceilingFanPosition
  );

  const frameCeilingRotation = new Quaternion(0, 0, 0, 1);
  const frameCeilingFanRotation = new Quaternion(0, 0, 0, 1);

  const joint = world.createImpulseJoint(
    Rapier.JointData.fixed(
      anchorCeilingPosition,
      frameCeilingRotation,
      anchorCeilingFanPosition,
      frameCeilingFanRotation
    ),
    ceilingBody,
    ceilingFanBody,
    true
  ) as RapierNS.RevoluteImpulseJoint;

  const dispose = () => {
    world.removeImpulseJoint(joint, true);
  };

  return { dispose, joint };
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
  directionalLight.position.set(-20, -7, -7);

  directionalLight.shadow.camera.bottom = -15;
  directionalLight.shadow.camera.near = 5;
  directionalLight.shadow.camera.far = 40;
  directionalLight.shadow.camera.left = -15;
  directionalLight.shadow.camera.right = 15;
  directionalLight.shadow.camera.top = 15;
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

const CEILING_DEPTH = 20;
const CEILING_HEIGHT = 0.1;
const CEILING_WIDTH = 20;

export async function run() {
  const gui = createControlsPanel();
  const canvas = setupCanvas();
  const renderer = setupRenderer(canvas);

  const models = await loadModels();

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

  const ceilingMaterial = new MeshStandardMaterial({
    color: 0x77_77_77,
    envMap: textures.environmentMap,
    metalness: 0.8,
    roughness: 1,
  });

  const ceiling = createCeiling(Rapier, world, scene, {
    depth: CEILING_DEPTH,
    height: CEILING_HEIGHT,
    material: ceilingMaterial,
    position: { x: 0, y: 2.5, z: 0 },
    width: CEILING_WIDTH,
  });

  const ceilingFan = createCeilingFan(Rapier, world, scene, {
    ceilingFanBladesMass: 1,
    ceilingFanMass: 1,
    model: models.ceilingFan,
    position: new Vector3().subVectors(ceiling.body.translation(), {
      x: 0,
      y: CEILING_HEIGHT / 2,
      z: 0,
    }),
    scale: 5,
  });

  const fixedAnchor = createFixedAnchor(Rapier, world, {
    ceilingBody: ceiling.body,
    ceilingFanBody: ceilingFan.ceilingFanBody,
  });

  const disposeControllers = setupPanelControllers(
    gui,
    directionalLight,
    directionalLightCameraHelper,
    directionalLightHelper,
    physicsWorldHelper,
    ceilingFan.ceilingFanBladesBody,
    ceilingFan.joint
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

    if (controls.physics.running) {
      world.step(eventQueue);
    }

    ceilingFan.update();
    physicsWorldHelper.update();
  });

  return () => {
    cancelAnimation();
    disposeControllers();
    eventQueue.free();

    ceiling.dispose();
    ceilingFan.dispose();
    fixedAnchor.dispose();
  };
}
