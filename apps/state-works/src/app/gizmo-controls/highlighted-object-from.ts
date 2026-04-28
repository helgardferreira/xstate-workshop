import {
  type Observable,
  distinctUntilChanged,
  map,
  withLatestFrom,
} from 'rxjs';
import { type Intersection, type Object3D } from 'three';

export function highlightedObjectFrom(
  intersectionsSource: Observable<Intersection[]>,
  objectsSource: Observable<Iterable<Object3D>>
): Observable<Object3D | null> {
  return intersectionsSource.pipe(
    withLatestFrom(objectsSource),
    map(([intersections, objects]) => {
      const nearestIntersection = intersections.at(0);

      if (!nearestIntersection) return null;

      for (const object of objects) {
        if (object.getObjectById(nearestIntersection.object.id)) {
          return object;
        }
      }

      return null;
    }),
    distinctUntilChanged()
  );
}
