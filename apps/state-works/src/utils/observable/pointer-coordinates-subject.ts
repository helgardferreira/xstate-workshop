import { BehaviorSubject, type Subscription, fromEvent, map } from 'rxjs';
import { Vector2 } from 'three';

export class PointerCoordinatesSubject extends BehaviorSubject<Vector2> {
  private disposed = false;
  private subscription: Subscription;

  constructor() {
    const coordinates = new Vector2(-1, -1);

    super(coordinates);

    this.subscription = fromEvent<PointerEvent>(window, 'pointermove')
      .pipe(
        map((event) => ({
          x: (event.clientX / window.innerWidth) * 2 - 1,
          y: (event.clientY / window.innerHeight) * -2 + 1,
        }))
      )
      .subscribe(({ x, y }) => {
        this.next(coordinates.set(x, y));
      });
  }

  private dispose() {
    if (this.disposed) return;
    this.subscription.unsubscribe();
  }

  override complete(): void {
    this.dispose();
    super.complete();
  }

  override error(err: unknown): void {
    this.dispose();
    super.error(err);
  }

  override unsubscribe(): void {
    this.dispose();
    super.unsubscribe();
  }
}
