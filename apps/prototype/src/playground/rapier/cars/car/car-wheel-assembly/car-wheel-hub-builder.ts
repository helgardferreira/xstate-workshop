import type * as RapierNS from '@dimforge/rapier3d';
import { Euler, type Group, Quaternion, Vector3 } from 'three';

import {
  calculateCylinderInertia,
  calculateCylinderMass,
} from '../../../../../utils';
import { type BodyEntity, BodyEntityBuilder } from '../../body-entity-builder';
import type { CarWheelComponent } from '../../schemas';

type CarWheelHubComponents = {
  wheel: CarWheelComponent;
};

type CarWheelHubBuilderOptions = {
  density: number;
};

export type CarWheelHub = BodyEntity;

export class CarWheelHubBuilder extends BodyEntityBuilder<CarWheelHubComponents> {
  constructor(
    Rapier: typeof RapierNS,
    world: RapierNS.World,
    components: CarWheelHubComponents,
    private readonly group: Group,
    private readonly options: CarWheelHubBuilderOptions
  ) {
    super(Rapier, world, components);
  }

  protected override onCreateRigidBody(): RapierNS.RigidBody {
    const wheelHalfHeight =
      this.components.wheel.collider.scale.y * this.group.scale.y;
    const wheelRadius =
      this.components.wheel.collider.scale.x * this.group.scale.x;

    const rotation = this.components.wheel.collider.getWorldQuaternion(
      new Quaternion()
    );
    const position = this.components.wheel.collider.getWorldPosition(
      new Vector3()
    );

    const angularInertiaLocalFrame = new Quaternion().setFromEuler(
      new Euler(0, 0, Math.PI * 0.5)
    );
    const centerOfMass = new Vector3(0, 0, 0);
    const height = wheelHalfHeight * 1;
    const radius = wheelRadius * 2.5;
    const mass = calculateCylinderMass(this.options.density, height, radius);
    const { axial, transverse } = calculateCylinderInertia(
      mass,
      height,
      radius
    );
    const principalAngularInertia = new Vector3(transverse, axial, transverse);

    const body = this.world.createRigidBody(
      this.Rapier.RigidBodyDesc.dynamic()
        .setAdditionalMassProperties(
          mass,
          centerOfMass,
          principalAngularInertia,
          angularInertiaLocalFrame
        )
        .setRotation(rotation)
        .setTranslation(position.x, position.y, position.z)
        .setUserData({ name: `${this.components.wheel.object.name}-wheel-hub` })
    );
    body.recomputeMassPropertiesFromColliders();

    return body;
  }
}
