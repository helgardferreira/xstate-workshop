/* eslint-disable @typescript-eslint/no-explicit-any */
import { distinctUntilChanged, map, from as rxFrom } from 'rxjs';
import { type Accessor, from as solidFrom } from 'solid-js';
import type { ActorRef, AnyMachineSnapshot } from 'xstate';

// TODO: rename this hook
export const useMatches = <
  TActor extends ActorRef<AnyMachineSnapshot, any, any>,
>(
  actorRef: TActor,
  partialStateValue: Parameters<ReturnType<TActor['getSnapshot']>['matches']>[0]
): Accessor<boolean> => {
  return solidFrom(
    rxFrom(actorRef).pipe(
      map((snapshot) => snapshot.matches(partialStateValue)),
      distinctUntilChanged()
    ),
    actorRef.getSnapshot().matches(partialStateValue)
  );
};
