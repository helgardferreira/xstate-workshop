import { GUI } from 'lil-gui';
import { forkJoin, lastValueFrom } from 'rxjs';
import {
  AmbientLight,
  BackSide,
  Camera,
  Clock,
  Color,
  type ColorRepresentation,
  DataTexture,
  DoubleSide,
  EquirectangularReflectionMapping,
  FrontSide,
  Group,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshDepthMaterial,
  MeshLambertMaterial,
  MeshMatcapMaterial,
  MeshNormalMaterial,
  MeshPhongMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  MeshToonMaterial,
  NearestFilter,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  PointLightHelper,
  SRGBColorSpace,
  Scene,
  SphereGeometry,
  Texture,
  TorusGeometry,
  WebGLRenderer,
} from 'three';
import { HDRLoader } from 'three/addons';
import { OrbitControls } from 'three-stdlib';

import { clamp, html } from '@xstate-workshop/utils';

import {
  createControlsPanel,
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
  doorAlpha: Texture<HTMLImageElement>;
  doorAmbientOcclusion: Texture<HTMLImageElement>;
  doorColor: Texture<HTMLImageElement>;
  doorHeight: Texture<HTMLImageElement>;
  doorMetalness: Texture<HTMLImageElement>;
  doorNormal: Texture<HTMLImageElement>;
  doorRoughness: Texture<HTMLImageElement>;
  environmentMap: DataTexture;
  gradient3: Texture<HTMLImageElement>;
  gradient5: Texture<HTMLImageElement>;
  matcap1: Texture<HTMLImageElement>;
  matcap2: Texture<HTMLImageElement>;
  matcap3: Texture<HTMLImageElement>;
  matcap4: Texture<HTMLImageElement>;
  matcap5: Texture<HTMLImageElement>;
  matcap6: Texture<HTMLImageElement>;
  matcap7: Texture<HTMLImageElement>;
  matcap8: Texture<HTMLImageElement>;
};

/**
 * This is an example of one possible approach for instantiating, and loading,
 * `three.js` textures without the use of a `TextureLoader` instance.
 */
function loadTextures(): Promise<Textures> {
  const hdrLoader = new HDRLoader();

  return lastValueFrom(
    forkJoin({
      doorAlpha: fromTexture(getTextureUrl('door', 'alpha')),
      doorAmbientOcclusion: fromTexture(
        getTextureUrl('door', 'ambient-occlusion')
      ),
      doorColor: fromTexture(getTextureUrl('door', 'color')),
      doorHeight: fromTexture(getTextureUrl('door', 'height')),
      doorMetalness: fromTexture(getTextureUrl('door', 'metalness')),
      doorNormal: fromTexture(getTextureUrl('door', 'normal')),
      doorRoughness: fromTexture(getTextureUrl('door', 'roughness')),
      environmentMap: hdrLoader.loadAsync(
        getTextureUrl('environment-map', ['1', '2k'])
      ),
      gradient3: fromTexture(getTextureUrl('gradients', '3')),
      gradient5: fromTexture(getTextureUrl('gradients', '5')),
      matcap1: fromTexture(getTextureUrl('matcaps', '1')),
      matcap2: fromTexture(getTextureUrl('matcaps', '2')),
      matcap3: fromTexture(getTextureUrl('matcaps', '3')),
      matcap4: fromTexture(getTextureUrl('matcaps', '4')),
      matcap5: fromTexture(getTextureUrl('matcaps', '5')),
      matcap6: fromTexture(getTextureUrl('matcaps', '6')),
      matcap7: fromTexture(getTextureUrl('matcaps', '7')),
      matcap8: fromTexture(getTextureUrl('matcaps', '8')),
    })
  );
}

type CreateBasicMaterialOptions = {
  alphaMap?: Texture;
  color?: ColorRepresentation;
  map?: Texture;
  opacity?: number;
  side?: typeof BackSide | typeof DoubleSide | typeof FrontSide;
  wireframe?: boolean;
};

export function createBasicMaterial(
  options: CreateBasicMaterialOptions = {}
): MeshBasicMaterial {
  const material = new MeshBasicMaterial();

  /*
   * The `color` property can be used to modify the albedo value of the
   * material uniformly.
   */
  if (options.color !== undefined) {
    material.color = new Color(options.color);
  }
  /*
   * The `map` property can be used to modify the albedo value of the
   * material for specific fragments on the geometry depending on the provided
   * `Texture` instance.
   */
  if (options.map !== undefined) {
    material.map = options.map;
  }

  /*
   * The `alphaMap` property can be used to modify the alpha value of the
   * material for specific fragments on the geometry depending on the provided
   * `Texture` instance.
   */
  if (options.alphaMap !== undefined) {
    material.alphaMap = options.alphaMap;
    material.transparent = true;
  }
  /*
   * The `opacity` property can be used to modify the alpha value of the
   * material uniformly.
   */
  if (options.opacity !== undefined) {
    material.opacity = 0.5;
    material.transparent = true;
  }

  /*
   * The `side` property can be used to define which side of the material's
   * faces will be rendered:
   * - front - `FrontSide` (default)
   * - back - `BackSide`
   * - both - `DoubleSide`
   */
  if (options.side !== undefined) {
    material.side = options.side;
  }

  /*
   * The `wireframe` property will render the material as a wireframe.
   */
  if (options.wireframe !== undefined) {
    material.wireframe = options.wireframe;
  }

  return material;
}

