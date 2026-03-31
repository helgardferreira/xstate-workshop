import { type Observable, type OperatorFunction, filter } from 'rxjs';
import { Mesh, type Object3D } from 'three';

export function filterMesh<T extends Mesh, S extends T>(
  predicate?: (mesh: T, index: number) => mesh is S
): OperatorFunction<Object3D, S>;
export function filterMesh<T extends Mesh>(
  predicate?: (mesh: Mesh, index: number) => boolean
): OperatorFunction<Object3D, T>;
export function filterMesh(
  predicate?: (mesh: Mesh, index: number) => boolean
): OperatorFunction<Object3D, Mesh> {
  return (source: Observable<Object3D>): Observable<Mesh> =>
    source.pipe(
      filter((object) => object instanceof Mesh),
      filter((mesh, index): mesh is Mesh =>
        predicate ? predicate(mesh as Mesh, index) : true
      )
    );
}
