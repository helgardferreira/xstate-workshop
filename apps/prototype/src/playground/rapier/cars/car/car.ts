import type * as RapierNS from '@dimforge/rapier3d';
import {
  Observable,
  Subscription,
  distinctUntilChanged,
  filter,
  from,
  map,
  shareReplay,
} from 'rxjs';
import {
  Group,
  Quaternion,
  type Scene,
  Vector3,
  type Vector3Like,
} from 'three';
import type { GLTF } from 'three/addons';
import { createActor } from 'xstate';

import {
  filterMesh,
  fromObject3dTraverse,
  packCollisionGroupMasks,
} from '../../../../utils';
import {
  CAR_WINDOW_COLLISION_GROUP_MASK,
  CarSide,
  WORLD_COLLISION_GROUP_MASK,
} from '../constants';
import { type CarComponents, carComponentsSchema } from '../schemas';

import {
  type CarActorRef,
  type CarActorSnapshot,
  carMachine,
} from './actors/car';
import { type CarBody, CarBodyBuilder } from './car-body-builder';
import { CarWheelAssembly } from './car-wheel-assembly/car-wheel-assembly';

type CarOptions = {
  body?: {
    densities?: {
      cab?: number;
      hood?: number;
      trunkBottom?: number;
      trunkSide?: number;
    };
  };
  position?: Vector3Like;
  rotation?: Vector3Like;
  scale?: number;
  wheels?: {
    angularDamping?: number;
    densities?: {
      hub?: number;
      steeringKnuckle?: number;
      wheel?: number;
    };
    friction?: number;
    linearDamping?: number;
    restitution?: number;
  };
};

type CarWheels = {
  frontLeft: CarWheelAssembly;
  frontRight: CarWheelAssembly;
  rearLeft: CarWheelAssembly;
  rearRight: CarWheelAssembly;
};

type CarBodyToWheelJoints = {
  frontLeft: RapierNS.FixedImpulseJoint;
  frontRight: RapierNS.FixedImpulseJoint;
  rearLeft: RapierNS.FixedImpulseJoint;
  rearRight: RapierNS.FixedImpulseJoint;
};

// TODO: improve WASM memory referencing / allocation / de-allocation handling
// TODO: maybe add sound effects
// TODO: maybe experiment with particles and shaders for smoke effects
// TODO: maybe add four wheel drive with diff-lock mechanism
// TODO: create environment with matching physics world
//       - different floor colliders with different friction / restitution values
//       - obstacles / ramps / other dynamic rigid bodies
//       - add dynamic rigid body payload to back of car to test trunk collider setup
// TODO: improve car rigid body / collider / joint setup
//       - add prismatic joint and try to simulate suspension vs no suspension
// TODO: integrate with custom camera controls
export class Car {
  public readonly body: CarBody;
  public readonly group: Group;
  public readonly wheels: CarWheels;
  public readonly bodyToWheelJoints: CarBodyToWheelJoints;

  private readonly carActor: CarActorRef;
  private readonly carActorSnapshot$: Observable<CarActorSnapshot>;
  private readonly components: CarComponents;
  private readonly subscriptions: Subscription[] = [];

