import { map, timer } from 'rxjs';
import { type ActorRefFrom, fromEventObservable } from 'xstate';

import type { EventObservableCreator } from '../../../../../../types/observable.js';
import type { ToastEvent } from '../types.js';

type WaitForRemoveDelayInput = {
  removeDelay: number;
};

const waitForRemoveDelay: EventObservableCreator<
  ToastEvent,
  WaitForRemoveDelayInput
> = ({ input }) =>
  timer(input.removeDelay).pipe(map(() => ({ type: 'REMOVE' })));

export const waitForRemoveDelayLogic = fromEventObservable(waitForRemoveDelay);

export type WaitForRemoveDelayActorRef = ActorRefFrom<
  typeof waitForRemoveDelayLogic
>;