type CreateDepthMaterialOptions = {
  alphaMap?: Texture;
  map?: Texture;
  opacity?: number;
  side?: typeof BackSide | typeof DoubleSide | typeof FrontSide;
  wireframe?: boolean;
};

export function createDepthMaterial(
  options: CreateDepthMaterialOptions = {}
): MeshDepthMaterial {
  const material = new MeshDepthMaterial();

  /*
   * The `map` property can be used to modify the albedo value of the
   * material for specific fragments on the geometry depending on the provided
   * `Texture` instance.
   */
  if (options.map !== undefined) {
    material.map = options.map;
  }

  /*
   * The `alphaMap` property can be used to modify the alpha value of the
   * material for specific fragments on the geometry depending on the provided
   * `Texture` instance.
   */
  if (options.alphaMap !== undefined) {
    material.alphaMap = options.alphaMap;
    material.transparent = true;
  }
  /*
   * The `opacity` property can be used to modify the alpha value of the
   * material uniformly.
   */
  if (options.opacity !== undefined) {
    material.opacity = 0.5;
    material.transparent = true;
  }

  /*
   * The `side` property can be used to define which side of the material's
   * faces will be rendered:
   * - front - `FrontSide` (default)
   * - back - `BackSide`
   * - both - `DoubleSide`
   */
  if (options.side !== undefined) {
    material.side = options.side;
  }

  /*
   * The `wireframe` property will render the material as a wireframe.
   */
  if (options.wireframe !== undefined) {
    material.wireframe = options.wireframe;
  }

  return material;
}

type CreateLambertMaterialOptions = {
  alphaMap?: Texture;
  color?: ColorRepresentation;
  map?: Texture;
  opacity?: number;
  side?: typeof BackSide | typeof DoubleSide | typeof FrontSide;
  wireframe?: boolean;
};

export function createLambertMaterial(
  options: CreateLambertMaterialOptions = {}
): MeshLambertMaterial {
  const material = new MeshLambertMaterial();

  /*
   * The `color` property can be used to modify the albedo value of the
   * material uniformly.
   */
  if (options.color !== undefined) {
    material.color = new Color(options.color);
  }
  /*
   * The `map` property can be used to modify the albedo value of the
   * material for specific fragments on the geometry depending on the provided
   * `Texture` instance.
   */
  if (options.map !== undefined) {
    material.map = options.map;
  }

  /*
   * The `alphaMap` property can be used to modify the alpha value of the
   * material for specific fragments on the geometry depending on the provided
   * `Texture` instance.
   */
  if (options.alphaMap !== undefined) {
    material.alphaMap = options.alphaMap;
    material.transparent = true;
  }
  /*
   * The `opacity` property can be used to modify the alpha value of the
   * material uniformly.
   */
  if (options.opacity !== undefined) {
    material.opacity = 0.5;
    material.transparent = true;
  }

  /*
   * The `side` property can be used to define which side of the material's
   * faces will be rendered:
   * - front - `FrontSide` (default)
   * - back - `BackSide`
   * - both - `DoubleSide`
   */
  if (options.side !== undefined) {
    material.side = options.side;
  }

  /*
   * The `wireframe` property will render the material as a wireframe.
   */
  if (options.wireframe !== undefined) {
    material.wireframe = options.wireframe;
  }

  return material;
}

type CreateMatcapMaterialOptions = {
  alphaMap?: Texture;
  color?: ColorRepresentation;
  map?: Texture;
  matcap?: Texture;
  opacity?: number;
  side?: typeof BackSide | typeof DoubleSide | typeof FrontSide;
  wireframe?: boolean;
};

/**
 * The `MeshMatcapMaterial` is defined by a MatCap (or Lit Sphere) texture,
 * which encodes the material color and shading.
 *
 * This material does not respond to lights since the matcap image file encodes
 * baked lighting. It will cast a shadow onto an object that receives shadows
 * (and shadow clipping works), but it will not self-shadow or receive shadows.
 */
