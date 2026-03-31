import type * as RapierNS from '@dimforge/rapier3d';
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
  Group,
  type Material,
  Mesh,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Scene,
  Timer,
  type Vector3Like,
  WebGLRenderer,
} from 'three';
import { HDRLoader } from 'three/addons';
import { OrbitControls } from 'three-stdlib';

import { clamp, html } from '@xstate-workshop/utils';

import { loadModels } from '../load-models';
import {
  createPhysicsWorldHelper,
  fromFullscreenKeyup,
  fromWindowResize,
  getTextureUrl,
} from '../utils';

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

async function setupPhysics() {
  const Rapier = await import('@dimforge/rapier3d');

  const world = new Rapier.World({ x: 0, y: -9.82, z: 0 });

  return { Rapier, world };
}

type CreateFloorOptions = {
  depth: number;
  height: number;
  material: Material;
  position?: Vector3Like;
  width: number;
};

type Floor = {
  body: RapierNS.RigidBody;
  collider: RapierNS.Collider;
  dispose: () => void;
  mesh: Mesh<BoxGeometry, Material>;
};

function createFloor(
  Rapier: typeof RapierNS,
  world: RapierNS.World,
  scene: Scene,
  {
    depth,
    height,
    material,
    position = { x: 0, y: 0, z: 0 },
    width,
  }: CreateFloorOptions
): Floor {
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
  // TODO: remove this after debugging
  // camera.position.set(7, 0, 7);
  camera.position.set(5, 5, 5);

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

export async function run() {
  // TODO: implement debug controls
  // const gui = createControlsPanel();
  const canvas = setupCanvas();
  const renderer = setupRenderer(canvas);

  const models = await loadModels();

  const textures = await loadTextures();
  textures.environmentMap.mapping = EquirectangularReflectionMapping;

  const { Rapier, world } = await setupPhysics();

  const { camera, scene } = setupScene(textures);

  const physicsWorldHelper = createPhysicsWorldHelper(world);
  physicsWorldHelper.lines.visible = false;
  scene.add(physicsWorldHelper.lines);

  const coverStripeBarGroup = new Group();
  coverStripeBarGroup.add(models.coverStripeBar.scene);

  const robotArmBGroup = new Group();
  coverStripeBarGroup.add(models.robotArmB.scene);

  scene.add(coverStripeBarGroup, robotArmBGroup);

  // TODO: restore this after debugging
  /*
  const floorMaterial = new MeshStandardMaterial({
    color: 0x77_77_77,
    envMap: textures.environmentMap,
    metalness: 0.8,
    roughness: 1,
  });

  const floor = createFloor(Rapier, world, scene, {
    depth: 20,
    height: 0.1,
    material: floorMaterial,
    position: { x: 0, y: 2.5, z: 0 },
    width: 20,
  });
  */

  // TODO: remove this after debugging
  /*
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

  ceilingFan.joint.configureMotorVelocity(10, 0.5);
  */

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

  // TODO: implement custom camera controls
  const orbitControls = new OrbitControls(camera, canvas);
  // TODO: remove this after debugging
  /*
  orbitControls.enablePan = false;
  orbitControls.enableZoom = false;
  orbitControls.minPolarAngle = 1.4;
  */

  const eventQueue = new Rapier.EventQueue(true);

  const cancelAnimation = animate(renderer, scene, camera, () => {
    orbitControls.update();

    world.step(eventQueue);

    // TODO: update entities later
    // ceilingFan.update();
    physicsWorldHelper.update();
  });

  return () => {
    cancelAnimation();
    eventQueue.free();

    // TODO: dispose of entities later
    // ceiling.dispose();
    // ceilingFan.dispose();
    // fixedAnchor.dispose();
  };
}

// TODO: remove this after debugging
/*
const WORLD_COLLISION_GROUP_MASK = createCollisionGroupMask(0);
const CEILING_FAN_COLLISION_GROUP_MASK = createCollisionGroupMask(1);
const CEILING_FAN_BLADES_COLLISION_GROUP_MASK = createCollisionGroupMask(2);

type CreateCeilingFanBodyColliderOptions = {
  halfExtents: [number, number, number];
  mass: number;
  mesh: Object3D;
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
  mesh: Object3D;
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

  if (ceilingFan === undefined) {
    throw new Error('Failure to detect ceiling fan body mesh');
  }
  if (ceilingFanBlades === undefined) {
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
*/