  constructor(
    private readonly Rapier: typeof RapierNS,
    private readonly world: RapierNS.World,
    private readonly scene: Scene,
    private readonly model: GLTF,
    private readonly options: CarOptions = {}
  ) {
    const {
      body: bodyOptions = {},
      position = { x: 0, y: 0, z: 0 },
      rotation = { x: 0, y: 0, z: 0 },
      scale = 1,
      wheels: wheelOptions = {},
    } = this.options;
    const {
      cab: cabDensity = 70,
      hood: hoodDensity = 100,
      trunkBottom: trunkBottomDensity = 50,
      trunkSide: trunkSideDensity = 30,
    } = bodyOptions.densities ?? {};
    const {
      angularDamping: wheelAngularDamping = 0,
      friction: wheelFriction = 0.8,
      linearDamping: wheelLinearDamping = 0,
      restitution: wheelRestitution = 0.1,
    } = wheelOptions;
    const {
      hub: hubDensity = 10,
      steeringKnuckle: steeringKnuckleDensity = 1.25,
      wheel: wheelDensity = 31.25,
    } = wheelOptions.densities ?? {};

    this.group = new Group();
    this.group.add(model.scene);
    this.group.scale.multiplyScalar(scale);
    this.group.position.set(position.x, position.y, position.z);
    this.group.rotation.set(rotation.x, rotation.y, rotation.z);
    scene.add(this.group);

    this.components = this.parseComponents(this.model);

    this.body = new CarBodyBuilder(
      this.Rapier,
      this.world,
      {
        axle: this.components.axle,
        body: this.components.body,
        lights: this.components.lights,
        pipes: this.components.pipes,
        spoilers: this.components.spoilers,
        steeringWheel: this.components.steeringWheel,
        // TODO: remove this after debugging
        // windows: this.components.windows,
      },
      this.group,
      {
        densities: {
          cab: cabDensity,
          hood: hoodDensity,
          trunkBottom: trunkBottomDensity,
          trunkSide: trunkSideDensity,
        },
      }
    )
      .createRigidBody()
      .createColliders()
      .computeOffsets()
      .build();

    // TODO: extract this to separate class (extend `BodyCollidersEntityBuilder`)
    ////// ---------------------------------------------------------------------
    const bodyRotation =
      this.components.windows.left.collider.getWorldQuaternion(
        new Quaternion()
      );
    const bodyPosition = this.components.windows.left.collider.getWorldPosition(
      new Vector3()
    );

    const leftWindowBody = this.world.createRigidBody(
      // TODO: restore this after debugging
      // this.Rapier.RigidBodyDesc.dynamic()
      this.Rapier.RigidBodyDesc.fixed()
        .setRotation(bodyRotation)
        .setTranslation(bodyPosition.x, bodyPosition.y, bodyPosition.z)
        .setUserData({ name: this.components.windows.left.object.name })
    );

    // TODO: continue here...
    const halfExtents = this.components.windows.left.collider.getWorldScale(
      new Vector3()
    );

    const leftWindowCollider = this.world.createCollider(
      this.Rapier.ColliderDesc.cuboid(
        halfExtents.x,
        halfExtents.y,
        halfExtents.z
      )
        .setCollisionGroups(
          packCollisionGroupMasks(
            CAR_WINDOW_COLLISION_GROUP_MASK,
            WORLD_COLLISION_GROUP_MASK
          )
        )
        // TODO: implement collision groups
        // TODO: replace explicit mass configuration for density
        .setMass(5),
      leftWindowBody
    );

    // TODO: continue here after implementing `ControlsPanel`...
    // console.log(leftWindowBody.rotation(), leftWindowBody.translation());

    const anchor1 = new Vector3(0, 0, 0);
    const anchor2 = new Vector3(0, 0, 0);
    const axis = new Vector3(0, 0, 1);

    const params = this.Rapier.JointData.prismatic(anchor1, anchor2, axis);
    params.limitsEnabled = true;
    params.limits = [-2.0, 5.0];

    const joint = this.world.createImpulseJoint(
      params,
      this.body.body,
      leftWindowBody,
      true
    );

    setTimeout(() => {
      // console.log(leftWindowBody.rotation(), leftWindowBody.translation());
    }, 500);
    ////// ---------------------------------------------------------------------

    this.wheels = {
      frontLeft: new CarWheelAssembly(
        this.Rapier,
        this.world,
        { wheel: this.components.wheels.frontLeft },
        this.group,
        {
          angularDamping: wheelAngularDamping,
          densities: {
            hub: hubDensity,
            steeringKnuckle: steeringKnuckleDensity,
            wheel: wheelDensity,
          },
          friction: wheelFriction,
          linearDamping: wheelLinearDamping,
          restitution: wheelRestitution,
          steering: CarSide.Left,
        }
      ),
      frontRight: new CarWheelAssembly(
        this.Rapier,
        this.world,
        { wheel: this.components.wheels.frontRight },
        this.group,
        {
          angularDamping: wheelAngularDamping,
          densities: {
            hub: hubDensity,
            steeringKnuckle: steeringKnuckleDensity,
            wheel: wheelDensity,
          },
          friction: wheelFriction,
          linearDamping: wheelLinearDamping,
          restitution: wheelRestitution,
          steering: CarSide.Right,
        }
      ),
      rearLeft: new CarWheelAssembly(
        this.Rapier,
        this.world,
        { wheel: this.components.wheels.rearLeft },
        this.group,
        {
          angularDamping: wheelAngularDamping,
          densities: {
            hub: hubDensity,
            steeringKnuckle: steeringKnuckleDensity,
            wheel: wheelDensity,
          },
          friction: wheelFriction,
          linearDamping: wheelLinearDamping,
          restitution: wheelRestitution,
        }
      ),
      rearRight: new CarWheelAssembly(
        this.Rapier,
        this.world,
        { wheel: this.components.wheels.rearRight },
        this.group,
        {
          angularDamping: wheelAngularDamping,
          densities: {
            hub: hubDensity,
            steeringKnuckle: steeringKnuckleDensity,
            wheel: wheelDensity,
          },
          friction: wheelFriction,
          linearDamping: wheelLinearDamping,
          restitution: wheelRestitution,
        }
      ),
    };

    this.bodyToWheelJoints = {
      frontLeft: this.createBodyToWheelJoint(this.wheels.frontLeft),
      frontRight: this.createBodyToWheelJoint(this.wheels.frontRight),
      rearLeft: this.createBodyToWheelJoint(this.wheels.rearLeft),
      rearRight: this.createBodyToWheelJoint(this.wheels.rearRight),
    };

    this.carActor = createActor(carMachine, { input: {} }).start();
    this.carActorSnapshot$ = from(this.carActor).pipe(shareReplay(1));

    this.subscriptions.push(
      this.handleWheelSpinning(),
      this.handleWheelSteering(),
      this.enableShadows()
    );
  }

