import {
  BehaviorSubject,
  type Observable,
  Subject,
  type Subscription,
  filter,
  fromEvent,
  sample,
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

// TODO: maybe remove this later
type TransformControlsEvent<T extends keyof TransformControlsEventMap> = {
  readonly type: T;
  readonly target: Gizmo;
} & TransformControlsEventMap[T];

type GizmoOptions = {
  camera: Camera;
  domElement: HTMLElement | SVGElement;
  objects?: Object3D[];
};

// TODO: create state machine and move various logic into gizmo state machine
//       - implement rotate / scale / translate mode switching
//       - implement rotate / scale / translate axis toggling
//       - implement rotate / scale / translate locking
//       - implement undo / redo stacks
//       - implement simple rotate / scale / translate snapping
//       - implement grid translate snapping
//       - implement box3 translate snapping
// TODO: implement selected object box3 alongside highlighted object box3
// TODO: maybe rename this to just `Gizmo`
export class Gizmo extends TransformControls {
  private highlightBox: Box3;
  private highlightRaycaster: Raycaster;
  private highlightedObjectSubject: BehaviorSubject<Object3D | null>;
  private intersectionsSubject: Subject<Intersection[]>;
  private objectsSubject: MutableSetSubject<Object3D>;
  private pointerCoordinatesSubject: PointerCoordinatesSubject;
  private subscriptions: Subscription[];

  public override domElement: HTMLElement | SVGElement;
  public get helper(): ReturnType<TransformControls['getHelper']> {
    return this.getHelper();
  }
  public highlightBoxHelper: Box3Helper;
  public get highlightedObject(): Object3D | null {
    return this.highlightedObjectSubject.getValue();
  }
  public get objects(): Object3D[] {
    return Array.from(this.objectsSubject);
  }
  public get selectedObject(): Object3D | null {
    return this.object ?? null;
  }

  constructor(options: GizmoOptions) {
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
    this.subscriptions = [];

    this.setupEvents();
  }

  // TODO: maybe remove this later
  private fromTransformControlsEvent<T extends keyof TransformControlsEventMap>(
    type: T
  ): Observable<TransformControlsEvent<T>> {
    return fromEvent<TransformControlsEvent<T>>(this, type);
  }

  private handleDeselectObject(): void {
    this.highlightedObjectSubject.next(null);
    this.detach();
  }

  private handleHighlightObject(object: Object3D | null): void {
    if (object === null) {
      this.highlightBoxHelper.visible = false;
    } else if (object !== this.selectedObject) {
      this.highlightBox.setFromObject(object);
      this.highlightBoxHelper.visible = true;
    }
  }

  private handleSelectObject(object: Object3D | null): void {
    if (!object || this.selectedObject === object) return;

    this.highlightBoxHelper.visible = false;
    this.attach(object);
  }

  private setupEvents(): void {
    this.subscriptions.push(
      highlightedObjectFrom(
        this.intersectionsSubject,
        this.objectsSubject
      ).subscribe(this.highlightedObjectSubject)
    );

    this.subscriptions.push(
      this.highlightedObjectSubject
        .pipe(sample(fromEvent(this.domElement, 'pointerdown')))
        .subscribe((object) => this.handleSelectObject(object))
    );

    this.subscriptions.push(
      fromEvent<KeyboardEvent>(window, 'keyup')
        .pipe(filter((event) => event.key === 'Escape'))
        .subscribe(() => this.handleDeselectObject())
    );

    this.subscriptions.push(
      this.highlightedObjectSubject.subscribe((object) =>
        this.handleHighlightObject(object)
      )
    );
  }

  public addObjects(...objects: Object3D[]): this {
    objects.forEach((object) => this.objectsSubject.add(object));

    return this;
  }

  public clearObjects(): this {
    this.detach();
    this.objectsSubject.clear();

    return this;
  }

  public deleteObjects(...objects: Object3D[]): this {
    this.detach();
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
    this.detach();

    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.highlightedObjectSubject.unsubscribe();
    this.intersectionsSubject.unsubscribe();
    this.objectsSubject.unsubscribe();
    this.pointerCoordinatesSubject.unsubscribe();

    this.dispose();
  }
}
