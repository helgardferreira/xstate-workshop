import { fromEvent, map } from 'rxjs';

export const fromWindowResize = () =>
  fromEvent<UIEvent>(window, 'resize').pipe(
    map(() => {
      const height = window.innerHeight;
      const width = window.innerWidth;
      const aspect = width / height;

      return { aspect, height, width };
    })
  );
