import {
  type Observable,
  distinctUntilChanged,
  filter,
  fromEvent,
  map,
  merge,
  scan,
} from 'rxjs';

export type PressedKeys<T extends string> = {
  current: T | undefined;
  keys: Record<T, boolean>;
};

export function fromPressedKeys<T extends string>(
  includedKeys: T[]
): Observable<PressedKeys<T>> {
  const initialKeys = includedKeys.reduce(
    (acc, curr) => ({ ...acc, [curr]: false }),
    {} as Record<T, boolean>
  );

  return merge(
    fromEvent<KeyboardEvent>(document, 'keydown').pipe(
      map((event) => ({
        key: event.key.toLowerCase(),
        type: event.type as 'keydown',
      }))
    ),
    fromEvent<KeyboardEvent>(document, 'keyup').pipe(
      map((event) => ({
        key: event.key.toLowerCase(),
        type: event.type as 'keyup',
      }))
    )
  ).pipe(
    filter(({ key }) => (includedKeys as string[]).includes(key)),
    scan(
      (acc, curr) => {
        const type = curr.type;
        const key = curr.key as T;

        const currentIdx = acc.current.indexOf(key);

        if (type === 'keydown') {
          return {
            current:
              currentIdx === -1
                ? acc.current.concat(key)
                : [
                    ...acc.current.slice(0, currentIdx),
                    ...acc.current.slice(currentIdx + 1),
                    key,
                  ],
            keys: { ...acc.keys, [key]: true },
          };
        }

        return {
          current:
            currentIdx === -1
              ? acc.current
              : [
                  ...acc.current.slice(0, currentIdx),
                  ...acc.current.slice(currentIdx + 1),
                ],
          keys: { ...acc.keys, [key]: false },
        };
      },
      { current: [] as T[], keys: initialKeys }
    ),
    map(({ current, keys }) => ({ current: current.at(-1), keys })),
    distinctUntilChanged(
      (prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)
    )
  );
}
