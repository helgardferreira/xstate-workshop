import { interval, map } from 'rxjs';
import { type ActorRefFrom, fromEventObservable } from 'xstate';

import type { EventObservableCreator } from '@xstate-workshop/actors';

import type { HeartbeatEvent } from '../types';

const heartbeatInterval: EventObservableCreator<HeartbeatEvent> = () =>
  interval(30000).pipe(map(() => ({ type: 'HEARTBEAT' })));

export const heartbeatIntervalLogic = fromEventObservable(heartbeatInterval);

export type HeartbeatIntervalActorRef = ActorRefFrom<
  typeof heartbeatIntervalLogic
>;
