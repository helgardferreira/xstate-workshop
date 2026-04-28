import { BehaviorSubject } from 'rxjs';

export class MutableSetSubject<T> extends BehaviorSubject<Set<T>> {
  private disposed = false;

  constructor(iterable?: Iterable<T> | null) {
    super(new Set(iterable));
  }

  public get size(): number {
    return this.getValue().size;
  }

  public [Symbol.iterator](): IterableIterator<T> {
    return this.getValue()[Symbol.iterator]();
  }

  public add(value: T): boolean {
    const set = this.getValue();

    if (set.has(value)) return false;

    set.add(value);
    this.next(set);

    return true;
  }

  public clear(): void {
    const set = this.getValue();

    if (set.size === 0) return;

    set.clear();
    this.next(set);
  }

  public delete(value: T): boolean {
    const set = this.getValue();

    if (!set.has(value)) return false;

    set.delete(value);
    this.next(set);

    return true;
  }

  public has(value: T): boolean {
    return this.getValue().has(value);
  }

  private dispose() {
    if (this.disposed) return;
    this.getValue().clear();
    this.disposed = true;
  }

  public override complete(): void {
    this.dispose();
    super.complete();
  }

  public override error(err: unknown): void {
    this.dispose();
    super.error(err);
  }

  public override unsubscribe(): void {
    this.dispose();
    super.unsubscribe();
  }
}
