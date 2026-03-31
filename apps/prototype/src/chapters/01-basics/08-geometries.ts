import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Camera,
  CapsuleGeometry,
  CircleGeometry,
  ConeGeometry,
  Curve,
  CylinderGeometry,
  DodecahedronGeometry,
  EdgesGeometry,
  ExtrudeGeometry,
  GridHelper,
  Group,
  IcosahedronGeometry,
  LatheGeometry,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  OctahedronGeometry,
  PerspectiveCamera,
  PlaneGeometry,
  RingGeometry,
  Scene,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  TetrahedronGeometry,
  TorusGeometry,
  TorusKnotGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
  WireframeGeometry,
} from 'three';
import { OrbitControls } from 'three-stdlib';

import { clamp, html } from '@xstate-workshop/utils';

import { fromFullscreenKeyup, fromWindowResize } from '../../utils';

export function setupCanvas(): HTMLCanvasElement {
  const root = document.getElementById('root');

  if (root === null) throw new Error('Root element is missing');

  root.innerHTML = html`
    <div class="h-screen w-screen overflow-hidden">
      <canvas class="scene outline-none"></canvas>
    </div>
  `;

  const canvas = document.querySelector<HTMLCanvasElement>('canvas.scene');

  if (canvas === null) throw new Error('Scene canvas element is missing');

  return canvas;
}

export function setupRenderer(canvas: HTMLCanvasElement): WebGLRenderer {
  const renderer = new WebGLRenderer({ canvas });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(clamp(window.devicePixelRatio, 1, 2));

  return renderer;
}

export function createEdgesGroup<TBufferGeometry extends BufferGeometry>(
  geometry: TBufferGeometry
): Group {
  const group = new Group();

  const edges = new EdgesGeometry(geometry);

  const lineMaterial = new LineBasicMaterial({
    color: 0xffffff,
    opacity: 0.75,
    transparent: true,
  });
  const meshMaterial = new MeshBasicMaterial({ color: 0x1c_39_8e });

  group.add(new LineSegments(edges, lineMaterial));
  group.add(new Mesh(geometry, meshMaterial));

  return group;
}

export function createWireframeGroup<TBufferGeometry extends BufferGeometry>(
  geometry: TBufferGeometry
): Group {
  const group = new Group();

  const wireframe = new WireframeGeometry(geometry);

  const lineMaterial = new LineBasicMaterial({
    color: 0xffffff,
    opacity: 0.75,
    transparent: true,
  });
  const meshMaterial = new MeshBasicMaterial({
    color: 0x1c_39_8e,
    /*
     * Use the `side` property to define which side of faces will be rendered -
     * front, back, or both.
     */
    /* side: DoubleSide, */
  });

  group.add(new LineSegments(wireframe, lineMaterial));
  group.add(new Mesh(geometry, meshMaterial));

  return group;
}

function createBox(): Group {
  return createWireframeGroup(new BoxGeometry(1, 1, 1));
}

function createCapsule(): Group {
  return createWireframeGroup(new CapsuleGeometry(1, 1, 10, 20, 1));
}

function createCircle(): Group {
  return createWireframeGroup(new CircleGeometry(1, 32, 0, Math.PI * 2));
}

function createCone(): Group {
  return createWireframeGroup(
    new ConeGeometry(1, 2, 8, 1, false, 0, Math.PI * 2)
  );
}

function createCylinder(): Group {
  return createWireframeGroup(
    new CylinderGeometry(1, 1, 2, 8, 1, false, 0, Math.PI * 2)
  );
}

function createDodecahedron(): Group {
  return createWireframeGroup(new DodecahedronGeometry(1, 0));
}

