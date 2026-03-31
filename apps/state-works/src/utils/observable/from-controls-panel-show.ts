import type { GUI } from 'lil-gui';
import { type Observable, filter, fromEvent, map, tap } from 'rxjs';

export const fromControlsPanelShow = (gui: GUI): Observable<boolean> =>
  fromEvent<KeyboardEvent>(document, 'keyup').pipe(
    filter((event) => event.key.toLowerCase() === 'h'),
    tap((event) => event.preventDefault()),
    map(() => gui._hidden)
  );