  private parseComponents(model: GLTF): CarComponents {
    return carComponentsSchema.parse({
      axle: { object: model.scene.getObjectByName('axle') },
      body: {
        object: model.scene.getObjectByName('body'),
        colliders: {
          cab: model.scene.getObjectByName('collider-body-cab'),
          hood: model.scene.getObjectByName('collider-body-hood'),
          trunkBottom: model.scene.getObjectByName(
            'collider-body-trunk-bottom'
          ),
          trunkLeft: model.scene.getObjectByName('collider-body-trunk-left'),
          trunkRear: model.scene.getObjectByName('collider-body-trunk-rear'),
          trunkRight: model.scene.getObjectByName('collider-body-trunk-right'),
        },
      },
      pipes: { object: model.scene.getObjectByName('pipes') },
      spoilers: { object: model.scene.getObjectByName('spoilers') },
      steeringWheel: {
        object: model.scene.getObjectByName('steering-wheel'),
      },

      lights: {
        object: model.scene.getObjectByName('lights'),
        brakeLights: {
          object: model.scene.getObjectByName('brake-lights'),
        },
        fogLights: { object: model.scene.getObjectByName('fog-lights') },
        headlights: { object: model.scene.getObjectByName('headlights') },
        pipeLights: { object: model.scene.getObjectByName('pipe-lights') },
        reverseLights: {
          object: model.scene.getObjectByName('reverse-lights'),
        },
        turbineLights: {
          object: model.scene.getObjectByName('turbine-lights'),
        },
      },
      wheels: {
        object: model.scene.getObjectByName('wheels'),
        frontLeft: {
          object: model.scene.getObjectByName('wheel-front-left'),
          collider: model.scene.getObjectByName('collider-wheel-front-left'),
        },
        frontRight: {
          object: model.scene.getObjectByName('wheel-front-right'),
          collider: model.scene.getObjectByName('collider-wheel-front-right'),
        },
        rearLeft: {
          object: model.scene.getObjectByName('wheel-rear-left'),
          collider: model.scene.getObjectByName('collider-wheel-rear-left'),
        },
        rearRight: {
          object: model.scene.getObjectByName('wheel-rear-right'),
          collider: model.scene.getObjectByName('collider-wheel-rear-right'),
        },
      },
      windows: {
        object: model.scene.getObjectByName('windows'),
        front: { object: model.scene.getObjectByName('window-front') },
        left: {
          object: model.scene.getObjectByName('window-left'),
          collider: model.scene.getObjectByName('collider-window-left'),
        },
        right: {
          object: model.scene.getObjectByName('window-right'),
          collider: model.scene.getObjectByName('collider-window-right'),
        },
      },
    });
  }