export function createMatcapMaterial(
  options: CreateMatcapMaterialOptions = {}
): MeshMatcapMaterial {
  const material = new MeshMatcapMaterial();

  /*
   * The `color` property can be used to modify the albedo value of the
   * material uniformly.
   */
  if (options.color !== undefined) {
    material.color = new Color(options.color);
  }
  /*
   * The `map` property can be used to modify the albedo value of the
   * material for specific fragments on the geometry depending on the provided
   * `Texture` instance.
   */
  if (options.map !== undefined) {
    material.map = options.map;
  }

  /*
   * The `matcap` property can be used to set the "MatCap" (or Lit Sphere)
   * texture for the material which encodes the material color and shading.
   */
  if (options.matcap !== undefined) {
    material.matcap = options.matcap;
  }

  /*
   * The `alphaMap` property can be used to modify the alpha value of the
   * material for specific fragments on the geometry depending on the provided
   * `Texture` instance.
   */
  if (options.alphaMap !== undefined) {
    material.alphaMap = options.alphaMap;
    material.transparent = true;
  }
  /*
   * The `opacity` property can be used to modify the alpha value of the
   * material uniformly.
   */
  if (options.opacity !== undefined) {
    material.opacity = 0.5;
    material.transparent = true;
  }

  /*
   * The `side` property can be used to define which side of the material's
   * faces will be rendered:
   * - front - `FrontSide` (default)
   * - back - `BackSide`
   * - both - `DoubleSide`
   */
  if (options.side !== undefined) {
    material.side = options.side;
  }

  /*
   * The `wireframe` property will render the material as a wireframe.
   */
  if (options.wireframe !== undefined) {
    material.wireframe = options.wireframe;
  }

  return material;
}

type CreateNormalMaterialOptions = {
  flatShading?: boolean;
  opacity?: number;
  side?: typeof BackSide | typeof DoubleSide | typeof FrontSide;
  wireframe?: boolean;
};

/**
 * Normals are information encoded in each vertex that contains the direction of
 * the outside of the face. If you displayed those normals as arrows, you would
 * get straight lines coming out of each vertex that compose your geometry.
 */
export function createNormalMaterial(
  options: CreateNormalMaterialOptions = {}
): MeshNormalMaterial {
  const material = new MeshNormalMaterial();

  /*
   * The `flatShading` property can be used to control whether the material
   * is rendered with "flat shading" or not.
   */
  if (options.flatShading !== undefined) {
    material.flatShading = options.flatShading;
  }

  /*
   * The `opacity` property can be used to modify the alpha value of the
   * material uniformly.
   */
  if (options.opacity !== undefined) {
    material.opacity = 0.5;
    material.transparent = true;
  }

  /*
   * The `side` property can be used to define which side of the material's
   * faces will be rendered:
   * - front - `FrontSide` (default)
   * - back - `BackSide`
   * - both - `DoubleSide`
   */
  if (options.side !== undefined) {
    material.side = options.side;
  }

  /*
   * The `wireframe` property will render the material as a wireframe.
   */
  if (options.wireframe !== undefined) {
    material.wireframe = options.wireframe;
  }

  return material;
}

type CreatePhongMaterialOptions = {
  alphaMap?: Texture;
  color?: ColorRepresentation;
  map?: Texture;
  opacity?: number;
  shininess?: number;
  side?: typeof BackSide | typeof DoubleSide | typeof FrontSide;
  specular?: ColorRepresentation;
  wireframe?: boolean;
};

export function createPhongMaterial(
  options: CreatePhongMaterialOptions = {}
): MeshPhongMaterial {
  const material = new MeshPhongMaterial();

  /*
   * The `color` property can be used to modify the albedo value of the
   * material uniformly.
   */
  if (options.color !== undefined) {
    material.color = new Color(options.color);
  }
  /*
   * The `map` property can be used to modify the albedo value of the
   * material for specific fragments on the geometry depending on the provided
   * `Texture` instance.
   */
  if (options.map !== undefined) {
    material.map = options.map;
  }

  /*
   * The `alphaMap` property can be used to modify the alpha value of the
   * material for specific fragments on the geometry depending on the provided
   * `Texture` instance.
   */
  if (options.alphaMap !== undefined) {
    material.alphaMap = options.alphaMap;
    material.transparent = true;
  }
  /*
   * The `opacity` property can be used to modify the alpha value of the
   * material uniformly.
   */
  if (options.opacity !== undefined) {
    material.opacity = 0.5;
    material.transparent = true;
  }

  if (options.shininess !== undefined) {
    material.shininess = options.shininess;
  }

  /*
   * The `side` property can be used to define which side of the material's
   * faces will be rendered:
   * - front - `FrontSide` (default)
   * - back - `BackSide`
   * - both - `DoubleSide`
   */
  if (options.side !== undefined) {
    material.side = options.side;
  }

  if (options.specular !== undefined) {
    material.specular = new Color(options.specular);
  }

  /*
   * The `wireframe` property will render the material as a wireframe.
   */
  if (options.wireframe !== undefined) {
    material.wireframe = options.wireframe;
  }

  return material;
}

type CreatePhysicalMaterialOptions = {
  alphaMap?: Texture;
  aoMap?: Texture;
  aoMapIntensity?: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  color?: ColorRepresentation;
  displacementMap?: Texture;
  displacementScale?: number;
  ior?: number;
  iridescence?: number;
  iridescenceIOR?: number;
  iridescenceThicknessRange?: [number, number];
  map?: Texture;
  metalness?: number;
  metalnessMap?: Texture;
  normalMap?: Texture;
  normalScale?: [number, number];
  opacity?: number;
  roughness?: number;
  roughnessMap?: Texture;
  sheen?: number;
  sheenColor?: ColorRepresentation;
  sheenRoughness?: number;
  side?: typeof BackSide | typeof DoubleSide | typeof FrontSide;
  thickness?: number;
  transmission?: number;
  wireframe?: boolean;
};

