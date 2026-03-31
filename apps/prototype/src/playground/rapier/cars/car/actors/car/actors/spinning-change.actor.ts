import { distinctUntilChanged, map, scan } from 'rxjs';
import { type ActorRefFrom, fromEventObservable } from 'xstate';

import type { EventObservableCreator } from '@xstate-workshop/actors';

import { fromFrames } from '../../../../../../../utils';
import type { SetSpinningVelocityEvent } from '../types';

type SpinningChangeActorInput = {
  accelerationRate: number;
  decelerationRate: number;
  direction: 'forward' | 'idle' | 'reverse';
  maxVelocity: number;
  velocity: number;
};

const spinningChange: EventObservableCreator<
  SetSpinningVelocityEvent,
  SpinningChangeActorInput
> = ({ input }) => {
  const {
    accelerationRate,
    decelerationRate,
    direction,
    maxVelocity,
    velocity,
  } = input;

  let targetVelocity: number;

  switch (direction) {
    case 'forward': {
      targetVelocity = maxVelocity;
      break;
    }
    case 'idle': {
      targetVelocity = 0;
      break;
    }
    case 'reverse': {
      targetVelocity = -maxVelocity;
      break;
    }
  }

  return fromFrames().pipe(
    scan((acc, { deltaTime }) => {
      const isAccelerating =
        (Math.sign(acc) === 0 ||
          Math.sign(targetVelocity) === Math.sign(acc)) &&
        Math.abs(targetVelocity) >= Math.abs(acc);
      const rate = isAccelerating ? accelerationRate : decelerationRate;
      const step = rate * deltaTime;

      if (acc < targetVelocity) {
        return Math.min(acc + step, targetVelocity);
      }

      if (acc > targetVelocity) {
        return Math.max(acc - step, targetVelocity);
      }

      return acc;
    }, velocity),
    distinctUntilChanged(),
    map((value) => ({ type: 'SET_SPINNING_VELOCITY', value }))
  );
};

export const spinningChangeLogic = fromEventObservable(spinningChange);

export type SpinningChangeActorRef = ActorRefFrom<typeof spinningChangeLogic>;
