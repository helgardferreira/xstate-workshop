import {
  ConeGeometry,
  CylinderGeometry,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
  SphereGeometry,
  Vector3,
  type Vector3Like,
} from 'three';

import { clamp, lerp, normalize } from '@xstate-workshop/utils';

import { RingBuffer } from '../ring-buffer';

type Hit = {
  impulse: Vector3;
  point: Vector3;
};

type ImpulseHelperOptions = {
  maxHitLength?: number;
  maxHits?: number;
  maxImpulseMagnitude?: number;
  minHitLength?: number;
  minImpulseMagnitude?: number;
};

const CONTACT_POINTS_RADIUS = 0.08;
const IMPULSE_HEADS_HEIGHT = 0.2;
const IMPULSE_HEADS_RADIUS = 0.08;
const IMPULSE_SHAFTS_BASE_HEIGHT = 0.2;
const IMPULSE_SHAFTS_RADIUS = 0.02;

const contactPointObject = new Object3D();
const impulseHeadObject = new Object3D();
const impulseShaftObject = new Object3D();

const impulseDirection = new Vector3();

export class ImpulseHelper extends Object3D {
  public readonly maxHitLength: number;
  public readonly maxHits: number;
  public readonly maxImpulseMagnitude: number;
  public readonly minHitLength: number;
  public readonly minImpulseMagnitude: number;

  private hitsBuffer: RingBuffer<Hit>;

  private contactPoints: InstancedMesh<SphereGeometry, MeshBasicMaterial>;
  private impulseHeads: InstancedMesh<ConeGeometry, MeshBasicMaterial>;
  private impulseShafts: InstancedMesh<CylinderGeometry, MeshBasicMaterial>;

  constructor(options: ImpulseHelperOptions = {}) {
    super();

    const {
      maxHitLength = 5,
      maxHits = 20,
      maxImpulseMagnitude = 10,
      minHitLength = 1,
      minImpulseMagnitude = 1,
    } = options;

    this.maxHitLength = maxHitLength;
    this.maxHits = maxHits;
    this.maxImpulseMagnitude = maxImpulseMagnitude;
    this.minHitLength = minHitLength;
    this.minImpulseMagnitude = minImpulseMagnitude;

    this.hitsBuffer = new RingBuffer(maxHits);

    this.contactPoints = new InstancedMesh(
      new SphereGeometry(CONTACT_POINTS_RADIUS),
      new MeshBasicMaterial(),
      this.maxHits
    );
    this.contactPoints.name = 'ImpulseHelper_contactPoints';
    this.contactPoints.raycast = () => null;

    this.impulseHeads = new InstancedMesh(
      new ConeGeometry(IMPULSE_HEADS_RADIUS, IMPULSE_HEADS_HEIGHT),
      new MeshBasicMaterial(),
      this.maxHits
    );
    this.impulseHeads.name = 'ImpulseHelper_impulseHeads';
    this.impulseHeads.raycast = () => null;

    this.impulseShafts = new InstancedMesh(
      new CylinderGeometry(
        IMPULSE_SHAFTS_RADIUS,
        IMPULSE_SHAFTS_RADIUS,
        IMPULSE_SHAFTS_BASE_HEIGHT
      ),
      new MeshBasicMaterial({ color: 0xff_00_00 }),
      this.maxHits
    );
    this.impulseShafts.name = 'ImpulseHelper_impulseShafts';
    this.impulseShafts.raycast = () => null;

    this.add(this.contactPoints, this.impulseHeads, this.impulseShafts);
  }

  addImpulsePoint = (impulse: Vector3Like, point: Vector3Like) => {
    this.hitsBuffer.push({
      impulse: new Vector3().copy(impulse),
      point: new Vector3().copy(point),
    });
  };

  update = () => {
    for (let i = 0; i < this.maxHits; i++) {
      const hit = this.hitsBuffer.at(i);

      if (hit) {
        const { impulse, point } = hit;

        contactPointObject.position.copy(point);
        contactPointObject.scale.setScalar(1);

        impulseDirection.copy(impulse);
        const scale = lerp(
          normalize(
            clamp(
              impulseDirection.length(),
              this.minImpulseMagnitude,
              this.maxImpulseMagnitude
            ),
            this.minImpulseMagnitude,
            this.maxImpulseMagnitude
          ),
          this.minHitLength,
          this.maxHitLength
        );
        const computedShaftHeight = IMPULSE_SHAFTS_BASE_HEIGHT * scale;
        impulseDirection.normalize();

        impulseHeadObject.quaternion.setFromUnitVectors(
          Object3D.DEFAULT_UP,
          impulseDirection
        );
        impulseHeadObject.position
          .copy(point)
          .addScaledVector(
            impulseDirection,
            computedShaftHeight + IMPULSE_HEADS_HEIGHT * 0.5
          );
        impulseHeadObject.scale.setScalar(1);

        impulseShaftObject.quaternion.setFromUnitVectors(
          Object3D.DEFAULT_UP,
          impulseDirection
        );
        impulseShaftObject.position
          .copy(point)
          .addScaledVector(impulseDirection, computedShaftHeight * 0.5);

        impulseShaftObject.scale.set(1, scale, 1);
      } else {
        contactPointObject.scale.setScalar(0);
        impulseHeadObject.scale.setScalar(0);
        impulseShaftObject.scale.setScalar(0);
      }

      contactPointObject.updateMatrix();
      impulseHeadObject.updateMatrix();
      impulseShaftObject.updateMatrix();

      this.contactPoints.setMatrixAt(i, contactPointObject.matrix);
      this.impulseHeads.setMatrixAt(i, impulseHeadObject.matrix);
      this.impulseShafts.setMatrixAt(i, impulseShaftObject.matrix);
    }

    this.contactPoints.instanceMatrix.needsUpdate = true;
    this.impulseHeads.instanceMatrix.needsUpdate = true;
    this.impulseShafts.instanceMatrix.needsUpdate = true;
  };

  dispose = () => {
    this.contactPoints.dispose();
    this.contactPoints.geometry.dispose();
    this.contactPoints.material.dispose();
    this.impulseHeads.dispose();
    this.impulseHeads.geometry.dispose();
    this.impulseHeads.material.dispose();
    this.impulseShafts.dispose();
    this.impulseShafts.geometry.dispose();
    this.impulseShafts.material.dispose();

    this.hitsBuffer.clear();
  };
}