export function createPhysicalMaterial(
  options: CreatePhysicalMaterialOptions = {}
): MeshPhysicalMaterial {
  const material = new MeshPhysicalMaterial();

  if (options.aoMap !== undefined) {
    material.aoMap = options.aoMap;
  }
  if (options.aoMapIntensity !== undefined) {
    material.aoMapIntensity = options.aoMapIntensity;
  }

  if (options.clearcoat !== undefined) {
    material.clearcoat = options.clearcoat;
  }
  if (options.clearcoatRoughness !== undefined) {
    material.clearcoatRoughness = options.clearcoatRoughness;
  }

  /*
   * The `color` property can be used to modify the albedo value of the
   * material uniformly.
   */
  if (options.color !== undefined) {
    material.color = new Color(options.color);
  }
  /*
   * The `map` property can be used to modify the albedo value of the
   * material for specific fragments on the geometry depending on the provided
   * `Texture` instance.
   */
  if (options.map !== undefined) {
    material.map = options.map;
  }

  if (options.displacementMap !== undefined) {
    material.displacementMap = options.displacementMap;
  }
  if (options.displacementScale !== undefined) {
    material.displacementScale = options.displacementScale;
  }

  if (options.ior !== undefined) {
    material.ior = options.ior;
  }

  if (options.iridescence !== undefined) {
    material.iridescence = options.iridescence;
  }
  if (options.iridescenceIOR !== undefined) {
    material.iridescenceIOR = options.iridescenceIOR;
  }
  if (options.iridescenceThicknessRange !== undefined) {
    material.iridescenceThicknessRange = options.iridescenceThicknessRange;
  }

  if (options.metalness !== undefined) {
    material.metalness = options.metalness;
  }
  if (options.metalnessMap !== undefined) {
    material.metalnessMap = options.metalnessMap;
  }

  if (options.normalMap !== undefined) {
    material.normalMap = options.normalMap;
  }
  if (options.normalScale !== undefined) {
    material.normalScale.set(options.normalScale[0], options.normalScale[1]);
  }

  /*
   * The `alphaMap` property can be used to modify the alpha value of the
   * material for specific fragments on the geometry depending on the provided
   * `Texture` instance.
   */
  if (options.alphaMap !== undefined) {
    material.alphaMap = options.alphaMap;
    material.transparent = true;
  }
  /*
   * The `opacity` property can be used to modify the alpha value of the
   * material uniformly.
   */
  if (options.opacity !== undefined) {
    material.opacity = 0.5;
    material.transparent = true;
  }

  if (options.roughness !== undefined) {
    material.roughness = options.roughness;
  }
  if (options.roughnessMap !== undefined) {
    material.roughnessMap = options.roughnessMap;
  }

  if (options.sheen !== undefined) {
    material.sheen = options.sheen;
  }
  if (options.sheenColor !== undefined) {
    material.sheenColor = new Color(options.sheenColor);
  }
  if (options.sheenRoughness !== undefined) {
    material.sheenRoughness = options.sheenRoughness;
  }

  /*
   * The `side` property can be used to define which side of the material's
   * faces will be rendered:
   * - front - `FrontSide` (default)
   * - back - `BackSide`
   * - both - `DoubleSide`
   */
  if (options.side !== undefined) {
    material.side = options.side;
  }

  if (options.thickness !== undefined) {
    material.thickness = options.thickness;
  }

  if (options.transmission !== undefined) {
    material.transmission = options.transmission;
  }

  /*
   * The `wireframe` property will render the material as a wireframe.
   */
  if (options.wireframe !== undefined) {
    material.wireframe = options.wireframe;
  }

  return material;
}

type CreateStandardMaterialOptions = {
  alphaMap?: Texture;
  aoMap?: Texture;
  aoMapIntensity?: number;
  color?: ColorRepresentation;
  displacementMap?: Texture;
  displacementScale?: number;
  map?: Texture;
  metalness?: number;
  metalnessMap?: Texture;
  normalMap?: Texture;
  normalScale?: [number, number];
  opacity?: number;
  roughness?: number;
  roughnessMap?: Texture;
  side?: typeof BackSide | typeof DoubleSide | typeof FrontSide;
  wireframe?: boolean;
};

