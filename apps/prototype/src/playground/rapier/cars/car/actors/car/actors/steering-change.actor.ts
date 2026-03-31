import { distinctUntilChanged, map, scan } from 'rxjs';
import { type ActorRefFrom, fromEventObservable } from 'xstate';

import type { EventObservableCreator } from '@xstate-workshop/actors';

import { fromFrames } from '../../../../../../../utils';
import type { SetSteeringAngleEvent } from '../types';

type SteeringChangeActorInput = {
  angle: number;
  direction: 'center' | 'left' | 'right';
  maxAngle: number;
  rate: number;
};

const steeringChange: EventObservableCreator<
  SetSteeringAngleEvent,
  SteeringChangeActorInput
> = ({ input }) => {
  const { angle, direction, maxAngle, rate } = input;

  let targetAngle: number;

  switch (direction) {
    case 'center': {
      targetAngle = 0;
      break;
    }
    case 'left': {
      targetAngle = -maxAngle;
      break;
    }
    case 'right': {
      targetAngle = maxAngle;
      break;
    }
  }

  return fromFrames().pipe(
    scan((acc, { deltaTime }) => {
      const step = rate * deltaTime;

      if (acc < targetAngle) {
        return Math.min(acc + step, targetAngle);
      }

      if (acc > targetAngle) {
        return Math.max(acc - step, targetAngle);
      }

      return acc;
    }, angle),
    distinctUntilChanged(),
    map((value) => ({ type: 'SET_STEERING_ANGLE', value }))
  );
};

export const steeringChangeLogic = fromEventObservable(steeringChange);

export type SteeringChangeActorRef = ActorRefFrom<typeof steeringChangeLogic>;
