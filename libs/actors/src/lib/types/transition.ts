/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  ActorScope,
  ActorSystem,
  EventObject,
  TransitionSnapshot,
} from 'xstate';

export type TransitionCreator<
  TContext = unknown,
  TEvent extends EventObject = EventObject,
  TEmitted extends EventObject = EventObject,
> = (
  snapshot: TContext,
  event: TEvent,
  actorScope: ActorScope<
    TransitionSnapshot<TContext>,
    TEvent,
    ActorSystem<any>,
    TEmitted
  >
) => TContext;
