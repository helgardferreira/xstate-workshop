import { map, merge } from 'rxjs';
import { type ActorRefFrom, fromEventObservable } from 'xstate';

import type { EventObservableCreator } from '@xstate-workshop/actors';

import { fromPressedKeys } from '../../../../../../../utils';
import type {
  DriveReleaseEvent,
  ReverseEvent,
  SteerLeftEvent,
  SteerReleaseEvent,
  SteerRightEvent,
  ThrottleEvent,
} from '../types';

const keyboardInput: EventObservableCreator<
  | DriveReleaseEvent
  | ReverseEvent
  | SteerLeftEvent
  | SteerReleaseEvent
  | SteerRightEvent
  | ThrottleEvent
> = () => {
  const spinningInput$ = fromPressedKeys(['s', 'w']).pipe(
    map(({ keys }) => {
      if (keys.s && !keys.w) return { type: 'REVERSE' } as const;
      if (keys.w && !keys.s) return { type: 'THROTTLE' } as const;
      return { type: 'DRIVE_RELEASE' } as const;
    })
  );

  const steeringInput$ = fromPressedKeys(['a', 'd']).pipe(
    map(({ keys }) => {
      if (keys.a && !keys.d) return { type: 'STEER_LEFT' } as const;
      if (keys.d && !keys.a) return { type: 'STEER_RIGHT' } as const;
      return { type: 'STEER_RELEASE' } as const;
    })
  );

  return merge(spinningInput$, steeringInput$);
};

export const keyboardInputLogic = fromEventObservable(keyboardInput);

export type KeyboardInputActorRef = ActorRefFrom<typeof keyboardInputLogic>;
