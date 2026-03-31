import type { GUI } from 'lil-gui';
import { forkJoin, lastValueFrom } from 'rxjs';
import {
  Camera,
  GridHelper,
  Mesh,
  MeshMatcapMaterial,
  PerspectiveCamera,
  SRGBColorSpace,
  Scene,
  Texture,
  TorusGeometry,
  WebGLRenderer,
} from 'three';
import {
  type Font,
  FontLoader,
  TextGeometry,
} from 'three/examples/jsm/Addons.js';
import { OrbitControls } from 'three-stdlib';

import { clamp, html, lerp } from '@xstate-workshop/utils';

import {
  createControlsPanel,
  fromFullscreenKeyup,
  fromTexture,
  fromWindowResize,
  getFontUrl,
  getTextureUrl,
} from '../../utils';

const DEFAULT_TEXT = 'HAL CREATIVE';

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

type Fonts = {
  roboto: Font;
};

async function loadFonts(): Promise<Fonts> {
  const fontLoader = new FontLoader();

  return lastValueFrom(
    forkJoin({
      roboto: fontLoader.loadAsync(getFontUrl('Roboto')),
    })
  );
}

type Textures = {
  matcap: Texture<HTMLImageElement>;
};

/**
 * This is an example of one possible approach for instantiating, and loading,
 * `three.js` textures without the use of a `TextureLoader` instance.
 */
function loadTextures(): Promise<Textures> {
  return lastValueFrom(
    forkJoin({
      matcap: fromTexture(getTextureUrl('matcaps', '4')),
    })
  );
}