export function createStandardMaterial(
  options: CreateStandardMaterialOptions = {}
): MeshStandardMaterial {
  const material = new MeshStandardMaterial();

  if (options.aoMap !== undefined) {
    material.aoMap = options.aoMap;
  }
  if (options.aoMapIntensity !== undefined) {
    material.aoMapIntensity = options.aoMapIntensity;
  }

  /*
   * The `color` property can be used to modify the albedo value of the
   * material uniformly.
   */
  if (options.color !== undefined) {
    material.color = new Color(options.color);
  }
  /*
   * The `map` property can be used to modify the albedo value of the
   * material for specific fragments on the geometry depending on the provided
   * `Texture` instance.
   */
  if (options.map !== undefined) {
    material.map = options.map;
  }

  if (options.displacementMap !== undefined) {
    material.displacementMap = options.displacementMap;
  }
  if (options.displacementScale !== undefined) {
    material.displacementScale = options.displacementScale;
  }

  if (options.metalness !== undefined) {
    material.metalness = options.metalness;
  }
  if (options.metalnessMap !== undefined) {
    material.metalnessMap = options.metalnessMap;
  }

  if (options.normalMap !== undefined) {
    material.normalMap = options.normalMap;
  }
  if (options.normalScale !== undefined) {
    material.normalScale.set(options.normalScale[0], options.normalScale[1]);
  }

  /*
   * The `alphaMap` property can be used to modify the alpha value of the
   * material for specific fragments on the geometry depending on the provided
   * `Texture` instance.
   */
  if (options.alphaMap !== undefined) {
    material.alphaMap = options.alphaMap;
    material.transparent = true;
  }
  /*
   * The `opacity` property can be used to modify the alpha value of the
   * material uniformly.
   */
  if (options.opacity !== undefined) {
    material.opacity = 0.5;
    material.transparent = true;
  }

  if (options.roughness !== undefined) {
    material.roughness = options.roughness;
  }
  if (options.roughnessMap !== undefined) {
    material.roughnessMap = options.roughnessMap;
  }

  /*
   * The `side` property can be used to define which side of the material's
   * faces will be rendered:
   * - front - `FrontSide` (default)
   * - back - `BackSide`
   * - both - `DoubleSide`
   */
  if (options.side !== undefined) {
    material.side = options.side;
  }

  /*
   * The `wireframe` property will render the material as a wireframe.
   */
  if (options.wireframe !== undefined) {
    material.wireframe = options.wireframe;
  }

  return material;
}

type CreateToonMaterialOptions = {
  alphaMap?: Texture;
  color?: ColorRepresentation;
  gradientMap?: Texture;
  map?: Texture;
  opacity?: number;
  side?: typeof BackSide | typeof DoubleSide | typeof FrontSide;
  wireframe?: boolean;
};

export function createToonMaterial(
  options: CreateToonMaterialOptions = {}
): MeshToonMaterial {
  const material = new MeshToonMaterial();

  /*
   * The `color` property can be used to modify the albedo value of the
   * material uniformly.
   */
  if (options.color !== undefined) {
    material.color = new Color(options.color);
  }
  /*
   * The `map` property can be used to modify the albedo value of the
   * material for specific fragments on the geometry depending on the provided
   * `Texture` instance.
   */
  if (options.map !== undefined) {
    material.map = options.map;
  }

  if (options.gradientMap !== undefined) {
    material.gradientMap = options.gradientMap;
  }

  /*
   * The `alphaMap` property can be used to modify the alpha value of the
   * material for specific fragments on the geometry depending on the provided
   * `Texture` instance.
   */
  if (options.alphaMap !== undefined) {
    material.alphaMap = options.alphaMap;
    material.transparent = true;
  }
  /*
   * The `opacity` property can be used to modify the alpha value of the
   * material uniformly.
   */
  if (options.opacity !== undefined) {
    material.opacity = 0.5;
    material.transparent = true;
  }

  /*
   * The `side` property can be used to define which side of the material's
   * faces will be rendered:
   * - front - `FrontSide` (default)
   * - back - `BackSide`
   * - both - `DoubleSide`
   */
  if (options.side !== undefined) {
    material.side = options.side;
  }

  /*
   * The `wireframe` property will render the material as a wireframe.
   */
  if (options.wireframe !== undefined) {
    material.wireframe = options.wireframe;
  }

  return material;
}

function createLights() {
  const ambientLight = new AmbientLight();
  ambientLight.visible = false;

  const pointLightGroup = new Group();
  pointLightGroup.visible = false;

  const pointLight = new PointLight(0x00_88_ff, 10);
  pointLight.visible = false;

  const pointLightHelper = new PointLightHelper(pointLight);

  pointLightGroup.add(pointLight, pointLightHelper);
  pointLightGroup.position.set(0, 1.5, 1.5);

  return { ambientLight, pointLight, pointLightGroup };
}

