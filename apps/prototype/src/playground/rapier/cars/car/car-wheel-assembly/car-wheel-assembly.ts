import type * as RapierNS from '@dimforge/rapier3d';
import { type Group, Vector3 } from 'three';

import { CarSide } from '../../constants';
import type { CarWheelComponent } from '../../schemas';

import {
  type CarSteeringKnuckle,
  CarSteeringKnuckleBuilder,
} from './car-steering-knuckle-builder';
import { type CarWheel, CarWheelBuilder } from './car-wheel-builder';
import { type CarWheelHub, CarWheelHubBuilder } from './car-wheel-hub-builder';

type CarWheelAssemblyOptions = {
  angularDamping?: number;
  densities: {
    hub: number;
    steeringKnuckle: number;
    wheel: number;
  };
  friction: number;
  linearDamping?: number;
  maxSteeringAngle?: number;
  restitution: number;
  steering?: CarSide;
};

type CarWheelAssemblyComponents = {
  wheel: CarWheelComponent;
};

export class CarWheelAssembly {
  public readonly hub: CarWheelHub;
  public readonly hubToWheelJoint: RapierNS.RevoluteImpulseJoint;
  public readonly steeringKnuckle?: CarSteeringKnuckle;
  public readonly steeringKnuckleToHubJoint?: RapierNS.RevoluteImpulseJoint;
  public readonly wheel: CarWheel;

  constructor(
    private readonly Rapier: typeof RapierNS,
    private readonly world: RapierNS.World,
    private readonly components: CarWheelAssemblyComponents,
    private readonly group: Group,
    private readonly options: CarWheelAssemblyOptions
  ) {
    this.wheel = new CarWheelBuilder(
      Rapier,
      world,
      { wheel: components.wheel },
      group,
      {
        angularDamping: options.angularDamping,
        density: options.densities.wheel,
        friction: options.friction,
        linearDamping: options.linearDamping,
        restitution: options.restitution,
      }
    )
      .createRigidBody()
      .createColliders()
      .computeOffsets()
      .build();

    this.hub = new CarWheelHubBuilder(
      Rapier,
      world,
      { wheel: components.wheel },
      group,
      { density: options.densities.hub }
    )
      .createRigidBody()
      .build();

    this.hubToWheelJoint = this.createRevoluteJoint('hub');

    if (options.steering !== undefined) {
      this.steeringKnuckle = new CarSteeringKnuckleBuilder(
        Rapier,
        world,
        { wheel: components.wheel },
        group,
        { density: options.densities.steeringKnuckle, side: options.steering }
      )
        .createRigidBody()
        .build();

      this.steeringKnuckleToHubJoint =
        this.createRevoluteJoint('steering-knuckle');
    }
  }

  private createRevoluteJoint(
    type: 'hub' | 'steering-knuckle'
  ): RapierNS.RevoluteImpulseJoint {
    let parent1: RapierNS.RigidBody;
    let parent2: RapierNS.RigidBody;

    let anchor1: Vector3;
    let anchor2: Vector3;
    let axis: Vector3;

    switch (type) {
      case 'hub': {
        parent1 = this.hub.body;
        parent2 = this.wheel.body;

        anchor1 = new Vector3(0, 0, 0);
        anchor2 = new Vector3(0, 0, 0);
        axis = new Vector3(0, 1, 0);

        break;
      }
      case 'steering-knuckle': {
        parent1 = this.steeringKnuckle!.body;
        parent2 = this.hub.body;

        const offset =
          this.components.wheel.collider.scale.y *
          this.group.scale.y *
          0.25 *
          (this.options.steering === CarSide.Left ? 1 : -1);

        anchor1 = new Vector3(0, 0, 0);
        anchor2 = new Vector3(0, -offset, 0);
        axis = new Vector3(1, 0, 0);

        break;
      }
    }

    const joint = this.world.createImpulseJoint(
      this.Rapier.JointData.revolute(anchor1, anchor2, axis),
      parent1,
      parent2,
      true
    ) as RapierNS.RevoluteImpulseJoint;
    joint.setContactsEnabled(false);

    if (type === 'steering-knuckle') {
      const maxSteeringAngle =
        (this.options.maxSteeringAngle ?? 35) * (Math.PI / 180);
      joint.setLimits(-maxSteeringAngle, maxSteeringAngle);
    }

    return joint;
  }

  public dispose(): void {
    this.world.removeImpulseJoint(this.hubToWheelJoint, true);
    if (this.steeringKnuckleToHubJoint) {
      this.world.removeImpulseJoint(this.steeringKnuckleToHubJoint, true);
    }

    this.wheel.dispose();
    this.hub.dispose();
    this.steeringKnuckle?.dispose();
  }

  public update(): void {
    this.wheel.update();
  }
}
