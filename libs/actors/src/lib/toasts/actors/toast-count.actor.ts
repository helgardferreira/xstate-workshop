import { distinctUntilChanged, from, map, mergeScan, startWith } from 'rxjs';
import { type ActorRefFrom, fromEventObservable } from 'xstate';

import type { EventObservableCreator } from '../../types/observable.js';
import type { ToastPlacement, ToastsActorEvent } from '../types.js';

import type { ToastGroupActorRef } from './toast-group/toast-group.machine.js';

type ToastCountActorInput = {
  toastGroups: Record<`${ToastPlacement}`, ToastGroupActorRef>;
};

const toastCount: EventObservableCreator<
  ToastsActorEvent,
  ToastCountActorInput
> = ({ input }) =>
  from(Object.entries(input.toastGroups)).pipe(
    mergeScan(
      (acc, [id, toastGroupActor]) =>
        from(toastGroupActor).pipe(
          startWith(toastGroupActor.getSnapshot()),
          map((snapshot) =>
            acc.set(id, Object.values(snapshot.children).length)
          )
        ),
      new Map<string, number>()
    ),
    map((toastGroupCounts) =>
      Array.from(toastGroupCounts.values()).reduce((acc, count) => acc + count)
    ),
    distinctUntilChanged(),
    map((count) => ({ type: 'TOAST_COUNT', count }))
  );

export const toastCountLogic = fromEventObservable(toastCount);

export type ToastCountActorRef = ActorRefFrom<typeof toastCountLogic>;
