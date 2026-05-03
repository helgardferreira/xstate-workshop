import { onCleanup, onMount } from 'solid-js';
import {
  type Actor,
  type ActorOptions,
  type AnyActorLogic,
  type ConditionalRequired,
  type IsNotNever,
  type RequiredActorOptionsKeys,
  createActor,
} from 'xstate';

export const useActor = <TLogic extends AnyActorLogic>(
  logic: TLogic,
  ...[options]: ConditionalRequired<
    [
      options?: ActorOptions<TLogic> & {
        [K in RequiredActorOptionsKeys<TLogic>]: unknown;
      },
    ],
    IsNotNever<RequiredActorOptionsKeys<TLogic>>
  >
): Actor<TLogic> => {
  const actor = createActor(logic, options);

  onMount(() => {
    actor.start();
    onCleanup(() => actor.stop());
  });

  return actor;
};
