import type { GUI } from 'lil-gui';
import { forkJoin, lastValueFrom } from 'rxjs';
import {
  Camera,
  Color,
  CubeCamera,
  type CubeTexture,
  CubeTextureLoader,
  type DataTexture,
  EquirectangularReflectionMapping,
  Group,
  HalfFloatType,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  SRGBColorSpace,
  Scene,
  Texture,
  Timer,
  TorusGeometry,
  TorusKnotGeometry,
  WebGLCubeRenderTarget,
  WebGLRenderer,
} from 'three';
import { EXRLoader, type GLTF, GLTFLoader, HDRLoader } from 'three/addons';
import { OrbitControls } from 'three-stdlib';

import { clamp, html } from '@xstate-workshop/utils';

import {
  createControlsPanel,
  fromFullscreenKeyup,
  fromTexture,
  fromWindowResize,
  getModelUrl,
  getTextureUrl,
} from '../../utils';

function setupCanvas(): HTMLCanvasElement {
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

function setupRenderer(canvas: HTMLCanvasElement): WebGLRenderer {
  const renderer = new WebGLRenderer({ canvas });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(clamp(window.devicePixelRatio, 1, 2));

  return renderer;
}

type Models = {
  flightHelmet: GLTF;
};

function loadModels(): Promise<Models> {
  const gltfLoader = new GLTFLoader();

  return lastValueFrom(
    forkJoin({
      flightHelmet: gltfLoader.loadAsync(getModelUrl('flight-helmet', 'gltf')),
    })
  );
}

type Textures = {
  environmentMap0: CubeTexture;
  environmentMap1: CubeTexture;
  environmentMap1Hdr: DataTexture;
  environmentMap2: CubeTexture;
  environmentMap3: CubeTexture;
  environmentMap4: CubeTexture;
  environmentMap5: CubeTexture;
  environmentMap5Hdr: DataTexture;
  environmentMap6: CubeTexture;
  environmentMap6Hdr: DataTexture;
  environmentMapNvidia: DataTexture;
  environmentMapSkyBoxAnime: Texture;
  environmentMapSkyBoxCabin: Texture;
  environmentMapSkyBoxFantasy: Texture;
  environmentMapSkyBoxNeon: Texture;
  environmentMapSkyBoxScraper: Texture;
};

function loadTextures(): Promise<Textures> {
  const cubeTextureLoader = new CubeTextureLoader();
  const hdrLoader = new HDRLoader();
  const exrLoader = new EXRLoader();

  return lastValueFrom(
    forkJoin({
      environmentMap0: cubeTextureLoader.loadAsync([
        getTextureUrl('environment-map', ['0', 'px']),
        getTextureUrl('environment-map', ['0', 'nx']),
        getTextureUrl('environment-map', ['0', 'py']),
        getTextureUrl('environment-map', ['0', 'ny']),
        getTextureUrl('environment-map', ['0', 'pz']),
        getTextureUrl('environment-map', ['0', 'nz']),
      ]),
      environmentMap1: cubeTextureLoader.loadAsync([
        getTextureUrl('environment-map', ['1', 'px']),
        getTextureUrl('environment-map', ['1', 'nx']),
        getTextureUrl('environment-map', ['1', 'py']),
        getTextureUrl('environment-map', ['1', 'ny']),
        getTextureUrl('environment-map', ['1', 'pz']),
        getTextureUrl('environment-map', ['1', 'nz']),
      ]),
      environmentMap1Hdr: hdrLoader.loadAsync(
        getTextureUrl('environment-map', ['1', '2k'])
      ),
      environmentMap2: cubeTextureLoader.loadAsync([
        getTextureUrl('environment-map', ['2', 'px']),
        getTextureUrl('environment-map', ['2', 'nx']),
        getTextureUrl('environment-map', ['2', 'py']),
        getTextureUrl('environment-map', ['2', 'ny']),
        getTextureUrl('environment-map', ['2', 'pz']),
        getTextureUrl('environment-map', ['2', 'nz']),
      ]),
      environmentMap3: cubeTextureLoader.loadAsync([
        getTextureUrl('environment-map', ['3', 'px']),
        getTextureUrl('environment-map', ['3', 'nx']),
        getTextureUrl('environment-map', ['3', 'py']),
        getTextureUrl('environment-map', ['3', 'ny']),
        getTextureUrl('environment-map', ['3', 'pz']),
        getTextureUrl('environment-map', ['3', 'nz']),
      ]),
      environmentMap4: cubeTextureLoader.loadAsync([
        getTextureUrl('environment-map', ['4', 'px']),
        getTextureUrl('environment-map', ['4', 'nx']),
        getTextureUrl('environment-map', ['4', 'py']),
        getTextureUrl('environment-map', ['4', 'ny']),
        getTextureUrl('environment-map', ['4', 'pz']),
        getTextureUrl('environment-map', ['4', 'nz']),
      ]),
      environmentMap5: cubeTextureLoader.loadAsync([
        getTextureUrl('environment-map', ['5', 'px']),
        getTextureUrl('environment-map', ['5', 'nx']),
        getTextureUrl('environment-map', ['5', 'py']),
        getTextureUrl('environment-map', ['5', 'ny']),
        getTextureUrl('environment-map', ['5', 'pz']),
        getTextureUrl('environment-map', ['5', 'nz']),
      ]),
      environmentMap5Hdr: hdrLoader.loadAsync(
        getTextureUrl('environment-map', ['5', '2k'])
      ),
      environmentMap6: cubeTextureLoader.loadAsync([
        getTextureUrl('environment-map', ['6', 'px']),
        getTextureUrl('environment-map', ['6', 'nx']),
        getTextureUrl('environment-map', ['6', 'py']),
        getTextureUrl('environment-map', ['6', 'ny']),
        getTextureUrl('environment-map', ['6', 'pz']),
        getTextureUrl('environment-map', ['6', 'nz']),
      ]),
      environmentMap6Hdr: hdrLoader.loadAsync(
        getTextureUrl('environment-map', ['6', '2k'])
      ),
      environmentMapNvidia: exrLoader.loadAsync(
        getTextureUrl('environment-map', 'nvidia-canvas-4k')
      ),
      environmentMapSkyBoxAnime: fromTexture(
        getTextureUrl('environment-map', [
          'blockades-labs-skybox',
          'anime-art-style-japan-streets-with-cherry-blossom',
        ])
      ),
      environmentMapSkyBoxCabin: fromTexture(
        getTextureUrl('environment-map', [
          'blockades-labs-skybox',
          'interior-views-cozy-wood-cabin-with-cauldron-and-p',
        ])
      ),
      environmentMapSkyBoxFantasy: fromTexture(
        getTextureUrl('environment-map', [
          'blockades-labs-skybox',
          'fantasy-lands-castles-at-night',
        ])
      ),
      environmentMapSkyBoxNeon: fromTexture(
        getTextureUrl('environment-map', [
          'blockades-labs-skybox',
          'digital-painting-neon-city-night-orange-lights',
        ])
      ),
      environmentMapSkyBoxScraper: fromTexture(
        getTextureUrl('environment-map', [
          'blockades-labs-skybox',
          'scifi-white-sky-scrapers-in-clouds-at-day-time',
        ])
      ),
    })
  );
}

function setupScene(models: Models, textures: Textures) {
  const scene = new Scene();

  textures.environmentMap1Hdr.mapping = EquirectangularReflectionMapping;
  textures.environmentMap5Hdr.mapping = EquirectangularReflectionMapping;
  textures.environmentMap6Hdr.mapping = EquirectangularReflectionMapping;
  textures.environmentMapNvidia.mapping = EquirectangularReflectionMapping;
  textures.environmentMapSkyBoxAnime.colorSpace = SRGBColorSpace;
  textures.environmentMapSkyBoxAnime.mapping = EquirectangularReflectionMapping;
  textures.environmentMapSkyBoxCabin.colorSpace = SRGBColorSpace;
  textures.environmentMapSkyBoxCabin.mapping = EquirectangularReflectionMapping;
  textures.environmentMapSkyBoxFantasy.colorSpace = SRGBColorSpace;
  textures.environmentMapSkyBoxFantasy.mapping =
    EquirectangularReflectionMapping;
  textures.environmentMapSkyBoxNeon.colorSpace = SRGBColorSpace;
  textures.environmentMapSkyBoxNeon.mapping = EquirectangularReflectionMapping;
  textures.environmentMapSkyBoxScraper.colorSpace = SRGBColorSpace;
  textures.environmentMapSkyBoxScraper.mapping =
    EquirectangularReflectionMapping;

  /*
   * For simpler environment map backgrounds (e.g. a non ground-projected skybox)
   * we can simply just set the `scene.background` to the `DataTexture`,
   * `CubeTexture`, or `Texture` instance directly.
   */
  scene.background = textures.environmentMapSkyBoxCabin;

  /*
   * Example of a ground-projected skybox - which is essentially just a
   * "squished" sphere.
   */
  /*
  const skybox = new GroundedSkybox(textures.environmentMap6Hdr, 15, 70);
  skybox.material.wireframe = false;
  skybox.position.set(0, 15, 0);
  scene.add(skybox);
  */

  /*
   * Example of a real-time environment map using a render target
   * (`WebGLCubeRenderTarget`) and `CubeCamera` to update the render target
   * with the contents of the scene.
   */
  const cubeRenderTarget = new WebGLCubeRenderTarget(256, {
    /*
     * The texture type - configure the type of value that will be stored for
     * the render target's texture.
     */
    /* type: FloatType, */
    type: HalfFloatType,
  });
  const cubeCamera = new CubeCamera(0.1, 100, cubeRenderTarget);
  /*
   * We can use `Layers` to restrict what a camera can render within a scene. In
   * this case, we only want our `CubeCamera` instance to render the
   * environment map and the `ringLight` mesh.
   */
  cubeCamera.layers.set(1);

  scene.environment = cubeRenderTarget.texture;
  /*
   * For simpler environment map environments (e.g. non real-time environments)
   * we can simply just set the `scene.environment` to the `DataTexture`,
   * `CubeTexture`, or `Texture` instance directly.
   */
  /* scene.environment = textures.environmentMapSkyBoxCabin; */

  scene.backgroundBlurriness = 0;
  scene.backgroundIntensity = 1;
  scene.environmentIntensity = 1;

  const camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(10, 5, 10);

  const torusKnot = new Mesh(
    new TorusKnotGeometry(1, 0.4, 100, 16),
    new MeshStandardMaterial({
      color: 0xaa_aa_aa,
      metalness: 1,
      roughness: 0,
    })
  );
  torusKnot.position.set(-4, 4, 0);

  const ringLight = new Mesh(
    new TorusGeometry(8, 0.5),
    new MeshBasicMaterial({
      /* color: 0xff_ff_ff, */
      /*
       * You can use non-normalized values for the `r`, `g`, and `b` arguments
       * for the `Color` class's constructor. This seems to allow some sort of
       * "over" saturation of a color.
       *
       * In our case, we want to render a white light with a yellow / orange
       * tinge.
       */
      color: new Color(10, 4, 2),
    })
  );
  ringLight.layers.enable(1);
  ringLight.position.set(0, 3.5, 0);

  const flightHelmetModel = models.flightHelmet;

  const flightHelmet = new Group();
  flightHelmet.add(flightHelmetModel.scene);
  flightHelmet.scale.multiplyScalar(10);

  scene.add(camera, flightHelmet, ringLight, torusKnot);

  return { camera, cubeCamera, ringLight, scene };
}

function animate(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: Camera,
  onFrame?: (elapsedTime: number, deltaTime: number) => void
) {
  const timer = new Timer();

  let prevElapsedTime = 0;

  const tick = () => {
    timer.update();
    const elapsedTime = timer.getElapsed();
    const deltaTime = elapsedTime - prevElapsedTime;
    prevElapsedTime = elapsedTime;
    onFrame?.(elapsedTime, deltaTime);
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  };

  tick();
}

function setupPanelControllers(gui: GUI, scene: Scene) {
  const folderBackground = gui.addFolder('Background');
  const folderBackgroundRotation = folderBackground.addFolder('Rotation');

  const folderEnvironment = gui.addFolder('Environment');
  const folderEnvironmentRotation = folderEnvironment.addFolder('Rotation');

  const controls = {
    background: {
      blurriness: scene.backgroundBlurriness,
      intensity: scene.backgroundIntensity,
      rotation: scene.backgroundRotation.clone(),
    },
    environment: {
      intensity: scene.environmentIntensity,
      rotation: scene.environmentRotation,
    },
  };

  const controllers = {
    background: {
      blurriness: folderBackground
        .add(controls.background, 'blurriness')
        .max(1)
        .min(0)
        .name('Blurriness')
        .step(0.001),
      intensity: folderBackground
        .add(controls.background, 'intensity')
        .max(10)
        .min(0)
        .name('Intensity')
        .step(0.001),
      rotation: {
        x: folderBackgroundRotation
          .add(controls.background.rotation, 'x')
          .max(Math.PI * 2)
          .min(-Math.PI * 2)
          .step(0.001),
        y: folderBackgroundRotation
          .add(controls.background.rotation, 'y')
          .max(Math.PI * 2)
          .min(-Math.PI * 2)
          .step(0.001),
        z: folderBackgroundRotation
          .add(controls.background.rotation, 'z')
          .max(Math.PI * 2)
          .min(-Math.PI * 2)
          .step(0.001),
      },
    },
    environment: {
      intensity: folderEnvironment
        .add(controls.environment, 'intensity')
        .max(10)
        .min(0)
        .name('Intensity')
        .step(0.001),
      rotation: {
        x: folderEnvironmentRotation
          .add(controls.environment.rotation, 'x')
          .max(Math.PI * 2)
          .min(-Math.PI * 2)
          .step(0.001),
        y: folderEnvironmentRotation
          .add(controls.environment.rotation, 'y')
          .max(Math.PI * 2)
          .min(-Math.PI * 2)
          .step(0.001),
        z: folderEnvironmentRotation
          .add(controls.environment.rotation, 'z')
          .max(Math.PI * 2)
          .min(-Math.PI * 2)
          .step(0.001),
      },
    },
  };

  controllers.background.blurriness.onChange((value: number) => {
    scene.backgroundBlurriness = value;
  });
  controllers.background.intensity.onChange((value: number) => {
    scene.backgroundIntensity = value;
  });

  const handleBackgroundRotationChange = () => {
    scene.backgroundRotation.set(
      controls.background.rotation.x,
      controls.background.rotation.y,
      controls.background.rotation.z
    );
  };

  controllers.background.rotation.x.onChange(handleBackgroundRotationChange);
  controllers.background.rotation.y.onChange(handleBackgroundRotationChange);
  controllers.background.rotation.z.onChange(handleBackgroundRotationChange);

  controllers.environment.intensity.onChange((value: number) => {
    scene.environmentIntensity = value;
  });

  const handleEnvironmentRotationChange = () => {
    scene.environmentRotation.set(
      controls.environment.rotation.x,
      controls.environment.rotation.y,
      controls.environment.rotation.z
    );
  };

  controllers.environment.rotation.x.onChange(handleEnvironmentRotationChange);
  controllers.environment.rotation.y.onChange(handleEnvironmentRotationChange);
  controllers.environment.rotation.z.onChange(handleEnvironmentRotationChange);

  return () => {
    folderBackground.destroy();
    folderEnvironment.destroy();
  };
}

export async function run() {
  const gui = createControlsPanel({ hide: true });
  const canvas = setupCanvas();
  const renderer = setupRenderer(canvas);

  const models = await loadModels();
  const textures = await loadTextures();

  const { camera, cubeCamera, ringLight, scene } = setupScene(models, textures);

  setupPanelControllers(gui, scene);

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

  const orbitControls = new OrbitControls(camera, canvas);
  orbitControls.maxPolarAngle = 1.4;
  orbitControls.target.y = 3.5;

  animate(renderer, scene, camera, (elapsedTime) => {
    ringLight.rotation.set(Math.sin(elapsedTime) * 2, 0, 0);
    cubeCamera.update(renderer, scene);

    orbitControls.update();
  });
}
