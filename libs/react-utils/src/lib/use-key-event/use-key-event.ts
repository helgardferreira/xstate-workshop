import { useEffect, useLayoutEffect, useRef } from 'react';
import { filter, fromEvent } from 'rxjs';

type EventMap = Pick<
  GlobalEventHandlersEventMap,
  'keydown' | 'keypress' | 'keyup'
>;

type UseKeyEventOptions<TEventName extends keyof EventMap> = {
  altKey?: boolean;
  /**
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_code_values Code values for keyboard events}
   */
  code?: string | ((code: string) => boolean);
  ctrlKey?: boolean;
  eventName?: TEventName;
  eventOptions?: { capture?: boolean; once?: boolean; passive?: boolean };
  /**
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values Key values for keyboard events}
   */
  key?: string | ((key: string) => boolean);
  metaKey?: boolean;
  repeat?: boolean;
  shiftKey?: boolean;
  target?: Document | Element | Window;
};

export const useKeyEvent = <TEventName extends keyof EventMap>(
  cb: (
    event: keyof EventMap extends TEventName
      ? KeyboardEvent
      : EventMap[TEventName]
  ) => void,
  options?: UseKeyEventOptions<TEventName>
) => {
  const {
    altKey,
    code,
    ctrlKey,
    eventName = 'keydown',
    eventOptions = {},
    key,
    metaKey,
    repeat,
    shiftKey,
    target = window,
  } = options ?? {};

  const cbRef = useRef(cb);
  const codeRef = useRef(code);
  const keyRef = useRef(key);

  useLayoutEffect(() => {
    cbRef.current = cb;
    codeRef.current = code;
    keyRef.current = key;
  }, [cb, code, key]);

  useEffect(() => {
    const sub = fromEvent<
      keyof EventMap extends TEventName ? KeyboardEvent : EventMap[TEventName]
    >(target, eventName, {
      capture: eventOptions.capture,
      once: eventOptions.once,
      passive: eventOptions.passive,
    })
      .pipe(
        filter((event) => {
          if (altKey !== undefined && event.altKey !== altKey) return false;
          if (ctrlKey !== undefined && event.ctrlKey !== ctrlKey) return false;
          if (metaKey !== undefined && event.metaKey !== metaKey) return false;
          if (repeat !== undefined && event.repeat !== repeat) return false;
          if (shiftKey !== undefined && event.shiftKey !== shiftKey)
            return false;

          if (
            typeof codeRef.current === 'function' &&
            !codeRef.current(event.code)
          ) {
            return false;
          }
          if (
            typeof codeRef.current === 'string' &&
            event.code !== codeRef.current
          ) {
            return false;
          }
          if (
            typeof keyRef.current === 'function' &&
            !keyRef.current(event.key)
          ) {
            return false;
          }
          if (
            typeof keyRef.current === 'string' &&
            event.key !== keyRef.current
          ) {
            return false;
          }

          return true;
        })
      )
      .subscribe(cbRef.current);

    return () => sub.unsubscribe();
  }, [
    altKey,
    ctrlKey,
    eventName,
    eventOptions.capture,
    eventOptions.once,
    eventOptions.passive,
    metaKey,
    repeat,
    shiftKey,
    target,
  ]);
};