function createExtruded(): Group {
  const width = 1;
  const height = 2;

  const shape = new Shape();
  shape.moveTo(0, 0);
  shape.lineTo(0, height);
  shape.lineTo(width, height);
  shape.lineTo(width, 0);
  shape.lineTo(0, 0);

  const geometry = new ExtrudeGeometry(shape, {
    bevelEnabled: true,
    bevelOffset: 0,
    bevelSegments: 6,
    bevelSize: 0.2,
    bevelThickness: 0.5,
    depth: 2,
    steps: 2,
  });
  geometry.center();

  return createWireframeGroup(geometry);
}

function createIcosahedron(): Group {
  return createWireframeGroup(new IcosahedronGeometry(1, 0));
}

function createLathe(): Group {
  const points: Vector2[] = [];

  for (let i = 0; i <= 12; i++) {
    const x = Math.sin(i * 0.2) + 0.5;
    const y = (i - 5) / 4;

    points.push(new Vector2(x, y));
  }

  const geometry = new LatheGeometry(points, 12, 0, Math.PI * 2);
  geometry.center();

  return createWireframeGroup(geometry);
}

function createOctahedron(): Group {
  return createWireframeGroup(new OctahedronGeometry(1, 0));
}

function createPlane(): Group {
  return createWireframeGroup(new PlaneGeometry(1, 1, 1, 1));
}

function createRing(): Group {
  return createWireframeGroup(new RingGeometry(0.5, 1, 32, 1, 0, Math.PI * 2));
}

function createHeartShape(): Group {
  const x = 0;
  const y = 0;

  const heartShape = new Shape();

  heartShape.moveTo(x + 5, y + 5);
  heartShape.bezierCurveTo(x + 5, y + 5, x + 4, y, x, y);
  heartShape.bezierCurveTo(x - 6, y, x - 6, y + 7, x - 6, y + 7);
  heartShape.bezierCurveTo(x - 6, y + 11, x - 3, y + 15.4, x + 5, y + 19);
  heartShape.bezierCurveTo(x + 12, y + 15.4, x + 16, y + 11, x + 16, y + 7);
  heartShape.bezierCurveTo(x + 16, y + 7, x + 16, y, x + 10, y);
  heartShape.bezierCurveTo(x + 7, y, x + 5, y + 5, x + 5, y + 5);

  const geometry = new ShapeGeometry(heartShape, 12);
  geometry.scale(0.1, 0.1, 0.1);
  geometry.rotateZ(Math.PI);
  geometry.center();

  return createWireframeGroup(geometry);
}

function createSphere(): Group {
  return createWireframeGroup(
    new SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI)
  );
}

function createTetrahedron(): Group {
  return createWireframeGroup(new TetrahedronGeometry(1, 0));
}

function createTorus(): Group {
  return createWireframeGroup(new TorusGeometry(0.6, 0.3, 12, 48, Math.PI * 2));
}

function createTorusKnot(): Group {
  return createWireframeGroup(new TorusKnotGeometry(0.6, 0.2, 64, 8, 2, 3));
}

class CustomSinCurve extends Curve<Vector3> {
  private scale: number;

  constructor(scale = 1) {
    super();

    this.scale = scale;
  }

  public override getPoint(
    t: number,
    optionalTarget: Vector3 = new Vector3()
  ): Vector3 {
    const tx = t * 3 - 1.5;
    const ty = Math.sin(2 * Math.PI * t);
    const tz = 0;
    return optionalTarget.set(tx, ty, tz).multiplyScalar(this.scale);
  }
}

function createTube(): Group {
  const path = new CustomSinCurve();

  return createWireframeGroup(new TubeGeometry(path, 20, 0.2, 8, false));
}

