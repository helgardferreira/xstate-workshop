/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  type ObservedValueOf,
  filter,
  firstValueFrom,
  from,
  startWith,
  timeout,
} from 'rxjs';
import type { ActorRef, AnyMachineSnapshot } from 'xstate';

export function untilStateMatches<
  TActor extends ActorRef<AnyMachineSnapshot, any, any>,
>(
  actorRef: TActor,
  partialStateValue: Parameters<
    ReturnType<TActor['getSnapshot']>['matches']
  >[0],
  timeoutMs = 10_000
): Promise<ObservedValueOf<TActor>> {
  return firstValueFrom(
    from(actorRef).pipe(
      startWith(actorRef.getSnapshot() as ObservedValueOf<TActor>),
      filter((snapshot) => snapshot.matches(partialStateValue)),
      timeout({ first: timeoutMs })
    )
  );
}