export function setupScene(fonts: Fonts, textures: Textures) {
  const scene = new Scene();

  const camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  camera.position.set(0, 0.5, 3);

  const gridHelper = new GridHelper(50, 50);
  gridHelper.visible = false;

  textures.matcap.colorSpace = SRGBColorSpace;

  const donutGeometry = new TorusGeometry(0.3, 0.2, 20, 45);
  const textGeometry = new TextGeometry(DEFAULT_TEXT, {
    bevelEnabled: true,
    bevelOffset: 0,
    bevelSegments: 10,
    bevelSize: 0.02,
    bevelThickness: 0.03,
    curveSegments: 15,
    depth: 0.2,
    font: fonts.roboto,
    size: 0.5,
  }).center();

  const matcapMaterial = new MeshMatcapMaterial({ matcap: textures.matcap });

  const text = new Mesh(textGeometry, matcapMaterial);

  for (let i = 0; i < 100; i++) {
    const donut = new Mesh(donutGeometry, matcapMaterial);

    donut.position.x = lerp(Math.random(), -10, 10);
    donut.position.y = lerp(Math.random(), -10, 10);
    donut.position.z = lerp(Math.random(), -10, 10);
    donut.rotation.x = lerp(Math.random(), -Math.PI * 2, Math.PI * 2);
    donut.rotation.y = lerp(Math.random(), -Math.PI * 2, Math.PI * 2);
    donut.scale.multiplyScalar(lerp(Math.random(), 0.3, 1));

    scene.add(donut);
  }

  scene.add(camera, gridHelper, text);

  return { camera, gridHelper, text, scene };
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

function setupPanelControllers(
  gui: GUI,
  fonts: Fonts,
  gridHelper: GridHelper,
  text: Mesh<TextGeometry, MeshMatcapMaterial>
) {
  const folderPosition = gui.addFolder('Position');
  const folderGeometry = gui.addFolder('Geometry');
  const folderMaterial = gui.addFolder('Material');
  const folderGridHelper = gui.addFolder('Grid Helper');

  const controls = {
    position: {
      x: text.position.x,
      y: text.position.y,
      z: text.position.z,
    },
    geometry: {
      bevelEnabled: text.geometry.parameters.options.bevelEnabled,
      bevelOffset: text.geometry.parameters.options.bevelOffset,
      bevelSegments: text.geometry.parameters.options.bevelSegments,
      bevelSize: text.geometry.parameters.options.bevelSize,
      bevelThickness: text.geometry.parameters.options.bevelThickness,
      curveSegments: text.geometry.parameters.options.curveSegments,
      depth: text.geometry.parameters.options.depth,
      size: text.geometry.parameters.options.size,
      text: DEFAULT_TEXT,
    },
    material: {
      wireframe: text.material.wireframe,
    },
    gridHelper: {
      visible: gridHelper.visible,
    },
  };

  const controllers = {
    position: {
      x: folderPosition.add(controls.position, 'x').max(5).min(-5).step(0.1),
      y: folderPosition.add(controls.position, 'y').max(5).min(-5).step(0.1),
      z: folderPosition.add(controls.position, 'z').max(5).min(-5).step(0.1),
    },
    geometry: {
      bevelEnabled: folderGeometry
        .add(controls.geometry, 'bevelEnabled')
        .name('Bevel Enabled'),
      bevelOffset: folderGeometry
        .add(controls.geometry, 'bevelOffset')
        .max(0.1)
        .min(0)
        .name('Bevel Offset')
        .step(0.001),
      bevelSegments: folderGeometry
        .add(controls.geometry, 'bevelSegments')
        .max(100)
        .min(1)
        .name('Bevel Segments')
        .step(1),
      bevelSize: folderGeometry
        .add(controls.geometry, 'bevelSize')
        .max(0.1)
        .min(0)
        .name('Bevel Size')
        .step(0.001),
      bevelThickness: folderGeometry
        .add(controls.geometry, 'bevelThickness')
        .max(0.2)
        .min(0)
        .name('Bevel Thickness')
        .step(0.001),
      curveSegments: folderGeometry
        .add(controls.geometry, 'curveSegments')
        .max(100)
        .min(1)
        .name('Curve Segments')
        .step(1),
      depth: folderGeometry
        .add(controls.geometry, 'depth')
        .max(5)
        .min(0.1)
        .name('Depth')
        .step(0.01),
      size: folderGeometry
        .add(controls.geometry, 'size')
        .max(5)
        .min(0.1)
        .name('Size')
        .step(0.01),
      text: folderGeometry.add(controls.geometry, 'text').name('Text'),
    },
    material: {
      wireframe: folderMaterial
        .add(controls.material, 'wireframe')
        .name('Wireframe'),
    },
    gridHelper: {
      visible: folderGridHelper
        .add(controls.gridHelper, 'visible')
        .name('Visible'),
    },
  };

  function updatePosition() {
    text.position.set(
      controls.position.x,
      controls.position.y,
      controls.position.z
    );
  }

  controllers.position.x.onChange(updatePosition);
  controllers.position.y.onChange(updatePosition);
  controllers.position.z.onChange(updatePosition);

  function updateGeometry() {
    const geometry = new TextGeometry(controls.geometry.text, {
      bevelEnabled: controls.geometry.bevelEnabled,
      bevelOffset: controls.geometry.bevelOffset,
      bevelSegments: controls.geometry.bevelSegments,
      bevelSize: controls.geometry.bevelSize,
      bevelThickness: controls.geometry.bevelThickness,
      curveSegments: controls.geometry.curveSegments,
      depth: controls.geometry.depth,
      font: fonts.roboto,
      size: controls.geometry.size,
    }).center();

    text.geometry.dispose();
    text.geometry = geometry;
  }

  controllers.geometry.bevelEnabled.onChange(updateGeometry);
  controllers.geometry.bevelOffset.onChange(updateGeometry);
  controllers.geometry.bevelSegments.onChange(updateGeometry);
  controllers.geometry.bevelSize.onChange(updateGeometry);
  controllers.geometry.bevelThickness.onChange(updateGeometry);
  controllers.geometry.curveSegments.onChange(updateGeometry);
  controllers.geometry.depth.onChange(updateGeometry);
  controllers.geometry.size.onChange(updateGeometry);
  controllers.geometry.text.onChange(updateGeometry);

  controllers.material.wireframe.onChange((value: boolean) => {
    text.material.wireframe = value;
  });

  controllers.gridHelper.visible.onChange((value: boolean) => {
    gridHelper.visible = value;
  });

  return () => {
    controllers.position.x.destroy();
    controllers.position.y.destroy();
    controllers.position.z.destroy();
    folderPosition.destroy();
    controllers.geometry.bevelEnabled.destroy();
    controllers.geometry.bevelOffset.destroy();
    controllers.geometry.bevelSegments.destroy();
    controllers.geometry.bevelSize.destroy();
    controllers.geometry.bevelThickness.destroy();
    controllers.geometry.curveSegments.destroy();
    controllers.geometry.depth.destroy();
    controllers.geometry.size.destroy();
    controllers.geometry.text.destroy();
    folderGeometry.destroy();
    controllers.material.wireframe.destroy();
    folderMaterial.destroy();
    controllers.gridHelper.visible.destroy();
    folderGridHelper.destroy();
  };
}

export async function run() {
  const gui = createControlsPanel({ hide: true });
  const canvas = setupCanvas();
  const renderer = setupRenderer(canvas);

  const fonts = await loadFonts();
  const textures = await loadTextures();

  const { camera, gridHelper, text, scene } = setupScene(fonts, textures);
  setupPanelControllers(gui, fonts, gridHelper, text);

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
