import type * as RapierNS from '@dimforge/rapier3d';
import { type Group, Quaternion, Vector3 } from 'three';

import { packCollisionGroupMasks } from '../../../../../utils';
import {
  type BodyCollidersEntity,
  BodyCollidersEntityBuilder,
} from '../../body-colliders-entity-builder';
import {
  CAR_WHEEL_COLLISION_GROUP_MASK,
  WORLD_COLLISION_GROUP_MASK,
} from '../../constants';
import type { CarWheelComponent } from '../../schemas';

type CarWheelBuilderOptions = {
  angularDamping?: number;
  density: number;
  friction: number;
  linearDamping?: number;
  restitution: number;
};

type CarWheelComponents = {
  wheel: CarWheelComponent;
};

export type CarWheel = BodyCollidersEntity<CarWheelComponents>;

export class CarWheelBuilder extends BodyCollidersEntityBuilder<CarWheelComponents> {
  constructor(
    Rapier: typeof RapierNS,
    world: RapierNS.World,
    components: { wheel: CarWheelComponent },
    private readonly group: Group,
    private readonly options: CarWheelBuilderOptions
  ) {
    super(Rapier, world, components);
  }

  protected override onCreateRigidBody(): RapierNS.RigidBody {
    const angularDamping = this.options.angularDamping ?? 0;
    const linearDamping = this.options.linearDamping ?? 0;

    const rotation = this.components.wheel.collider.getWorldQuaternion(
      new Quaternion()
    );
    const position = this.components.wheel.collider.getWorldPosition(
      new Vector3()
    );

    const body = this.world.createRigidBody(
      this.Rapier.RigidBodyDesc.dynamic()
        .setAngularDamping(angularDamping)
        .setLinearDamping(linearDamping)
        .setRotation(rotation)
        .setTranslation(position.x, position.y, position.z)
        .setUserData({ name: this.components.wheel.object.name })
    );

    return body;
  }

  protected override onCreateColliders(
    body: RapierNS.RigidBody
  ): RapierNS.Collider[] {
    const halfHeight =
      this.components.wheel.collider.scale.y * this.group.scale.y;
    const radius = this.components.wheel.collider.scale.x * this.group.scale.x;

    const collider = this.world.createCollider(
      this.Rapier.ColliderDesc.roundCylinder(halfHeight, radius, radius * 0.1)
        .setCollisionGroups(
          packCollisionGroupMasks(
            CAR_WHEEL_COLLISION_GROUP_MASK,
            WORLD_COLLISION_GROUP_MASK
          )
        )
        .setDensity(this.options.density)
        .setFriction(this.options.friction)
        .setRestitution(this.options.restitution),
      body
    );

    return [collider];
  }

  protected override onComputeOffsets(body: RapierNS.RigidBody): void {
    this.components.wheel.offsetRotation = new Quaternion()
      .copy(body.rotation())
      .invert()
      .multiply(
        this.components.wheel.object.getWorldQuaternion(new Quaternion())
      )
      .normalize();
  }
}
