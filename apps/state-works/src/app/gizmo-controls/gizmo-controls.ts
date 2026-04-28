import {
  BehaviorSubject,
  type Observable,
  Subject,
  type Subscription,
  distinctUntilChanged,
  fromEvent,
  map,
  withLatestFrom,
} from 'rxjs';
import {
  Box3,
  Box3Helper,
  type Camera,
  type Intersection,
  type Object3D,
  Raycaster,
} from 'three';
import {
  TransformControls,
  type TransformControlsEventMap,
} from 'three/addons';

import { MutableSetSubject, PointerCoordinatesSubject } from '../../utils';

import { highlightedObjectFrom } from './highlighted-object-from';

type TransformControlsEvent<T extends keyof TransformControlsEventMap> = {
  readonly type: T;
  readonly target: GizmoControls;
} & TransformControlsEventMap[T];

type GizmoControlsOptions = {
  camera: Camera;
  domElement: HTMLElement | SVGElement;
  objects?: Object3D[];
};

// TODO: maybe rename this to just `Gizmo`
// TODO: implement override for `dispose` to clear memory correctly (e.g. observable subscriptions, Box3, Box3Helper, etc.)
// TODO: implement gizmo box3 hover and lick logic in `GizmoControls`
//       - dynamically attach / detach gizmo controls based on raycaster intersection click
//       - dynamically update `Box3` instance based on intersection hover and update associated `Box3Helper`
export class GizmoControls extends TransformControls {
  private highlightBox: Box3;
  private highlightRaycaster: Raycaster;
  private highlightedObjectSubject: BehaviorSubject<Object3D | null>;
  private intersectionsSubject: Subject<Intersection[]>;
  private objectsSubject: MutableSetSubject<Object3D>;
  private pointerCoordinatesSubject: PointerCoordinatesSubject;
  private selectedObjectSubject: BehaviorSubject<Object3D | null>;
  private subscriptions: Subscription[];

  public override domElement: HTMLElement | SVGElement;
  public highlightBoxHelper: Box3Helper;
  public get highlightedObject(): Object3D | null {
    return this.highlightedObjectSubject.getValue();
  }
  public get objects(): Object3D[] {
    return Array.from(this.objectsSubject);
  }
  public get selectedObject(): Object3D | null {
    return this.selectedObjectSubject.getValue();
  }

  constructor(options: GizmoControlsOptions) {
    const { camera, domElement, objects = [] } = options;

    super(camera, domElement);

    this.domElement = domElement;
    this.highlightBox = new Box3();
    this.highlightBoxHelper = new Box3Helper(this.highlightBox);
    this.highlightBoxHelper.visible = false;
    this.highlightRaycaster = new Raycaster();
    this.highlightedObjectSubject = new BehaviorSubject<Object3D | null>(null);
    this.intersectionsSubject = new Subject();
    this.objectsSubject = new MutableSetSubject(objects);
    this.pointerCoordinatesSubject = new PointerCoordinatesSubject();
    this.selectedObjectSubject = new BehaviorSubject<Object3D | null>(null);
    this.subscriptions = [];

    this.setupEvents();
  }

  private fromEvent<T extends keyof TransformControlsEventMap>(
    type: T
  ): Observable<TransformControlsEvent<T>> {
    return fromEvent<TransformControlsEvent<T>>(this, type);
  }

  private handleObjectHighlight(highlightedObject: Object3D | null) {
    if (highlightedObject === null) {
      this.highlightBoxHelper.visible = false;
    } else {
      this.highlightBox.setFromObject(highlightedObject);
      this.highlightBoxHelper.visible = true;
    }
  }

  private setupEvents(): void {
    this.subscriptions.push(
      highlightedObjectFrom(
        this.intersectionsSubject,
        this.objectsSubject
      ).subscribe(this.highlightedObjectSubject)
    );

    this.subscriptions.push(
      fromEvent<PointerEvent>(this.domElement, 'pointerdown')
        .pipe(
          withLatestFrom(this.highlightedObjectSubject),
          map(([_, object]) => object),
          distinctUntilChanged()
        )
        .subscribe(this.selectedObjectSubject)
    );

    this.subscriptions.push(
      this.highlightedObjectSubject.subscribe((object) =>
        this.handleObjectHighlight(object)
      )
    );

    // TODO: implement logic to prevent selected objects from being deselected if interacting with gizmo
    // TODO: implement logic to prevent selected objects from being highlighted
    // TODO: continue here...
    this.subscriptions.push(
      this.selectedObjectSubject.subscribe((selectedObject) => {
        if (selectedObject === null) {
          this.detach();
        } else {
          this.attach(selectedObject);
        }
      })
    );

    this.subscriptions.push(
      this.fromEvent('dragging-changed').subscribe((event) => {
        console.log('dragging-changed event', event);
      })
    );
  }

  public addObjects(...objects: Object3D[]): this {
    objects.forEach((object) => this.objectsSubject.add(object));

    return this;
  }

  public clearObjects(): this {
    this.objectsSubject.clear();

    return this;
  }

  public deleteObjects(...objects: Object3D[]): this {
    objects.forEach((object) => this.objectsSubject.delete(object));

    return this;
  }

  public override update(): void {
    this.highlightRaycaster.setFromCamera(
      this.pointerCoordinatesSubject.getValue(),
      this.camera
    );

    this.intersectionsSubject.next(
      this.highlightRaycaster.intersectObjects(this.objects)
    );
  }

  public override dispose(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.intersectionsSubject.unsubscribe();
    this.objectsSubject.unsubscribe();
    this.pointerCoordinatesSubject.unsubscribe();

    this.clearObjects();

    this.dispose();
  }
}
