import type { Subscription } from 'rxjs';
import { Scene, WebGLRenderer } from 'three';

import { clamp } from '@xstate-workshop/utils';

import { fromFrames, fromFullscreenKeyup, fromWindowResize } from '../utils';

import { type AppCamera, createAppCamera } from './create-app-camera';
import { createCanvas } from './create-canvas';
import { createRenderer } from './create-renderer';
import { type SceneAssets, loadSceneAssets } from './load-scene-assets';

// TODO: figure out conveyor scene composition (first start with just reproducing the conveyor kit's sample image)
// TODO: implement mechanism to quickly swap / route between scenes
//       - will make referencing preview scene much easier and will be needed for later setups
//       - maybe investigate xstate routes (https://stately.ai/docs/routes)?
export class WebGLApp {
  private appCamera: AppCamera;
  private canvas: HTMLCanvasElement;
  private renderer: WebGLRenderer;
  // TODO: figure out best data structure for easily swapping between multiple scenes
  private scene: Scene;
  private subscriptions: Subscription[] = [];

  constructor() {
    this.canvas = createCanvas('root');
    this.renderer = createRenderer(this.canvas);

    // TODO: create function / method for managing scenes
    //       - decide whether to move camera into scene management implementation or not
    this.scene = new Scene();
    this.appCamera = createAppCamera(this.scene, this.canvas);
    this.appCamera.camera.position.set(10, 10, 10);
    this.appCamera.controls.target.set(0, 0, 0);
  }

  private buildScene(assets: SceneAssets) {
    const { models: _models, textures } = assets;
    this.scene.background = textures.environmentMap;
    this.scene.environment = textures.environmentMap;

    // TODO: restore this and delegate to asset reference scene
    /*
    const modelsGridPreview = new ModelsGridPreview(
      Object.values(models).toSorted((a, b) =>
        a.scene.name.localeCompare(b.scene.name)
      ),
      {
        cellSize: 5,
        labelPlane: {
          font: { family: 'Roboto Mono' },
          offset: { x: 0, y: 4, z: 0 },
          size: 0.5,
        },
      }
    );
    this.scene.add(modelsGridPreview);
    */
  }

  private setupEvents() {
    // Animation loop
    this.subscriptions.push(
      fromFrames().subscribe(() => {
        this.renderer.render(this.scene, this.appCamera.camera);

        this.appCamera.update();
      })
    );

    // Update renderer size and pixel ratio when window resizes
    this.subscriptions.push(
      fromWindowResize().subscribe(({ height, width }) => {
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(clamp(window.devicePixelRatio, 1, 2));
      })
    );

    // Attach fullscreen keyboard shortcut event listener
    this.subscriptions.push(
      fromFullscreenKeyup().subscribe((shouldFullscreen) => {
        if (shouldFullscreen) this.canvas.requestFullscreen();
        else document.exitFullscreen();
      })
    );
  }

  public async run() {
    const assets = await loadSceneAssets();
    this.buildScene(assets);

    // TODO: figure out good workflow for positioning models in scene
    //       - use threejs `TransformControls` addon (then later build custom transform controls from scratch)
    //       - implement backend server to save changes made in scene to file for de-serialization in web app
    //       - figure out sophisticated debugging panel setup
    //       - maybe implement websockets for WebGLApp development?
    // TODO: continue here...
    ////// ---------------------------------------------------------------------

    ////// ---------------------------------------------------------------------

    this.setupEvents();
  }

  public dispose() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.appCamera.dispose();
    this.renderer.dispose();
  }
}
