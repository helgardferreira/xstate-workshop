import type * as RapierNS from '@dimforge/rapier3d';
import {
  Euler,
  type Material,
  Mesh,
  PlaneGeometry,
  Quaternion,
  type Scene,
  Vector3,
  type Vector3Like,
} from 'three';

import { FLOOR_COLLIDER_HEIGHT, FloorType } from './constants';

type CreateFloorOptions = {
  depth: number;
  friction?: number;
  material: Material;
  position?: Vector3Like;
  restitution?: number;
  rotation?: Vector3Like;
  type?: FloorType;
  width: number;
};

export type Floor = {
  body: RapierNS.RigidBody;
  collider: RapierNS.Collider;
  dispose: () => void;
  mesh: Mesh<PlaneGeometry, Material>;
};

export function createFloor(
  Rapier: typeof RapierNS,
  world: RapierNS.World,
  scene: Scene,
  options: CreateFloorOptions
): Floor {
  const {
    position = {
      x: 0,
      y: 0,
      z: 0,
    },
    rotation = {
      x: 0,
      y: 0,
      z: 0,
    },
  } = options;

  const bodyRotation = new Quaternion().setFromEuler(
    new Euler(rotation.x, rotation.y, rotation.z)
  );
  const offsetPosition = new Vector3()
    .copy({ x: 0, y: FLOOR_COLLIDER_HEIGHT * 0.5, z: 0 })
    .applyQuaternion(bodyRotation);
  const offsetRotation = new Quaternion().setFromEuler(
    new Euler(Math.PI * -0.5, 0, 0)
  );
  const bodyPosition = new Vector3().copy(position).sub(offsetPosition);

  const body = world.createRigidBody(
    Rapier.RigidBodyDesc.fixed()
      .setRotation(bodyRotation)
      .setTranslation(bodyPosition.x, bodyPosition.y, bodyPosition.z)
      .setUserData({ name: 'floor' })
  );

  let friction: number;
  let restitution: number;

  switch (options.type ?? FloorType.AsphaltDry) {
    case FloorType.AsphaltDry: {
      friction = options.friction ?? 0.9;
      restitution = options.restitution ?? 0.05;
      break;
    }
    case FloorType.AsphaltWet: {
      friction = options.friction ?? 0.5;
      restitution = options.restitution ?? 0.05;
      break;
    }
    case FloorType.Concrete: {
      friction = options.friction ?? 0.85;
      restitution = options.restitution ?? 0.08;
      break;
    }
    case FloorType.Dirt: {
      friction = options.friction ?? 0.6;
      restitution = options.restitution ?? 0.1;
      break;
    }
    case FloorType.Grass: {
      friction = options.friction ?? 0.4;
      restitution = options.restitution ?? 0.1;
      break;
    }
    case FloorType.Ice: {
      friction = options.friction ?? 0.1;
      restitution = options.restitution ?? 0.02;
      break;
    }
    case FloorType.Sand: {
      friction = options.friction ?? 0.45;
      restitution = options.restitution ?? 0.02;
      break;
    }
    case FloorType.Snow: {
      friction = options.friction ?? 0.3;
      restitution = options.restitution ?? 0.08;
      break;
    }
  }

  const collider = world.createCollider(
    Rapier.ColliderDesc.cuboid(
      options.width * 0.5,
      FLOOR_COLLIDER_HEIGHT * 0.5,
      options.depth * 0.5
    )
      .setFriction(friction)
      .setRestitution(restitution),
    body
  );

  const mesh = new Mesh(
    new PlaneGeometry(options.width, options.depth, 128, 128),
    options.material
  );
  mesh.quaternion.copy(bodyRotation).multiply(offsetRotation);
  mesh.position.copy(bodyPosition).add(offsetPosition);

  mesh.receiveShadow = true;
  scene.add(mesh);

  const dispose = () => {
    scene.remove(mesh);
    world.removeRigidBody(body);
  };

  return { body, collider, dispose, mesh };
}
