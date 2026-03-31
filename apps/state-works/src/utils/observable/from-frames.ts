import { type Observable, animationFrames, map, pairwise } from 'rxjs';

type Frame = {
  deltaTime: number;
  elapsedTime: number;
};

export function fromFrames(): Observable<Frame> {
  return animationFrames().pipe(
    pairwise(),
    map(([prev, curr]) => ({
      deltaTime: (curr.elapsed - prev.elapsed) / 1000,
      elapsedTime: curr.elapsed / 1000,
    }))
  );
}
