import { forkJoin, lastValueFrom } from 'rxjs';
import {
  BoxGeometry,
  Camera,
  GridHelper,
  LoadingManager,
  Mesh,
  MeshBasicMaterial,
  NearestFilter,
  PerspectiveCamera,
  SRGBColorSpace,
  Scene,
  Texture,
  TextureLoader,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three-stdlib';

import { clamp, html } from '@xstate-workshop/utils';

import {
  fromFullscreenKeyup,
  fromTexture,
  fromWindowResize,
  getTextureUrl,
} from '../../utils';

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

type CheckerboardTextures = {
  color1024_1024: Texture<HTMLImageElement>;
  color8_8: Texture<HTMLImageElement>;
};

type DoorTextures = {
  alpha: Texture<HTMLImageElement>;
  ambientOcclusion: Texture<HTMLImageElement>;
  color: Texture<HTMLImageElement>;
  height: Texture<HTMLImageElement>;
  metalness: Texture<HTMLImageElement>;
  normal: Texture<HTMLImageElement>;
  roughness: Texture<HTMLImageElement>;
};

/**
 * This is an example of one possible approach for instantiating, and loading,
 * `three.js` textures without the use of a `TextureLoader` instance.
 */
export function loadTextures(): Promise<DoorTextures> {
  return lastValueFrom(
    forkJoin({
      alpha: fromTexture(getTextureUrl('door', 'alpha')),
      ambientOcclusion: fromTexture(getTextureUrl('door', 'ambient-occlusion')),
      color: fromTexture(getTextureUrl('door', 'color')),
      height: fromTexture(getTextureUrl('door', 'height')),
      metalness: fromTexture(getTextureUrl('door', 'metalness')),
      normal: fromTexture(getTextureUrl('door', 'normal')),
      roughness: fromTexture(getTextureUrl('door', 'roughness')),
    })
  );
}

/**
 * This is an example of another approach for instantiating, and loading,
 * `three.js` textures via a `TextureLoader` instance.
 */
function setupTextureLoader(): {
  checkerboardTextures: CheckerboardTextures;
  doorTextures: DoorTextures;
} {
  const loadingManager = new LoadingManager();
  loadingManager.onError = (url) => {
    console.error(new Error(`Failed to load ${url} texture`));
  };

  const textureLoader = new TextureLoader(loadingManager);

  const alpha = textureLoader.load(getTextureUrl('door', 'alpha'));
  const ambientOcclusion = textureLoader.load(
    getTextureUrl('door', 'ambient-occlusion')
  );
  const color = textureLoader.load(getTextureUrl('door', 'color'));
  const height = textureLoader.load(getTextureUrl('door', 'height'));
  const metalness = textureLoader.load(getTextureUrl('door', 'metalness'));
  const normal = textureLoader.load(getTextureUrl('door', 'normal'));
  const roughness = textureLoader.load(getTextureUrl('door', 'roughness'));

  const color1024_1024 = textureLoader.load(
    getTextureUrl('checkerboard', 'checkerboard-1024x1024')
  );
  const color8_8 = textureLoader.load(
    getTextureUrl('checkerboard', 'checkerboard-8x8')
  );

  return {
    checkerboardTextures: {
      color1024_1024,
      color8_8,
    },
    doorTextures: {
      alpha,
      ambientOcclusion,
      color,
      height,
      metalness,
      normal,
      roughness,
    },
  };
}

export function setupScene(
  { color: _doorColorTexture }: DoorTextures,
  {
    color1024_1024: _checkerboardTexture1024_1024,
    color8_8: checkerboardTexture8_8,
  }: CheckerboardTextures
) {
  const scene = new Scene();

  const gridHelper = new GridHelper(50, 50);
  scene.add(gridHelper);

  /*
   * Basic color (or albedo) texture example without any mipmap filtering.
   */
  /*
  doorColorTexture.colorSpace = SRGBColorSpace;
  const material = new MeshBasicMaterial({ map: doorColorTexture });
  */

  /*
   * Color texture example with a minification mipmap filter specified.
   * Specifically, this example demonstrates a moiré pattern.
   *
   * N.B. If `NearestFilter` is used on `minFilter` then `generateMipmaps` can
   * be set to `false` for a performance improvement.
   */
  /*
  checkerboardTexture1024_1024.colorSpace = SRGBColorSpace;
  checkerboardTexture1024_1024.generateMipmaps = false;
  checkerboardTexture1024_1024.minFilter = NearestFilter;
  const material = new MeshBasicMaterial({ map: checkerboardTexture1024_1024 });
  */

  /*
   * Color texture example with a magnification mipmap filter specified.
   */
  checkerboardTexture8_8.colorSpace = SRGBColorSpace;
  checkerboardTexture8_8.magFilter = NearestFilter;
  const material = new MeshBasicMaterial({ map: checkerboardTexture8_8 });

  const geometry = new BoxGeometry(1, 1, 1);
  const mesh = new Mesh(geometry, material);
  mesh.position.set(0, 0.5, 0);
  scene.add(mesh);

  const camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  camera.position.set(1.5, 0.5, 1.5);
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

/*
 * Some good resources to find textures:
 *
 * - https://www.poliigon.com/
 * - https://3dtextures.me/
 * - https://www.arroway-textures.ch/
 */
export async function run() {
  const canvas = setupCanvas();
  const renderer = setupRenderer(canvas);

  /* const doorTextures = await loadTextures(); */
  const { checkerboardTextures, doorTextures } = setupTextureLoader();

  const { camera, scene } = setupScene(doorTextures, checkerboardTextures);

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
  controls.target.set(0, 0.5, 0);

  animate(renderer, scene, camera, () => controls.update());
}
