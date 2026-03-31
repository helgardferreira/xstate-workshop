import { map, timer } from 'rxjs';
import { type ActorRefFrom, fromEventObservable } from 'xstate';

import type { EventObservableCreator } from '../../../../../../types/observable.js';
import type { ToastEvent } from '../types.js';

const waitForNextTick: EventObservableCreator<ToastEvent> = () =>
  timer(0).pipe(map(() => ({ type: 'SHOW' })));

export const waitForNextTickLogic = fromEventObservable(waitForNextTick);

export type WaitForNextTickActorRef = ActorRefFrom<typeof waitForNextTickLogic>;
