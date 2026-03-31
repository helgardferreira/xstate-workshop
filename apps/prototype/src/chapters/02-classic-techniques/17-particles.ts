import { forkJoin, lastValueFrom } from 'rxjs';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Camera,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  type Texture,
  Timer,
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

type Textures = {
  particle1: Texture<HTMLImageElement>;
  particle2: Texture<HTMLImageElement>;
  particle3: Texture<HTMLImageElement>;
  particle4: Texture<HTMLImageElement>;
  particle5: Texture<HTMLImageElement>;
  particle6: Texture<HTMLImageElement>;
  particle7: Texture<HTMLImageElement>;
  particle8: Texture<HTMLImageElement>;
  particle9: Texture<HTMLImageElement>;
  particle10: Texture<HTMLImageElement>;
  particle11: Texture<HTMLImageElement>;
  particle12: Texture<HTMLImageElement>;
  particle13: Texture<HTMLImageElement>;
};

function loadTextures(): Promise<Textures> {
  return lastValueFrom(
    forkJoin({
      particle1: fromTexture(getTextureUrl('particles', '1')),
      particle2: fromTexture(getTextureUrl('particles', '2')),
      particle3: fromTexture(getTextureUrl('particles', '3')),
      particle4: fromTexture(getTextureUrl('particles', '4')),
      particle5: fromTexture(getTextureUrl('particles', '5')),
      particle6: fromTexture(getTextureUrl('particles', '6')),
      particle7: fromTexture(getTextureUrl('particles', '7')),
      particle8: fromTexture(getTextureUrl('particles', '8')),
      particle9: fromTexture(getTextureUrl('particles', '9')),
      particle10: fromTexture(getTextureUrl('particles', '10')),
      particle11: fromTexture(getTextureUrl('particles', '11')),
      particle12: fromTexture(getTextureUrl('particles', '12')),
      particle13: fromTexture(getTextureUrl('particles', '13')),
    })
  );
}

export function setupScene(textures: Textures) {
  const scene = new Scene();

  const camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  camera.position.set(8, 8, 8);

  const vertexCount = 20_000;
  const colors = new Float32Array(vertexCount * 3);
  const positions = new Float32Array(vertexCount * 3);

  for (let i = 0; i < positions.length; i++) {
    colors[i] = Math.random();
    positions[i] = (Math.random() - 0.5) * 10;
  }

  const particlesGeometry = new BufferGeometry();
  particlesGeometry.setAttribute('position', new BufferAttribute(positions, 3));
  particlesGeometry.setAttribute('color', new BufferAttribute(colors, 3));

  const particlesMaterial = new PointsMaterial({
    /*
     * There are a few different ways to address the phenomenon in a
     * `PointsMaterial` where an applied `alphaMap` is not fully transparent
     * event with the `transparent` property set to `true`:
     * - `alphaTest`
     * - `depthTest`
     * - `depthWrite`
     *
     * Each has their own pros and cons so pick wisely when attempting to use
     * an `alphaMap` on a `PointsMaterial` with complex buffer geometry.
     */
    /* alphaTest: 0.001, */
    /* depthTest: false, */
    depthWrite: false,
    alphaMap: textures.particle2,
    blending: AdditiveBlending,
    color: 0xff_ff_ff,
    map: textures.particle2,
    size: 0.125,
    sizeAttenuation: true,
    transparent: true,
    vertexColors: true,
  });
  const particles = new Points(particlesGeometry, particlesMaterial);

  scene.add(camera, particles);

  return { camera, particles, scene };
}

export function animate(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: Camera,
  onFrame?: (elapsedTime: number) => void
) {
  const timer = new Timer();

  const tick = () => {
    timer.update();
    const elapsedTime = timer.getElapsed();
    renderer.render(scene, camera);
    onFrame?.(elapsedTime);
    requestAnimationFrame(tick);
  };

  tick();
}

export async function run() {
  const canvas = setupCanvas();
  const renderer = setupRenderer(canvas);

  const textures = await loadTextures();

  const { camera, particles, scene } = setupScene(textures);

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
  controls.enablePan = false;

  const vertexCount = particles.geometry.getAttribute('position').count;

  animate(renderer, scene, camera, (elapsedTime) => {
    controls.update();

    /*
     * Very basic `Points` object animation by leveraging the `Object3D`
     * behavior of the `Points` class.
     */
    /*
    const speed = 0.2;
    particles.rotation.y = elapsedTime * speed;
    */

    /*
     * More advanced but still crude animation, from a performance perspective,
     * animation by mutating the position buffer attribute directly via the CPU.
     *
     * Generally speaking, a more performant approach would be to use a vertex
     * and / or fragment shader.
     */
    if (!vertexCount) return;

    const speed = 1;
    const theta = elapsedTime * speed;

    for (let i = 0; i < vertexCount; i++) {
      const xIndex = i * 3;
      const yIndex = xIndex + 1;
      const zIndex = xIndex + 2;

      const x = particles.geometry.attributes.position.array[xIndex];
      const z = particles.geometry.attributes.position.array[zIndex];
      particles.geometry.attributes.position.array[yIndex] = Math.min(
        Math.max(Math.sin(theta + x) / Math.cos(theta + z), -5),
        5
      );
    }
    particles.geometry.attributes.position.needsUpdate = true;
  });
}
