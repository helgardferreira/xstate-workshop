import type * as RapierNS from '@dimforge/rapier3d';
import { Euler, type Group, Quaternion, Vector3 } from 'three';

import {
  calculateCylinderInertia,
  calculateCylinderMass,
} from '../../../../../utils';
import { type BodyEntity, BodyEntityBuilder } from '../../body-entity-builder';
import { CarSide } from '../../constants';
import type { CarWheelComponent } from '../../schemas';

type CarSteeringKnuckleBuilderOptions = {
  density: number;
  side: CarSide;
};

type CarSteeringKnuckleComponents = {
  wheel: CarWheelComponent;
};

export type CarSteeringKnuckle = BodyEntity;

export class CarSteeringKnuckleBuilder extends BodyEntityBuilder<CarSteeringKnuckleComponents> {
  constructor(
    Rapier: typeof RapierNS,
    world: RapierNS.World,
    components: CarSteeringKnuckleComponents,
    private readonly group: Group,
    private readonly options: CarSteeringKnuckleBuilderOptions
  ) {
    super(Rapier, world, components);
  }

  protected override onCreateRigidBody(): RapierNS.RigidBody {
    const wheelHalfHeight =
      this.components.wheel.collider.scale.y * this.group.scale.y;
    const wheelRadius =
      this.components.wheel.collider.scale.x * this.group.scale.x;

    const bodyRotation = this.components.wheel.collider.getWorldQuaternion(
      new Quaternion()
    );
    const offset =
      wheelHalfHeight * 0.25 * (this.options.side === CarSide.Left ? 1 : -1);
    const offsetPosition = new Vector3()
      .copy({ x: 0, y: offset, z: 0 })
      .applyQuaternion(bodyRotation);
    const bodyPosition = this.components.wheel.collider
      .getWorldPosition(new Vector3())
      .sub(offsetPosition);

    const angularInertiaLocalFrame = new Quaternion().setFromEuler(
      new Euler(0, 0, Math.PI * 0.5)
    );
    const centerOfMass = new Vector3(0, 0, 0);
    const height = wheelHalfHeight * 2;
    const radius = wheelRadius * 5;
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
        .setRotation(bodyRotation)
        .setTranslation(bodyPosition.x, bodyPosition.y, bodyPosition.z)
        .setUserData({
          name: `${this.components.wheel.object.name}-steering-knuckle`,
        })
    );
    body.recomputeMassPropertiesFromColliders();

    return body;
  }
}
