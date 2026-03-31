import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { filter, fromEvent } from 'rxjs';

type EventMap = Pick<
  GlobalEventHandlersEventMap,
  | 'click'
  | 'mousedown'
  | 'mouseup'
  | 'pointerdown'
  | 'pointerup'
  | 'touchend'
  | 'touchstart'
>;

type UseClickOutsideOptions<TEventName extends keyof EventMap> = {
  eventName?: TEventName;
  eventOptions?: {
    capture?: boolean;
    once?: boolean;
    passive?: boolean;
  };
  target?: Document | Element | Window;
};

export function useClickOutside<
  TElement extends Element,
  TEventName extends keyof EventMap,
>(
  cb: (
    event: keyof EventMap extends TEventName
      ? PointerEvent
      : EventMap[TEventName]
  ) => void,
  options?: UseClickOutsideOptions<TEventName>
) {
  const {
    eventName = 'pointerdown',
    eventOptions = {},
    target = document,
  } = options ?? {};

  const [element, ref] = useState<TElement | null>(null);
  const cbRef = useRef(cb);

  useLayoutEffect(() => {
    cbRef.current = cb;
  }, [cb]);

  useEffect(() => {
    const sub = fromEvent<
      keyof EventMap extends TEventName ? PointerEvent : EventMap[TEventName]
    >(target, eventName, {
      capture: eventOptions.capture,
      once: eventOptions.once,
      passive: eventOptions.passive,
    })
      .pipe(
        filter(
          (event) =>
            !!element &&
            event.target instanceof Element &&
            !element.contains(event.target)
        )
      )
      .subscribe(cbRef.current);

    return () => sub.unsubscribe();
  }, [
    element,
    eventName,
    eventOptions.capture,
    eventOptions.once,
    eventOptions.passive,
    target,
  ]);

  return ref;
}