function createCustom() {
  /*
   * Simple example of six vertices to render two triangles for a flat square.
   *
   * This example uses a non-indexed `BufferGeometry`.
   */
  /*
  const nonIndexedVertices = new BufferAttribute(
    new Float32Array([
      0, 1, 0,
      1, 1, 0,
      0, 0, 0,

      1, 1, 0,
      1, 0, 0,
      0, 0, 0,
    ]),
    3
  );
  geometry.setAttribute('position', nonIndexedVertices);
  */

  /*
   * Simple example of four vertices to render two triangles for a flat square.
   *
   * This example uses an indexed `BufferGeometry` via
   * `BufferGeometry.prototype.setIndex`.
   */
  /*
  const indexedVertices = new BufferAttribute(
    new Float32Array([
      0, 1, 0,
      1, 1, 0,
      0, 0, 0,
      1, 0, 0,
    ]),
    3
  );
  geometry.setAttribute('position', indexedVertices);
  geometry.setIndex([0, 1, 2, 1, 3, 2]);
  */

  const vertexCount = 1_000;
  const vertices = new Float32Array(vertexCount * 9);

  for (let index = 0; index < vertexCount * 9; index++) {
    vertices[index] = Math.random() - 0.5;
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(vertices, 3));

  return createWireframeGroup(geometry);
}

export function setupScene() {
  const scene = new Scene();

  const gridHelper = new GridHelper(100, 100);
  scene.add(gridHelper);

  const box = createBox();
  box.position.set(-24, 0, 0);
  scene.add(box);

  const capsule = createCapsule();
  capsule.position.set(-21, 0, 0);
  scene.add(capsule);

  const circle = createCircle();
  circle.position.set(-18, 0, 0);
  scene.add(circle);

  const cone = createCone();
  cone.position.set(-15, 0, 0);
  scene.add(cone);

  const cylinder = createCylinder();
  cylinder.position.set(-12, 0, 0);
  scene.add(cylinder);

  const dodecahedron = createDodecahedron();
  dodecahedron.position.set(-9, 0, 0);
  scene.add(dodecahedron);

  const extruded = createExtruded();
  extruded.position.set(-6, 0, 0);
  scene.add(extruded);

  const icosahedron = createIcosahedron();
  icosahedron.position.set(-3, 0, 0);
  scene.add(icosahedron);

  const lathe = createLathe();
  lathe.position.set(0, 0, 0);
  scene.add(lathe);

  const octahedron = createOctahedron();
  octahedron.position.set(3, 0, 0);
  scene.add(octahedron);

  const plane = createPlane();
  plane.position.set(6, 0, 0);
  scene.add(plane);

  const ring = createRing();
  ring.position.set(9, 0, 0);
  scene.add(ring);

  const heartShape = createHeartShape();
  heartShape.position.set(12, 0, 0);
  scene.add(heartShape);

  const sphere = createSphere();
  sphere.position.set(15, 0, 0);
  scene.add(sphere);

  const tetrahedron = createTetrahedron();
  tetrahedron.position.set(18, 0, 0);
  scene.add(tetrahedron);

  const torus = createTorus();
  torus.position.set(21, 0, 0);
  scene.add(torus);

  const torusKnot = createTorusKnot();
  torusKnot.position.set(24, 0, 0);
  scene.add(torusKnot);

  const tube = createTube();
  tube.position.set(27, 0, 0);
  scene.add(tube);

  const custom = createCustom();
  custom.position.set(0, 0, 3);
  scene.add(custom);

  const camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  camera.position.set(0, 14, 14);
  scene.add(camera);

  return { camera, scene };
}

export function animate(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: Camera,
  onFrame?: () => void
) {
  const tick = () => {
    renderer.render(scene, camera);
    onFrame?.();
    requestAnimationFrame(tick);
  };

  tick();
}

export function run() {
  const canvas = setupCanvas();
  const renderer = setupRenderer(canvas);
  const { camera, scene } = setupScene();

  fromWindowResize().subscribe(({ aspect, height, width }) => {
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    renderer.setPixelRatio(clamp(window.devicePixelRatio, 1, 2));
  });

  fromFullscreenKeyup().subscribe((shouldFullscreen) => {
    if (shouldFullscreen) canvas.requestFullscreen();
    else document.exitFullscreen();
  });

  const controls = new OrbitControls(camera, canvas);

  animate(renderer, scene, camera, () => controls.update());
}