export function setupScene(textures: Textures) {
  const scene = new Scene();

  textures.doorColor.colorSpace = SRGBColorSpace;
  textures.environmentMap.mapping = EquirectangularReflectionMapping;
  textures.gradient3.generateMipmaps = false;
  textures.gradient3.magFilter = NearestFilter;
  textures.gradient3.minFilter = NearestFilter;
  textures.gradient5.generateMipmaps = false;
  textures.gradient5.magFilter = NearestFilter;
  textures.gradient5.minFilter = NearestFilter;
  textures.matcap1.colorSpace = SRGBColorSpace;
  textures.matcap2.colorSpace = SRGBColorSpace;
  textures.matcap3.colorSpace = SRGBColorSpace;
  textures.matcap4.colorSpace = SRGBColorSpace;
  textures.matcap5.colorSpace = SRGBColorSpace;
  textures.matcap6.colorSpace = SRGBColorSpace;
  textures.matcap7.colorSpace = SRGBColorSpace;
  textures.matcap8.colorSpace = SRGBColorSpace;

  /*
  const material = createBasicMaterial({
    alphaMap: textures.doorAlpha,
    map: textures.doorColor,
    side: DoubleSide,
  });

  const material = createNormalMaterial({
    flatShading: true,
    side: DoubleSide,
  });

  const material = createMatcapMaterial({
    matcap: textures.matcap4,
    side: DoubleSide,
  });

  const material = createDepthMaterial({
    side: DoubleSide,
  });

  const material = createLambertMaterial({
    map: textures.doorColor,
    side: DoubleSide,
  });

  const material = createPhongMaterial({
    shininess: 100,
    side: DoubleSide,
    specular: 0x00_88_ff,
  });

  const material = createToonMaterial({
    side: DoubleSide,
    gradientMap: textures.gradient3,
  });

  const material = createStandardMaterial({
    alphaMap: textures.doorAlpha,
    aoMap: textures.doorAmbientOcclusion,
    aoMapIntensity: 1,
    displacementMap: textures.doorHeight,
    displacementScale: 0.03,
    map: textures.doorColor,
    metalness: 1,
    metalnessMap: textures.doorMetalness,
    normalMap: textures.doorNormal,
    normalScale: [0.5, 0.5],
    roughness: 1,
    roughnessMap: textures.doorRoughness,
    side: DoubleSide,
  });
  */

  const material = createPhysicalMaterial({
    alphaMap: textures.doorAlpha,
    aoMap: textures.doorAmbientOcclusion,
    aoMapIntensity: 1,
    displacementMap: textures.doorHeight,
    displacementScale: 0.03,
    map: textures.doorColor,
    metalness: 1,
    metalnessMap: textures.doorMetalness,
    normalMap: textures.doorNormal,
    normalScale: [0.5, 0.5],
    roughness: 1,
    roughnessMap: textures.doorRoughness,
    /*
    clearcoat: 1,
    clearcoatRoughness: 0,
    */
    /*
    sheen: 1,
    sheenRoughness: 0.25,
    sheenColor: 0xff_ff_ff,
    */
    /*
    iridescence: 1,
    iridescenceIOR: 1,
    iridescenceThicknessRange: [100, 800],
    */

    /*
    metalness: 0,
    roughness: 0,
    ior: 1.5,
    thickness: 0.5,
    transmission: 1,
    */
  });

  const sphereGeometry = new SphereGeometry(0.5, 64, 64);
  const sphere = new Mesh(sphereGeometry, material);
  sphere.position.set(-1.5, 0, 0);

  const planeGeometry = new PlaneGeometry(1, 1, 100, 100);
  const plane = new Mesh(planeGeometry, material);
  plane.position.set(0, 0, 0);

  const torusGeometry = new TorusGeometry(0.3, 0.2, 64, 128);
  const torus = new Mesh(torusGeometry, material);
  torus.position.set(1.5, 0, 0);

  const { ambientLight, pointLight, pointLightGroup } = createLights();

  const camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  camera.position.set(3, 0, 3);

  scene.add(ambientLight, camera, plane, pointLightGroup, sphere, torus);
  scene.background = textures.environmentMap;
  scene.environment = textures.environmentMap;

  return {
    ambientLight,
    camera,
    material,
    plane,
    pointLight,
    pointLightGroup,
    scene,
    sphere,
    torus,
  };
}

export function animate(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: Camera,
  plane: Mesh<PlaneGeometry, Material>,
  sphere: Mesh<SphereGeometry, Material>,
  torus: Mesh<TorusGeometry, Material>,
  onFrame?: () => void
) {
  const clock = new Clock();

  const tick = () => {
    const elapsedTime = clock.getElapsedTime();

    plane.rotation.y = elapsedTime * 0.1;
    sphere.rotation.y = elapsedTime * 0.1;
    torus.rotation.y = elapsedTime * 0.1;

    plane.rotation.x = -elapsedTime * 0.15;
    sphere.rotation.x = -elapsedTime * 0.15;
    torus.rotation.x = -elapsedTime * 0.15;

    renderer.render(scene, camera);
    onFrame?.();
    requestAnimationFrame(tick);
  };

  tick();
}