  private createBodyToWheelJoint(
    wheel: CarWheelAssembly
  ): RapierNS.FixedImpulseJoint {
    const parent1 = this.body.body;
    const parent2 = wheel.steeringKnuckle?.body ?? wheel.hub.body;

    const anchor1 = new Vector3()
      .subVectors(parent2.translation(), parent1.translation())
      .applyQuaternion(this.group.quaternion.clone().invert());
    const anchor2 = new Vector3(0, 0, 0);

    const frame1 = new Quaternion();
    const frame2 = new Quaternion()
      .copy(parent2.rotation())
      .invert()
      .multiply(new Quaternion().copy(parent1.rotation()));

    const joint = this.world.createImpulseJoint(
      this.Rapier.JointData.fixed(anchor1, frame1, anchor2, frame2),
      parent1,
      parent2,
      true
    ) as RapierNS.FixedImpulseJoint;
    joint.setContactsEnabled(false);

    return joint;
  }

  private handleWheelSpinning(): Subscription {
    return this.carActorSnapshot$
      .pipe(
        map(({ context }) => ({
          factor: context.spinning.factor,
          velocity: context.spinning.velocity,
        })),
        distinctUntilChanged(
          (prev, curr) =>
            prev.factor === curr.factor && prev.velocity === curr.velocity
        )
      )
      .subscribe(({ factor, velocity }) => {
        this.wheels.frontLeft.hubToWheelJoint.configureMotorVelocity(
          velocity,
          factor
        );
        this.wheels.frontRight.hubToWheelJoint.configureMotorVelocity(
          velocity,
          factor
        );
      });
  }

  private handleWheelSteering(): Subscription {
    return this.carActorSnapshot$
      .pipe(
        map(({ context }) => ({
          angle: context.steering.angle,
          damping: context.steering.damping,
          stiffness: context.steering.stiffness,
        })),
        distinctUntilChanged(
          (prev, curr) =>
            prev.angle === curr.angle &&
            prev.damping === curr.damping &&
            prev.stiffness === curr.stiffness
        )
      )
      .subscribe(({ angle, damping, stiffness }) => {
        const targetPos = angle * (Math.PI / 180);

        this.wheels.frontLeft.steeringKnuckleToHubJoint?.configureMotorPosition(
          targetPos,
          stiffness,
          damping
        );
        this.wheels.frontRight.steeringKnuckleToHubJoint?.configureMotorPosition(
          targetPos,
          stiffness,
          damping
        );
      });
  }

  /**
   * Setup shadows for meshes within model.
   */
  private enableShadows(): Subscription {
    return fromObject3dTraverse(this.model.scene)
      .pipe(
        filterMesh(),
        filter(
          (mesh) => !this.components.windows.object.getObjectByName(mesh.name)
        )
      )
      .subscribe((mesh) => {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      });
  }

  public dispose(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.carActor.stop();
    this.scene.remove(this.group);

    this.world.removeImpulseJoint(this.bodyToWheelJoints.frontLeft, true);
    this.world.removeImpulseJoint(this.bodyToWheelJoints.frontRight, true);
    this.world.removeImpulseJoint(this.bodyToWheelJoints.rearLeft, true);
    this.world.removeImpulseJoint(this.bodyToWheelJoints.rearRight, true);

    this.body.dispose();
    this.wheels.frontLeft.dispose();
    this.wheels.frontRight.dispose();
    this.wheels.rearLeft.dispose();
    this.wheels.rearRight.dispose();
  }

  public update(): void {
    this.body.update();
    this.wheels.frontLeft.update();
    this.wheels.frontRight.update();
    this.wheels.rearLeft.update();
    this.wheels.rearRight.update();
  }
}
