/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BufferGeometry,
  Camera,
  type Intersection,
  Material,
  Mesh,
  Object3D,
  Quaternion,
  Raycaster,
  Vector2,
  Vector3,
} from 'three';

import { TransformControlsGizmo } from './transform-controls-gizmo';
import { TransformControlsPlane } from './transform-controls-plane';

export type TransformControlsPointerObject = {
  x: number;
  y: number;
  button: number;
};

// TODO: refactor this or reimplement this
export class TransformControls<
  TCamera extends Camera = Camera,
> extends Object3D {
  public readonly isTransformControls = true;

  public override visible = false;

  protected domElement: HTMLElement | undefined;

  protected raycaster = new Raycaster();

  protected gizmo: TransformControlsGizmo;
  protected plane: TransformControlsPlane;

  protected tempVector = new Vector3();
  protected tempVector2 = new Vector3();
  protected tempQuaternion = new Quaternion();
  protected unit = {
    X: new Vector3(1, 0, 0),
    Y: new Vector3(0, 1, 0),
    Z: new Vector3(0, 0, 1),
  };

  protected pointStart = new Vector3();
  protected pointEnd = new Vector3();
  protected offset = new Vector3();
  protected rotationAxis = new Vector3();
  protected startNorm = new Vector3();
  protected endNorm = new Vector3();
  protected rotationAngle = 0;

  protected cameraPosition = new Vector3();
  protected cameraQuaternion = new Quaternion();
  protected cameraScale = new Vector3();

  protected parentPosition = new Vector3();
  protected parentQuaternion = new Quaternion();
  protected parentQuaternionInv = new Quaternion();
  protected parentScale = new Vector3();

  protected worldPositionStart = new Vector3();
  protected worldQuaternionStart = new Quaternion();
  protected worldScaleStart = new Vector3();

  protected worldPosition = new Vector3();
  protected worldQuaternion = new Quaternion();
  protected worldQuaternionInv = new Quaternion();
  protected worldScale = new Vector3();

  protected eye = new Vector3();

  protected positionStart = new Vector3();
  protected quaternionStart = new Quaternion();
  protected scaleStart = new Vector3();

  protected camera: TCamera;
  protected object: Object3D | undefined;
  protected enabled = true;
  protected axis: string | null = null;
  protected mode: 'translate' | 'rotate' | 'scale' = 'translate';
  protected translationSnap: number | null = null;
  protected rotationSnap: number | null = null;
  protected scaleSnap: number | null = null;
  protected space = 'world';
  protected size = 1;
  protected dragging = false;
  protected showX = true;
  protected showY = true;
  protected showZ = true;

  // events
  protected changeEvent = { type: 'change' };
  protected mouseDownEvent = { type: 'mouseDown', mode: this.mode };
  protected mouseUpEvent = { type: 'mouseUp', mode: this.mode };
  protected objectChangeEvent = { type: 'objectChange' };

  constructor(camera: TCamera, domElement: HTMLElement | undefined) {
    super();

    this.camera = camera;
    this.domElement = domElement;

    this.gizmo = new TransformControlsGizmo();
    this.add(this.gizmo);

    this.plane = new TransformControlsPlane();
    this.add(this.plane);

    // Defined getter, setter and store for a property
    const defineProperty = <TValue>(
      propName: string,
      defaultValue: TValue
    ): void => {
      let propValue = defaultValue;

      Object.defineProperty(this, propName, {
        get: function () {
          return propValue !== undefined ? propValue : defaultValue;
        },

        set: function (value) {
          if (propValue !== value) {
            propValue = value;
            this.plane[propName] = value;
            this.gizmo[propName] = value;

            this.dispatchEvent({ type: propName + '-changed', value: value });
            this.dispatchEvent(this.changeEvent);
          }
        },
      });

      //@ts-expect-error ignore
      this[propName] = defaultValue;
      // @ts-expect-error ignore
      this.plane[propName] = defaultValue;
      // @ts-expect-error ignore
      this.gizmo[propName] = defaultValue;
    };

    defineProperty('camera', this.camera);
    defineProperty('object', this.object);
    defineProperty('enabled', this.enabled);
    defineProperty('axis', this.axis);
    defineProperty('mode', this.mode);
    defineProperty('translationSnap', this.translationSnap);
    defineProperty('rotationSnap', this.rotationSnap);
    defineProperty('scaleSnap', this.scaleSnap);
    defineProperty('space', this.space);
    defineProperty('size', this.size);
    defineProperty('dragging', this.dragging);
    defineProperty('showX', this.showX);
    defineProperty('showY', this.showY);
    defineProperty('showZ', this.showZ);
    defineProperty('worldPosition', this.worldPosition);
    defineProperty('worldPositionStart', this.worldPositionStart);
    defineProperty('worldQuaternion', this.worldQuaternion);
    defineProperty('worldQuaternionStart', this.worldQuaternionStart);
    defineProperty('cameraPosition', this.cameraPosition);
    defineProperty('cameraQuaternion', this.cameraQuaternion);
    defineProperty('pointStart', this.pointStart);
    defineProperty('pointEnd', this.pointEnd);
    defineProperty('rotationAxis', this.rotationAxis);
    defineProperty('rotationAngle', this.rotationAngle);
    defineProperty('eye', this.eye);

    // connect events
    if (domElement !== undefined) this.connect(domElement);
  }

  protected intersectObjectWithRay = (
    object: Object3D,
    raycaster: Raycaster,
    includeInvisible?: boolean
  ): false | Intersection => {
    const allIntersections = raycaster.intersectObject(object, true);

    for (let i = 0; i < allIntersections.length; i++) {
      if (allIntersections[i].object.visible || includeInvisible) {
        return allIntersections[i];
      }
    }

    return false;
  };

  // Set current object
  public override attach = (object: Object3D): this => {
    this.object = object;
    this.visible = true;

    return this;
  };

  // Detach from object
  public detach = (): this => {
    this.object = undefined;
    this.visible = false;
    this.axis = null;

    return this;
  };

  // Reset
  public reset = (): this => {
    if (!this.enabled) return this;

    if (this.dragging) {
      if (this.object !== undefined) {
        this.object.position.copy(this.positionStart);
        this.object.quaternion.copy(this.quaternionStart);
        this.object.scale.copy(this.scaleStart);
        // @ts-expect-error ignore
        this.dispatchEvent(this.changeEvent);
        // @ts-expect-error ignore
        this.dispatchEvent(this.objectChangeEvent);
        this.pointStart.copy(this.pointEnd);
      }
    }

    return this;
  };

  public override updateMatrixWorld = (): void => {
    if (this.object !== undefined) {
      this.object.updateMatrixWorld();

      if (this.object.parent === null) {
        console.error(
          'TransformControls: The attached 3D object must be a part of the scene graph.'
        );
      } else {
        this.object.parent.matrixWorld.decompose(
          this.parentPosition,
          this.parentQuaternion,
          this.parentScale
        );
      }

      this.object.matrixWorld.decompose(
        this.worldPosition,
        this.worldQuaternion,
        this.worldScale
      );

      this.parentQuaternionInv.copy(this.parentQuaternion).invert();
      this.worldQuaternionInv.copy(this.worldQuaternion).invert();
    }

    this.camera.updateMatrixWorld();
    this.camera.matrixWorld.decompose(
      this.cameraPosition,
      this.cameraQuaternion,
      this.cameraScale
    );

    this.eye.copy(this.cameraPosition).sub(this.worldPosition).normalize();

    super.updateMatrixWorld();
  };

  protected pointerHover = (pointer: TransformControlsPointerObject): void => {
    if (this.object === undefined || this.dragging === true) return;

    this.raycaster.setFromCamera(pointer as unknown as Vector2, this.camera);

    const intersect = this.intersectObjectWithRay(
      this.gizmo.picker[this.mode],
      this.raycaster
    );

    if (intersect) {
      this.axis = intersect.object.name;
    } else {
      this.axis = null;
    }
  };

  protected pointerDown = (pointer: TransformControlsPointerObject): void => {
    if (
      this.object === undefined ||
      this.dragging === true ||
      pointer.button !== 0
    )
      return;

    if (this.axis !== null) {
      this.raycaster.setFromCamera(pointer as unknown as Vector2, this.camera);

      const planeIntersect = this.intersectObjectWithRay(
        this.plane,
        this.raycaster,
        true
      );

      if (planeIntersect) {
        let space = this.space;

        if (this.mode === 'scale') {
          space = 'local';
        } else if (
          this.axis === 'E' ||
          this.axis === 'XYZE' ||
          this.axis === 'XYZ'
        ) {
          space = 'world';
        }

        if (space === 'local' && this.mode === 'rotate') {
          const snap = this.rotationSnap;

          if (this.axis === 'X' && snap)
            this.object.rotation.x =
              Math.round(this.object.rotation.x / snap) * snap;
          if (this.axis === 'Y' && snap)
            this.object.rotation.y =
              Math.round(this.object.rotation.y / snap) * snap;
          if (this.axis === 'Z' && snap)
            this.object.rotation.z =
              Math.round(this.object.rotation.z / snap) * snap;
        }

        this.object.updateMatrixWorld();

        if (this.object.parent) {
          this.object.parent.updateMatrixWorld();
        }

        this.positionStart.copy(this.object.position);
        this.quaternionStart.copy(this.object.quaternion);
        this.scaleStart.copy(this.object.scale);

        this.object.matrixWorld.decompose(
          this.worldPositionStart,
          this.worldQuaternionStart,
          this.worldScaleStart
        );

        this.pointStart.copy(planeIntersect.point).sub(this.worldPositionStart);
      }

      this.dragging = true;
      this.mouseDownEvent.mode = this.mode;
      // @ts-expect-error ignore
      this.dispatchEvent(this.mouseDownEvent);
    }
  };

  protected pointerMove = (pointer: TransformControlsPointerObject): void => {
    const axis = this.axis;
    const mode = this.mode;
    const object = this.object;
    let space = this.space;

    if (mode === 'scale') {
      space = 'local';
    } else if (axis === 'E' || axis === 'XYZE' || axis === 'XYZ') {
      space = 'world';
    }

    if (
      object === undefined ||
      axis === null ||
      this.dragging === false ||
      pointer.button !== -1
    )
      return;

    this.raycaster.setFromCamera(pointer as unknown as Vector2, this.camera);

    const planeIntersect = this.intersectObjectWithRay(
      this.plane,
      this.raycaster,
      true
    );

    if (!planeIntersect) return;

    this.pointEnd.copy(planeIntersect.point).sub(this.worldPositionStart);

    if (mode === 'translate') {
      // Apply translate

      this.offset.copy(this.pointEnd).sub(this.pointStart);

      if (space === 'local' && axis !== 'XYZ') {
        this.offset.applyQuaternion(this.worldQuaternionInv);
      }

      if (axis.indexOf('X') === -1) this.offset.x = 0;
      if (axis.indexOf('Y') === -1) this.offset.y = 0;
      if (axis.indexOf('Z') === -1) this.offset.z = 0;

      if (space === 'local' && axis !== 'XYZ') {
        this.offset
          .applyQuaternion(this.quaternionStart)
          .divide(this.parentScale);
      } else {
        this.offset
          .applyQuaternion(this.parentQuaternionInv)
          .divide(this.parentScale);
      }

      object.position.copy(this.offset).add(this.positionStart);

      // Apply translation snap

      if (this.translationSnap) {
        if (space === 'local') {
          object.position.applyQuaternion(
            this.tempQuaternion.copy(this.quaternionStart).invert()
          );

          if (axis.search('X') !== -1) {
            object.position.x =
              Math.round(object.position.x / this.translationSnap) *
              this.translationSnap;
          }

          if (axis.search('Y') !== -1) {
            object.position.y =
              Math.round(object.position.y / this.translationSnap) *
              this.translationSnap;
          }

          if (axis.search('Z') !== -1) {
            object.position.z =
              Math.round(object.position.z / this.translationSnap) *
              this.translationSnap;
          }

          object.position.applyQuaternion(this.quaternionStart);
        }

        if (space === 'world') {
          if (object.parent) {
            object.position.add(
              this.tempVector.setFromMatrixPosition(object.parent.matrixWorld)
            );
          }

          if (axis.search('X') !== -1) {
            object.position.x =
              Math.round(object.position.x / this.translationSnap) *
              this.translationSnap;
          }

          if (axis.search('Y') !== -1) {
            object.position.y =
              Math.round(object.position.y / this.translationSnap) *
              this.translationSnap;
          }

          if (axis.search('Z') !== -1) {
            object.position.z =
              Math.round(object.position.z / this.translationSnap) *
              this.translationSnap;
          }

          if (object.parent) {
            object.position.sub(
              this.tempVector.setFromMatrixPosition(object.parent.matrixWorld)
            );
          }
        }
      }
    } else if (mode === 'scale') {
      if (axis.search('XYZ') !== -1) {
        let d = this.pointEnd.length() / this.pointStart.length();

        if (this.pointEnd.dot(this.pointStart) < 0) d *= -1;

        this.tempVector2.set(d, d, d);
      } else {
        this.tempVector.copy(this.pointStart);
        this.tempVector2.copy(this.pointEnd);

        this.tempVector.applyQuaternion(this.worldQuaternionInv);
        this.tempVector2.applyQuaternion(this.worldQuaternionInv);

        this.tempVector2.divide(this.tempVector);

        if (axis.search('X') === -1) {
          this.tempVector2.x = 1;
        }

        if (axis.search('Y') === -1) {
          this.tempVector2.y = 1;
        }

        if (axis.search('Z') === -1) {
          this.tempVector2.z = 1;
        }
      }

      // Apply scale

      object.scale.copy(this.scaleStart).multiply(this.tempVector2);

      if (this.scaleSnap && this.object) {
        if (axis.search('X') !== -1) {
          this.object.scale.x =
            Math.round(object.scale.x / this.scaleSnap) * this.scaleSnap ||
            this.scaleSnap;
        }

        if (axis.search('Y') !== -1) {
          object.scale.y =
            Math.round(object.scale.y / this.scaleSnap) * this.scaleSnap ||
            this.scaleSnap;
        }

        if (axis.search('Z') !== -1) {
          object.scale.z =
            Math.round(object.scale.z / this.scaleSnap) * this.scaleSnap ||
            this.scaleSnap;
        }
      }
    } else if (mode === 'rotate') {
      this.offset.copy(this.pointEnd).sub(this.pointStart);

      const ROTATION_SPEED =
        20 /
        this.worldPosition.distanceTo(
          this.tempVector.setFromMatrixPosition(this.camera.matrixWorld)
        );

      if (axis === 'E') {
        this.rotationAxis.copy(this.eye);
        this.rotationAngle = this.pointEnd.angleTo(this.pointStart);

        this.startNorm.copy(this.pointStart).normalize();
        this.endNorm.copy(this.pointEnd).normalize();

        this.rotationAngle *=
          this.endNorm.cross(this.startNorm).dot(this.eye) < 0 ? 1 : -1;
      } else if (axis === 'XYZE') {
        this.rotationAxis.copy(this.offset).cross(this.eye).normalize();
        this.rotationAngle =
          this.offset.dot(
            this.tempVector.copy(this.rotationAxis).cross(this.eye)
          ) * ROTATION_SPEED;
      } else if (axis === 'X' || axis === 'Y' || axis === 'Z') {
        this.rotationAxis.copy(this.unit[axis]);

        this.tempVector.copy(this.unit[axis]);

        if (space === 'local') {
          this.tempVector.applyQuaternion(this.worldQuaternion);
        }

        this.rotationAngle =
          this.offset.dot(this.tempVector.cross(this.eye).normalize()) *
          ROTATION_SPEED;
      }

      // Apply rotation snap

      if (this.rotationSnap) {
        this.rotationAngle =
          Math.round(this.rotationAngle / this.rotationSnap) *
          this.rotationSnap;
      }

      // Apply rotate
      if (space === 'local' && axis !== 'E' && axis !== 'XYZE') {
        object.quaternion.copy(this.quaternionStart);
        object.quaternion
          .multiply(
            this.tempQuaternion.setFromAxisAngle(
              this.rotationAxis,
              this.rotationAngle
            )
          )
          .normalize();
      } else {
        this.rotationAxis.applyQuaternion(this.parentQuaternionInv);
        object.quaternion.copy(
          this.tempQuaternion.setFromAxisAngle(
            this.rotationAxis,
            this.rotationAngle
          )
        );
        object.quaternion.multiply(this.quaternionStart).normalize();
      }
    }

    // @ts-expect-error ignore
    this.dispatchEvent(this.changeEvent);
    // @ts-expect-error ignore
    this.dispatchEvent(this.objectChangeEvent);
  };

  protected pointerUp = (pointer: TransformControlsPointerObject): void => {
    if (pointer.button !== 0) return;

    if (this.dragging && this.axis !== null) {
      this.mouseUpEvent.mode = this.mode;
      // @ts-expect-error ignore
      this.dispatchEvent(this.mouseUpEvent);
    }

    this.dragging = false;
    this.axis = null;
  };

  protected getPointer = (event: Event): TransformControlsPointerObject => {
    if (this.domElement && this.domElement.ownerDocument?.pointerLockElement) {
      return {
        x: 0,
        y: 0,
        button: (event as MouseEvent).button,
      };
    } else {
      const pointer = (event as TouchEvent).changedTouches
        ? (event as TouchEvent).changedTouches[0]
        : (event as MouseEvent);

      const rect = this.domElement!.getBoundingClientRect();

      return {
        x: ((pointer.clientX - rect.left) / rect.width) * 2 - 1,
        y: (-(pointer.clientY - rect.top) / rect.height) * 2 + 1,
        button: (event as MouseEvent).button,
      };
    }
  };

  protected onPointerHover = (event: Event): void => {
    if (!this.enabled) return;

    switch ((event as PointerEvent).pointerType) {
      case 'mouse':
      case 'pen':
        this.pointerHover(this.getPointer(event));
        break;
    }
  };

  protected onPointerDown = (event: Event): void => {
    if (!this.enabled || !this.domElement) return;

    this.domElement.style.touchAction = 'none'; // disable touch scroll
    this.domElement.ownerDocument.addEventListener(
      'pointermove',
      this.onPointerMove
    );
    this.pointerHover(this.getPointer(event));
    this.pointerDown(this.getPointer(event));
  };

  protected onPointerMove = (event: Event): void => {
    if (!this.enabled) return;

    this.pointerMove(this.getPointer(event));
  };

  protected onPointerUp = (event: Event): void => {
    if (!this.enabled || !this.domElement) return;

    this.domElement.style.touchAction! = '';
    this.domElement.ownerDocument.removeEventListener(
      'pointermove',
      this.onPointerMove
    );

    this.pointerUp(this.getPointer(event));
  };

  public getMode = (): TransformControls['mode'] => this.mode;

  public setMode = (mode: TransformControls['mode']): void => {
    this.mode = mode;
  };

  public setTranslationSnap = (translationSnap: number): void => {
    this.translationSnap = translationSnap;
  };

  public setRotationSnap = (rotationSnap: number): void => {
    this.rotationSnap = rotationSnap;
  };

  public setScaleSnap = (scaleSnap: number): void => {
    this.scaleSnap = scaleSnap;
  };

  public setSize = (size: number): void => {
    this.size = size;
  };

  public setSpace = (space: string): void => {
    this.space = space;
  };

  public update = (): void => {
    console.warn(
      'THREE.TransformControls: update function has no more functionality and therefore has been deprecated.'
    );
  };

  public connect = (domElement: HTMLElement): void => {
    if ((domElement as any) === document) {
      console.error(
        'THREE.OrbitControls: "document" should not be used as the target "domElement". Please use "renderer.domElement" instead.'
      );
    }
    this.domElement = domElement;

    this.domElement.addEventListener('pointerdown', this.onPointerDown);
    this.domElement.addEventListener('pointermove', this.onPointerHover);
    this.domElement.ownerDocument.addEventListener(
      'pointerup',
      this.onPointerUp
    );
  };

  public dispose = (): void => {
    this.domElement?.removeEventListener('pointerdown', this.onPointerDown);
    this.domElement?.removeEventListener('pointermove', this.onPointerHover);
    this.domElement?.ownerDocument?.removeEventListener(
      'pointermove',
      this.onPointerMove
    );
    this.domElement?.ownerDocument?.removeEventListener(
      'pointerup',
      this.onPointerUp
    );

    this.traverse((child) => {
      const mesh = child as Mesh<BufferGeometry, Material>;
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (mesh.material) {
        mesh.material.dispose();
      }
    });
  };
}