export function setupLightControllers(
  gui: GUI,
  ambientLight: AmbientLight,
  pointLight: PointLight,
  pointLightGroup: Group
) {
  const folderLights = gui.addFolder('Lights').close();
  const folderAmbientLight = folderLights.addFolder('Ambient Light');
  const folderPointLight = folderLights.addFolder('Point Light');
  const folderPointLightPosition = folderPointLight.addFolder('Position');

  const controls = {
    ambientLight: {
      color: ambientLight.color.getHex(),
      intensity: ambientLight.intensity,
      visible: ambientLight.visible,
    },
    pointLight: {
      position: pointLightGroup.position.clone(),
      color: pointLight.color.getHex(),
      intensity: pointLight.intensity,
      distance: pointLight.distance,
      decay: pointLight.decay,
      visible: pointLight.visible,
    },
  };

  const controllers = {
    ambientLight: {
      color: folderAmbientLight
        .addColor(controls.ambientLight, 'color')
        .name('Color'),
      intensity: folderAmbientLight
        .add(controls.ambientLight, 'intensity')
        .max(3)
        .min(0)
        .name('Intensity')
        .step(0.01),
      visible: folderAmbientLight
        .add(controls.ambientLight, 'visible')
        .name('Visible'),
    },
    pointLight: {
      position: {
        x: folderPointLightPosition
          .add(controls.pointLight.position, 'x')
          .max(5)
          .min(-5)
          .step(0.1),
        y: folderPointLightPosition
          .add(controls.pointLight.position, 'y')
          .max(5)
          .min(-5)
          .step(0.1),
        z: folderPointLightPosition
          .add(controls.pointLight.position, 'z')
          .max(5)
          .min(-5)
          .step(0.1),
      },
      color: folderPointLight
        .addColor(controls.pointLight, 'color')
        .name('Color'),
      intensity: folderPointLight
        .add(controls.pointLight, 'intensity')
        .max(200)
        .min(0)
        .name('Intensity')
        .step(0.05),
      distance: folderPointLight
        .add(controls.pointLight, 'distance')
        .max(100)
        .min(0)
        .name('Distance')
        .step(0.05),
      decay: folderPointLight
        .add(controls.pointLight, 'decay')
        .max(10)
        .min(1)
        .name('Decay')
        .step(0.05),
      visible: folderPointLight
        .add(controls.pointLight, 'visible')
        .name('Visible'),
    },
  };

  function updatePosition() {
    pointLightGroup.position.set(
      controls.pointLight.position.x,
      controls.pointLight.position.y,
      controls.pointLight.position.z
    );
  }

  controllers.ambientLight.color.onChange((value: number) => {
    ambientLight.color.set(value);
  });
  controllers.ambientLight.intensity.onChange((value: number) => {
    ambientLight.intensity = value;
  });
  controllers.ambientLight.visible.onChange((value: boolean) => {
    ambientLight.visible = value;
  });
  controllers.pointLight.position.x.onChange(updatePosition);
  controllers.pointLight.position.y.onChange(updatePosition);
  controllers.pointLight.position.z.onChange(updatePosition);
  controllers.pointLight.color.onChange((value: number) => {
    pointLight.color.set(value);
  });
  controllers.pointLight.intensity.onChange((value: number) => {
    pointLight.intensity = value;
  });
  controllers.pointLight.distance.onChange((value: number) => {
    pointLight.distance = value;
  });
  controllers.pointLight.decay.onChange((value: number) => {
    pointLight.decay = value;
  });
  controllers.pointLight.visible.onChange((value: boolean) => {
    pointLight.visible = value;
    pointLightGroup.visible = value;
  });

  return () => {
    controllers.ambientLight.color.destroy();
    controllers.ambientLight.intensity.destroy();
    controllers.pointLight.color.destroy();
    controllers.pointLight.decay.destroy();
    controllers.pointLight.distance.destroy();
    controllers.pointLight.intensity.destroy();
    controllers.pointLight.position.x.destroy();
    controllers.pointLight.position.y.destroy();
    controllers.pointLight.position.z.destroy();
  };
}

export function setupStandardMaterialControllers(
  gui: GUI,
  material: MeshStandardMaterial
) {
  const folderMaterial = gui.addFolder('Material');

  const controls = {
    material: {
      metalness: material.metalness,
      roughness: material.roughness,
    },
  };

  const controllers = {
    material: {
      metalness: folderMaterial
        .add(controls.material, 'metalness')
        .max(1)
        .min(0)
        .name('Metalness')
        .step(0.05),
      roughness: folderMaterial
        .add(controls.material, 'roughness')
        .max(1)
        .min(0)
        .name('Roughness')
        .step(0.05),
    },
  };

  controllers.material.metalness.onChange((value: number) => {
    material.metalness = value;
  });
  controllers.material.roughness.onChange((value: number) => {
    material.roughness = value;
  });

  return () => {
    controllers.material.metalness.destroy();
    controllers.material.roughness.destroy();
  };
}

