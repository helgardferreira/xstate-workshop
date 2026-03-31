import { type ActorRefFrom, type SnapshotFrom, assign, setup } from 'xstate';

import { keyboardInputLogic } from './actors/keyboard-input.actor';
import { spinningChangeLogic } from './actors/spinning-change.actor';
import { steeringChangeLogic } from './actors/steering-change.actor';
import type {
  CarActorContext,
  CarActorInput,
  CarEvent,
  SetSpinningVelocityEvent,
  SetSteeringAngleEvent,
} from './types';

// TODO: later improve with more advanced controls (e.g. drifting, nitrous, etc.)
// TODO: later add controls for windows, spoilers, and other dynamic meshes
// TODO: figure out car wheel spin issues
//       - determine if the current wheel spin / traction is accurate or not
//       - determine if the max velocity, acceleration / deceleration rate, and factor values are correct
//       - tweak wheel steering and spinning inputs for car machine
// TODO: implement integration between debug gui controls panel and car state machine
const carMachine = setup({
  types: {
    context: {} as CarActorContext,
    events: {} as CarEvent,
    input: {} as CarActorInput,
  },
  actions: {
    setSpinningVelocity: assign(
      ({ context }, { value }: Omit<SetSpinningVelocityEvent, 'type'>) => ({
        spinning: { ...context.spinning, velocity: value },
      })
    ),
    setSteeringAngle: assign(
      ({ context }, { value }: Omit<SetSteeringAngleEvent, 'type'>) => ({
        steering: { ...context.steering, angle: value },
      })
    ),
  },
  actors: {
    keyboardInput: keyboardInputLogic,
    spinningChange: spinningChangeLogic,
    steeringChange: steeringChangeLogic,
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5gF8A0IB2B7CdGgGMBDAJ3xAActYBLAFxqw3IA9EBaAJgBZ0BPDpwDMAOgCcEyVMkAOAGzI0IYiRGw6YMCRoYo5KrQZNWiHv0QBGCwAYRFgKzDuFzo5mdOYxehVqNWnSgRGggAGzB9anpGZiQQNgQbOTtuIRkZa2s5dJkXIXMEV3txOW5c+xcssTlrTm9lUj9NbV0mgN0AGTAAMzpIwxiTBAB2ZJrOeXtUsWGhbjEZAqELbhFuKe5M+zk5RxX633VmwLaWqAAlGigACz64g2jjOIThzgKLGbXhx3sFh0d5golIcKDoMIF+o9YqAEmYQAIEGlVmJpvJrHluNluAdGrBQRhwa0QuFIUZofFEGILCIPDIKjIxB5uN9ePDEPYhLZvqVXsMZqUhEIcao8WCThBtAA3CH3KJkoYZETyYYWZXcZy7dYFewMmmY6w6nhzbJAny4-GEoIkMCSrS0XSkwbPRCvArMzg0nZU4bzHivOqKZBAA */
  id: 'car',

  context: ({ input }) => ({
    // TODO: tweak default spinning config values
    spinning: {
      accelerationRate: input.spinning?.accelerationRate ?? 90,
      decelerationRate: input.spinning?.decelerationRate ?? 180,
      // factor: input.spinning?.factor ?? 50,
      factor: input.spinning?.factor ?? 30,
      maxVelocity: input.spinning?.maxVelocity ?? 50,
      velocity: input.spinning?.velocity ?? 0,
    },
    // TODO: tweak default steering config values
    steering: {
      angle: input.steering?.angle ?? 0,
      damping: input.steering?.damping ?? 500,
      maxAngle: input.steering?.maxAngle ?? 35,
      rate: input.steering?.rate ?? 100,
      stiffness: input.steering?.stiffness ?? 5_000,
    },
  }),

  type: 'parallel',

  invoke: {
    id: 'keyboardInput',
    src: 'keyboardInput',
  },

  states: {
    spinning: {
      initial: 'idle',

      on: {
        SET_SPINNING_VELOCITY: {
          actions: {
            params: ({ event }) => ({ value: event.value }),
            type: 'setSpinningVelocity',
          },
        },
      },

      states: {
        idle: {
          invoke: {
            id: 'spinningChangeIdle',
            src: 'spinningChange',
            input: ({ context: { spinning } }) => ({
              accelerationRate: spinning.accelerationRate,
              decelerationRate: spinning.decelerationRate,
              direction: 'idle',
              maxVelocity: spinning.maxVelocity,
              velocity: spinning.velocity,
            }),
          },

          on: {
            REVERSE: 'reversing',
            THROTTLE: 'driving',
          },
        },
        driving: {
          invoke: {
            id: 'spinningChangeForward',
            src: 'spinningChange',
            input: ({ context: { spinning } }) => ({
              accelerationRate: spinning.accelerationRate,
              decelerationRate: spinning.decelerationRate,
              direction: 'forward',
              maxVelocity: spinning.maxVelocity,
              velocity: spinning.velocity,
            }),
          },

          on: {
            DRIVE_RELEASE: 'idle',
            REVERSE: 'reversing',
          },
        },
        reversing: {
          invoke: {
            id: 'spinningChangeReverse',
            src: 'spinningChange',
            input: ({ context: { spinning } }) => ({
              accelerationRate: spinning.accelerationRate,
              decelerationRate: spinning.decelerationRate,
              direction: 'reverse',
              maxVelocity: spinning.maxVelocity,
              velocity: spinning.velocity,
            }),
          },

          on: {
            DRIVE_RELEASE: 'idle',
            THROTTLE: 'driving',
          },
        },
      },
    },

    steering: {
      initial: 'idle',

      on: {
        SET_STEERING_ANGLE: {
          actions: {
            params: ({ event }) => ({ value: event.value }),
            type: 'setSteeringAngle',
          },
        },
      },

      states: {
        idle: {
          invoke: {
            id: 'steeringChangeCenter',
            src: 'steeringChange',
            input: ({ context: { steering } }) => ({
              angle: steering.angle,
              direction: 'center',
              maxAngle: steering.maxAngle,
              rate: steering.rate,
            }),
          },

          on: {
            STEER_LEFT: 'steeringLeft',
            STEER_RIGHT: 'steeringRight',
          },
        },
        steeringLeft: {
          invoke: {
            id: 'steeringChangeLeft',
            src: 'steeringChange',
            input: ({ context: { steering } }) => ({
              angle: steering.angle,
              direction: 'left',
              maxAngle: steering.maxAngle,
              rate: steering.rate,
            }),
          },

          on: {
            STEER_RELEASE: 'idle',
            STEER_RIGHT: 'steeringRight',
          },
        },
        steeringRight: {
          invoke: {
            id: 'steeringChangeRight',
            src: 'steeringChange',
            input: ({ context: { steering } }) => ({
              angle: steering.angle,
              direction: 'right',
              maxAngle: steering.maxAngle,
              rate: steering.rate,
            }),
          },

          on: {
            STEER_LEFT: 'steeringLeft',
            STEER_RELEASE: 'idle',
          },
        },
      },
    },
  },
});

export { carMachine };

type CarActorRef = ActorRefFrom<typeof carMachine>;
type CarActorSnapshot = SnapshotFrom<typeof carMachine>;

export type { CarActorRef, CarActorSnapshot };
