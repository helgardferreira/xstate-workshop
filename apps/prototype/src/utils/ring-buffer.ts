export class RingBuffer<T> implements Iterable<T> {
  private buffer: Array<T>;
  /**
   * Index of oldest element.
   */
  private head = 0;
  /**
   * Number of valid elements.
   */
  private size = 0;

  /**
   * @param capacity Max number of items to retain.
   */
  constructor(public readonly capacity: number) {
    if (!Number.isFinite(capacity)) {
      throw new RangeError('Capacity must be a finite number');
    }
    if (!Number.isInteger(capacity)) {
      throw new RangeError('Capacity must be an integer');
    }
    if (capacity <= 0) {
      throw new RangeError('Capacity must be a positive integer');
    }

    this.buffer = new Array(capacity);
    this.head = 0;
    this.size = 0;
  }

  /**
   * Adds an item at the "tail". If full, overwrites the oldest (drops head).
   *
   * @param item New element to add to the buffer.
   * @returns Whether an item was dropped.
   */
  push(item: T): boolean {
    const dropped = this.size === this.capacity;

    const tailIndex = (this.head + this.size) % this.capacity;
    const writeIndex = dropped ? this.head : tailIndex;

    this.buffer[writeIndex] = item;

    if (dropped) this.head = (this.head + 1) % this.capacity;
    else this.size++;

    return dropped;
  }

  /**
   * Returns the item located at the specified index.
   *
   * @param index The zero-based index of the desired code unit. A negative
   * index will count back from the last item.
   */
  at(index: number): T | undefined {
    if (index < 0 || index >= this.size) return undefined;

    return this.buffer[(this.head + index) % this.capacity];
  }

  clear(): void {
    this.buffer.fill(undefined as T);
    this.head = 0;
    this.size = 0;
  }

  /**
   * Returns an iterable of key, value pairs for every entry in the buffer.
   */
  entries(): Generator<[number, T]> {
    const buffer = this.buffer;
    const cap = this.capacity;
    const head = this.head;
    const size = this.size;

    return (function* () {
      for (let i = 0; i < size; i++) {
        const index = (head + i) % cap;
        const value = buffer[index];

        yield [index, value];
      }
    })();
  }

  /**
   * Returns an iterable of values in the buffer.
   */
  values(): Generator<T> {
    const buffer = this.buffer;
    const cap = this.capacity;
    const head = this.head;
    const size = this.size;

    return (function* () {
      for (let i = 0; i < size; i++) {
        const index = (head + i) % cap;
        const value = buffer[index];

        yield value;
      }
    })();
  }

  /**
   * Executes a provided function once per each value in the buffer.
   */
  forEach(
    callbackfn: (item: T, index: number, ringBuffer: RingBuffer<T>) => void
  ): void {
    for (const [index, item] of this.entries()) {
      callbackfn(item, index, this);
    }
  }

  /**
   * Iterates over values in the buffer.
   */
  [Symbol.iterator](): Generator<T> {
    return this.values();
  }
}
