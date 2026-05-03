import { distinctUntilChanged, map, from as rxFrom } from 'rxjs';
import { type Accessor, from as solidFrom } from 'solid-js';
import type { AnyActorRef, InteropObservable } from 'xstate';

export const useSelector = <
  T,
  TActor extends Pick<AnyActorRef, 'subscribe' | 'getSnapshot'> &
    InteropObservable<T>,
>(
  actorRef: TActor,
  selector: (
    snapshot: TActor extends {
      getSnapshot(): infer TSnapshot;
    }
      ? TSnapshot
      : undefined
  ) => T,
  compare?: (a: T, b: T) => boolean
): Accessor<T> => {
  return solidFrom(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rxFrom(actorRef).pipe(map<any, T>(selector), distinctUntilChanged(compare)),
    selector(actorRef.getSnapshot())
  );
};
