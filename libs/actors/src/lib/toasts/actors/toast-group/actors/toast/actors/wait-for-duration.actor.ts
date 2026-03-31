import { animationFrames, map } from 'rxjs';
import { type ActorRefFrom, fromEventObservable } from 'xstate';

import type { EventObservableCreator } from '../../../../../../types/observable.js';
import type { ToastEvent } from '../types.js';

type WaitForDurationInput = {
  duration: number;
  remainingTime: number;
};

const waitForDuration: EventObservableCreator<
  ToastEvent,
  WaitForDurationInput
> = ({ input }) =>
  animationFrames().pipe(
    map(({ elapsed }) => {
      const delta = input.duration - input.remainingTime + elapsed;

      const progress = Number(Math.min(delta / input.duration, 1).toFixed(2));

      return delta >= input.duration
        ? { type: 'DISMISS' }
        : { type: 'PROGRESS', progress };
    })
  );

export const waitForDurationLogic = fromEventObservable(waitForDuration);

export type WaitForDurationActorRef = ActorRefFrom<typeof waitForDurationLogic>;