export function setupPhysicalMaterialControllers(
  gui: GUI,
  material: MeshPhysicalMaterial
) {
  const folderMaterial = gui.addFolder('Material');

  const controls = {
    material: {
      clearcoat: material.clearcoat,
      clearcoatRoughness: material.clearcoatRoughness,
      metalness: material.metalness,
      roughness: material.roughness,
      sheen: material.sheen,
      sheenColor: material.sheenColor.getHex(),
      sheenRoughness: material.sheenRoughness,
      iridescence: material.iridescence,
      iridescenceIOR: material.iridescenceIOR,
      iridescenceThicknessRange: [
        material.iridescenceThicknessRange[0],
        material.iridescenceThicknessRange[1],
      ] as const,
      ior: material.ior,
      thickness: material.thickness,
      transmission: material.transmission,
    },
  };

  const controllers = {
    material: {
      clearcoat: folderMaterial
        .add(controls.material, 'clearcoat')
        .max(1)
        .min(0)
        .name('Clearcoat')
        .step(0.001),
      clearcoatRoughness: folderMaterial
        .add(controls.material, 'clearcoatRoughness')
        .max(1)
        .min(0)
        .name('Clearcoat Roughness')
        .step(0.001),
      metalness: folderMaterial
        .add(controls.material, 'metalness')
        .max(1)
        .min(0)
        .name('Metalness')
        .step(0.001),
      roughness: folderMaterial
        .add(controls.material, 'roughness')
        .max(1)
        .min(0)
        .name('Roughness')
        .step(0.001),
      sheen: folderMaterial
        .add(controls.material, 'sheen')
        .max(1)
        .min(0)
        .name('Sheen')
        .step(0.001),
      sheenColor: folderMaterial
        .addColor(controls.material, 'sheenColor')
        .name('Sheen Color'),
      sheenRoughness: folderMaterial
        .add(controls.material, 'sheenRoughness')
        .max(1)
        .min(0)
        .name('Sheen Roughness')
        .step(0.001),
      iridescence: folderMaterial
        .add(controls.material, 'iridescence')
        .max(1)
        .min(0)
        .name('Iridescence')
        .step(0.001),
      iridescenceIOR: folderMaterial
        .add(controls.material, 'iridescenceIOR')
        .max(2.333)
        .min(1)
        .name('Iridescence Index of Refraction')
        .step(0.001),
      iridescenceThicknessRangeLower: folderMaterial
        .add(controls.material.iridescenceThicknessRange, '0')
        .max(1000)
        .min(1)
        .name('Iridescence Thickness Lower')
        .step(1),
      iridescenceThicknessRangeUpper: folderMaterial
        .add(controls.material.iridescenceThicknessRange, '1')
        .max(1000)
        .min(1)
        .name('Iridescence Thickness Upper')
        .step(1),
      ior: folderMaterial
        .add(controls.material, 'ior')
        .max(2.333)
        .min(1)
        .name('Index of Refraction')
        .step(0.001),
      thickness: folderMaterial
        .add(controls.material, 'thickness')
        .max(1)
        .min(0)
        .name('Thickness')
        .step(0.001),
      transmission: folderMaterial
        .add(controls.material, 'transmission')
        .max(1)
        .min(0)
        .name('Transmission')
        .step(0.001),
    },
  };

  controllers.material.clearcoat.onChange((value: number) => {
    material.clearcoat = value;
  });
  controllers.material.clearcoatRoughness.onChange((value: number) => {
    material.clearcoatRoughness = value;
  });
  controllers.material.metalness.onChange((value: number) => {
    material.metalness = value;
  });
  controllers.material.roughness.onChange((value: number) => {
    material.roughness = value;
  });
  controllers.material.sheen.onChange((value: number) => {
    material.sheen = value;
  });
  controllers.material.sheenColor.onChange((value: number) => {
    material.sheenColor.set(value);
  });
  controllers.material.sheenRoughness.onChange((value: number) => {
    material.sheenRoughness = value;
  });
  controllers.material.iridescence.onChange((value: number) => {
    material.iridescence = value;
  });
  controllers.material.iridescenceIOR.onChange((value: number) => {
    material.iridescenceIOR = value;
  });
  controllers.material.iridescenceThicknessRangeLower.onChange(
    (value: number) => {
      material.iridescenceThicknessRange[0] = value;
    }
  );
  controllers.material.iridescenceThicknessRangeUpper.onChange(
    (value: number) => {
      material.iridescenceThicknessRange[1] = value;
    }
  );
  controllers.material.ior.onChange((value: number) => {
    material.ior = value;
  });
  controllers.material.thickness.onChange((value: number) => {
    material.thickness = value;
  });
  controllers.material.transmission.onChange((value: number) => {
    material.transmission = value;
  });

  return () => {
    controllers.material.clearcoat.destroy();
    controllers.material.clearcoatRoughness.destroy();
    controllers.material.iridescence.destroy();
    controllers.material.iridescenceIOR.destroy();
    controllers.material.iridescenceThicknessRangeLower.destroy();
    controllers.material.iridescenceThicknessRangeUpper.destroy();
    controllers.material.metalness.destroy();
    controllers.material.roughness.destroy();
    controllers.material.sheen.destroy();
    controllers.material.sheenColor.destroy();
    controllers.material.sheenRoughness.destroy();
    controllers.material.ior.destroy();
    controllers.material.thickness.destroy();
    controllers.material.transmission.destroy();
  };
}

export async function run() {
  const gui = createControlsPanel({ hide: true, width: 400 });
  const canvas = setupCanvas();
  const renderer = setupRenderer(canvas);

  const textures = await loadTextures();

  const {
    ambientLight,
    camera,
    material,
    plane,
    pointLight,
    pointLightGroup,
    scene,
    sphere,
    torus,
  } = setupScene(textures);
  setupLightControllers(gui, ambientLight, pointLight, pointLightGroup);
  /*
  setupStandardMaterialControllers(gui, material);
  */
  setupPhysicalMaterialControllers(gui, material);

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

  animate(renderer, scene, camera, plane, sphere, torus, () =>
    controls.update()
  );
}
