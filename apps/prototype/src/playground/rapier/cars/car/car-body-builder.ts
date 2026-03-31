import type * as RapierNS from '@dimforge/rapier3d';
import { type Group, Quaternion, Vector3 } from 'three';

import { packCollisionGroupMasks } from '../../../../utils';
import {
  type BodyCollidersEntity,
  BodyCollidersEntityBuilder,
} from '../body-colliders-entity-builder';
import {
  CAR_BODY_COLLISION_GROUP_MASK,
  WORLD_COLLISION_GROUP_MASK,
} from '../constants';
import type {
  CarAxleComponent,
  CarBodyComponent,
  CarLightsRootComponent,
  CarPipesComponent,
  CarSpoilersComponent,
  CarSteeringWheelComponent,
} from '../schemas';

type CarBodyBuilderOptions = {
  densities: {
    cab: number;
    hood: number;
    trunkBottom: number;
    trunkSide: number;
  };
};

type CarBodyComponents = {
  axle: CarAxleComponent;
  body: CarBodyComponent;
  lights: CarLightsRootComponent;
  pipes: CarPipesComponent;
  spoilers: CarSpoilersComponent;
  steeringWheel: CarSteeringWheelComponent;
  // TODO: remove this after debugging
  // windows: CarWindowsRootComponent;
};

export type CarBody = BodyCollidersEntity<CarBodyComponents>;

export class CarBodyBuilder extends BodyCollidersEntityBuilder<CarBodyComponents> {
  constructor(
    Rapier: typeof RapierNS,
    world: RapierNS.World,
    components: CarBodyComponents,
    private readonly group: Group,
    private readonly options: CarBodyBuilderOptions
  ) {
    super(Rapier, world, components);
  }

  protected override onCreateRigidBody(): RapierNS.RigidBody {
    const rotation = this.components.body.object.getWorldQuaternion(
      new Quaternion()
    );
    const position = this.components.body.object.getWorldPosition(
      new Vector3()
    );

    const body = this.world.createRigidBody(
      this.Rapier.RigidBodyDesc.dynamic()
        .setRotation(rotation)
        .setTranslation(position.x, position.y, position.z)
        .setUserData({ name: this.components.body.object.name })
    );

    return body;
  }

  protected override onCreateColliders(
    body: RapierNS.RigidBody
  ): RapierNS.Collider[] {
    const colliders = Object.entries(this.components.body.colliders).map(
      ([name, object]) => {
        const rotation = object.quaternion;
        const position = object.position.clone().multiply(this.group.scale);

        const halfExtents = object.getWorldScale(new Vector3());

        let density: number;

        switch (name as keyof CarBodyComponent['colliders']) {
          case 'cab': {
            density = this.options.densities.cab;
            break;
          }
          case 'hood': {
            density = this.options.densities.hood;
            break;
          }
          case 'trunkBottom': {
            density = this.options.densities.trunkBottom;
            break;
          }
          case 'trunkLeft':
          case 'trunkRear':
          case 'trunkRight': {
            density = this.options.densities.trunkSide;
            break;
          }
        }

        return this.world.createCollider(
          this.Rapier.ColliderDesc.cuboid(
            halfExtents.x,
            halfExtents.y,
            halfExtents.z
          )
            .setCollisionGroups(
              packCollisionGroupMasks(
                CAR_BODY_COLLISION_GROUP_MASK,
                WORLD_COLLISION_GROUP_MASK
              )
            )
            .setDensity(density)
            .setRotation(rotation)
            .setTranslation(position.x, position.y, position.z),
          body
        );
      }
    );

    return colliders;
  }

  private computeOffsetsFromObjectLocals(
    componentKey: keyof typeof this.components
  ) {
    const component = this.components[componentKey];
    const rotation = component.object.quaternion.clone();
    const position = new Vector3()
      .subVectors(
        this.components.body.object.position,
        component.object.position
      )
      .multiply(this.group.scale)
      .applyQuaternion(rotation.clone().invert());

    component.offsetPosition = position;
    component.offsetRotation = rotation;
  }

  protected override onComputeOffsets(): void {
    this.computeOffsetsFromObjectLocals('axle');
    this.computeOffsetsFromObjectLocals('lights');
    this.computeOffsetsFromObjectLocals('pipes');
    this.computeOffsetsFromObjectLocals('spoilers');
    this.computeOffsetsFromObjectLocals('steeringWheel');
    // TODO: remove this after debugging
    // this.computeOffsetsFromObjectLocals('windows');
  }
}
