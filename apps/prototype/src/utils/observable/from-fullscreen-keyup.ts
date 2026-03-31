import { filter, fromEvent, map, tap } from 'rxjs';

export const fromFullscreenKeyup = () =>
  fromEvent<KeyboardEvent>(document, 'keyup').pipe(
    filter((event) => event.key.toLowerCase() === 'f'),
    tap((event) => event.preventDefault()),
    map(() => !document.fullscreenElement)
  );
