/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  ActorSystem,
  EventObject,
  NonReducibleUnknown,
  ObservableActorRef,
  Subscribable,
} from 'xstate';

export type ObservableCreator<
  TContext = unknown,
  TInput extends NonReducibleUnknown = NonReducibleUnknown,
  TEmitted extends EventObject = EventObject,
> = (options: {
  input: TInput;
  system: ActorSystem<any>;
  self: ObservableActorRef<TContext>;
  emit: (emitted: TEmitted) => void;
}) => Subscribable<TContext>;

export type EventObservableCreator<
  TEvent extends EventObject = EventObject,
  TInput extends NonReducibleUnknown = NonReducibleUnknown,
  TEmitted extends EventObject = EventObject,
> = (options: {
  input: TInput;
  system: ActorSystem<any>;
  self: ObservableActorRef<TEvent>;
  emit: (emitted: TEmitted) => void;
}) => Subscribable<TEvent>;
