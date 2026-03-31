import { forkJoin, lastValueFrom } from 'rxjs';
import { type GLTF, GLTFLoader } from 'three/addons';

import { getModelUrl } from './utils';

// TODO: refactor this to be derived from config array (or even JSON file)
type Models = {
  arrow: GLTF;
  arrowBasic: GLTF;
  boxLarge: GLTF;
  boxLong: GLTF;
  boxSmall: GLTF;
  boxWide: GLTF;
  conveyor: GLTF;
  conveyorBars: GLTF;
  conveyorBarsFence: GLTF;
  conveyorBarsHigh: GLTF;
  conveyorBarsSides: GLTF;
  conveyorBarsStripe: GLTF;
  conveyorBarsStripeFence: GLTF;
  conveyorBarsStripeHigh: GLTF;
  conveyorBarsStripeSide: GLTF;
  conveyorLong: GLTF;
  conveyorLongSides: GLTF;
  conveyorLongStripe: GLTF;
  conveyorLongStripeSides: GLTF;
  conveyorSides: GLTF;
  conveyorStripe: GLTF;
  conveyorStripeSides: GLTF;
  cover: GLTF;
  coverBar: GLTF;
  coverCorner: GLTF;
  coverHopper: GLTF;
  coverStripe: GLTF;
  coverStripeBar: GLTF;
  coverStripeCorner: GLTF;
  coverStripeHopper: GLTF;
  coverStripeTop: GLTF;
  coverStripeWindow: GLTF;
  coverTop: GLTF;
  coverWindow: GLTF;
  door: GLTF;
  doorWideClosed: GLTF;
  doorWideHalf: GLTF;
  doorWideOpen: GLTF;
  floor: GLTF;
  floorLarge: GLTF;
  robotArmA: GLTF;
  robotArmB: GLTF;
  scannerHigh: GLTF;
  scannerLow: GLTF;
  structureCornerInner: GLTF;
  structureCornerOuter: GLTF;
  structureDoorway: GLTF;
  structureDoorwayWide: GLTF;
  structureHigh: GLTF;
  structureMedium: GLTF;
  structureShort: GLTF;
  structureTall: GLTF;
  structureWall: GLTF;
  structureWindow: GLTF;
  structureWindowWide: GLTF;
  structureYellowHigh: GLTF;
  structureYellowMedium: GLTF;
  structureYellowShort: GLTF;
  structureYellowTall: GLTF;
  top: GLTF;
  topLarge: GLTF;
};

// TODO: refactor this to be derived from config array (or even JSON file)
export function loadModels(): Promise<Models> {
  const gltfLoader = new GLTFLoader();

  return lastValueFrom(
    forkJoin({
      arrow: gltfLoader.loadAsync(getModelUrl('conveyor-kit', 'arrow')),
      arrowBasic: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'arrow-basic')
      ),
      boxLarge: gltfLoader.loadAsync(getModelUrl('conveyor-kit', 'box-large')),
      boxLong: gltfLoader.loadAsync(getModelUrl('conveyor-kit', 'box-long')),
      boxSmall: gltfLoader.loadAsync(getModelUrl('conveyor-kit', 'box-small')),
      boxWide: gltfLoader.loadAsync(getModelUrl('conveyor-kit', 'box-wide')),
      conveyor: gltfLoader.loadAsync(getModelUrl('conveyor-kit', 'conveyor')),
      conveyorBars: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'conveyor-bars')
      ),
      conveyorBarsFence: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'conveyor-bars-fence')
      ),
      conveyorBarsHigh: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'conveyor-bars-high')
      ),
      conveyorBarsSides: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'conveyor-bars-sides')
      ),
      conveyorBarsStripe: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'conveyor-bars-stripe')
      ),
      conveyorBarsStripeFence: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'conveyor-bars-stripe-fence')
      ),
      conveyorBarsStripeHigh: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'conveyor-bars-stripe-high')
      ),
      conveyorBarsStripeSide: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'conveyor-bars-stripe-side')
      ),
      conveyorLong: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'conveyor-long')
      ),
      conveyorLongSides: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'conveyor-long-sides')
      ),
      conveyorLongStripe: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'conveyor-long-stripe')
      ),
      conveyorLongStripeSides: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'conveyor-long-stripe-sides')
      ),
      conveyorSides: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'conveyor-sides')
      ),
      conveyorStripe: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'conveyor-stripe')
      ),
      conveyorStripeSides: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'conveyor-stripe-sides')
      ),
      cover: gltfLoader.loadAsync(getModelUrl('conveyor-kit', 'cover')),
      coverBar: gltfLoader.loadAsync(getModelUrl('conveyor-kit', 'cover-bar')),
      coverCorner: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'cover-corner')
      ),
      coverHopper: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'cover-hopper')
      ),
      coverStripe: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'cover-stripe')
      ),
      coverStripeBar: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'cover-stripe-bar')
      ),
      coverStripeCorner: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'cover-stripe-corner')
      ),
      coverStripeHopper: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'cover-stripe-hopper')
      ),
      coverStripeTop: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'cover-stripe-top')
      ),
      coverStripeWindow: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'cover-stripe-window')
      ),
      coverTop: gltfLoader.loadAsync(getModelUrl('conveyor-kit', 'cover-top')),
      coverWindow: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'cover-window')
      ),
      door: gltfLoader.loadAsync(getModelUrl('conveyor-kit', 'door')),
      doorWideClosed: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'door-wide-closed')
      ),
      doorWideHalf: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'door-wide-half')
      ),
      doorWideOpen: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'door-wide-open')
      ),
      floor: gltfLoader.loadAsync(getModelUrl('conveyor-kit', 'floor')),
      floorLarge: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'floor-large')
      ),
      robotArmA: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'robot-arm-a')
      ),
      robotArmB: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'robot-arm-b')
      ),
      scannerHigh: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'scanner-high')
      ),
      scannerLow: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'scanner-low')
      ),
      structureCornerInner: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'structure-corner-inner')
      ),
      structureCornerOuter: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'structure-corner-outer')
      ),
      structureDoorway: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'structure-doorway')
      ),
      structureDoorwayWide: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'structure-doorway-wide')
      ),
      structureHigh: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'structure-high')
      ),
      structureMedium: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'structure-medium')
      ),
      structureShort: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'structure-short')
      ),
      structureTall: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'structure-tall')
      ),
      structureWall: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'structure-wall')
      ),
      structureWindow: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'structure-window')
      ),
      structureWindowWide: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'structure-window-wide')
      ),
      structureYellowHigh: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'structure-yellow-high')
      ),
      structureYellowMedium: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'structure-yellow-medium')
      ),
      structureYellowShort: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'structure-yellow-short')
      ),
      structureYellowTall: gltfLoader.loadAsync(
        getModelUrl('conveyor-kit', 'structure-yellow-tall')
      ),
      top: gltfLoader.loadAsync(getModelUrl('conveyor-kit', 'top')),
      topLarge: gltfLoader.loadAsync(getModelUrl('conveyor-kit', 'top-large')),
    })
  );
}
