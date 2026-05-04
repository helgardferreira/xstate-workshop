import {
  Observable,
  type Subscription,
  concatMap,
  distinctUntilChanged,
  filter,
  from,
  fromEvent,
  map,
  shareReplay,
  toArray,
} from 'rxjs';
import { Group, Object3D, Scene, WebGLRenderer } from 'three';
import { createActor } from 'xstate';

import { untilStateMatches } from '@xstate-workshop/actors';
import { clamp } from '@xstate-workshop/utils';

import {
  fromFrames,
  fromFullscreenKeyup,
  fromObject3dTraverse,
  fromWindowResize,
} from '../../utils';
import {
  type SceneManagerActorRef,
  type SceneManagerActorSnapshot,
  sceneManagerMachine,
} from '../actors';
import { APP_TAGS } from '../constants';
import { createSceneEditor } from '../scene-editor';
import { type AppEntity, AppEntityUserDataSchema } from '../schemas';
import type { Models } from '../types';

import { Clank } from './clank';
import { type AppCamera, createAppCamera } from './create-app-camera';
import { createCanvas } from './create-canvas';
import { createRenderer } from './create-renderer';
import { type SceneAssets, loadSceneAssets } from './load-scene-assets';

// TODO: maybe implement diff reconciliation mechanism for scene entity syncing later
// TODO: figure out conveyor scene composition (first start with just reproducing the conveyor kit's sample image)
// TODO: implement mechanism to quickly swap / route between scenes
//       - will make referencing preview scene much easier and will be needed for later setups
//       - maybe investigate xstate routes (https://stately.ai/docs/routes)?
export class WebGLApp {
  private appCamera: AppCamera;
  private canvas: HTMLCanvasElement;
  private clank: Clank;
  private renderer: WebGLRenderer;
  // TODO: reimplement this once sceneManagerMachine supports multiple `Scene` instances
  private scene: Scene;
  private sceneManagerActor: SceneManagerActorRef;
  private sceneManagerSnapshot: Observable<SceneManagerActorSnapshot>;
  private subscriptions: Subscription[] = [];

  private get sceneEntities(): AppEntity[] {
    return this.sceneManagerActor.getSnapshot().context.currentScene.entities;
  }

  constructor() {
    this.canvas = createCanvas('root');
    this.renderer = createRenderer(this.canvas);

    // TODO: implement ability to manage multiple `Scene` instances in memory
    this.scene = new Scene();
    this.appCamera = createAppCamera(this.scene, this.canvas);
    this.appCamera.camera.position.set(5, 5, 5);
    this.appCamera.controls.target.set(0, 0, 0);

    this.clank = new Clank({
      camera: this.appCamera.camera,
      domElement: this.renderer.domElement,
    });
    this.scene.add(this.clank.helper, this.clank.highlightBoxHelper);

    this.sceneManagerActor = createActor(sceneManagerMachine, {
      input: {},
    }).start();
    this.sceneManagerSnapshot = from(this.sceneManagerActor).pipe(
      shareReplay({ bufferSize: 1, refCount: true })
    );

    createSceneEditor({
      context: {
        sceneManagerActor: this.sceneManagerActor,
      },
      elementId: 'scene-editor-root',
    });
  }

  private buildScene(assets: SceneAssets) {
    const { models, textures } = assets;
    this.scene.background = textures.environmentMap;
    this.scene.environment = textures.environmentMap;

    const sceneManagerEntities: Observable<readonly [Object3D[], AppEntity[]]> =
      this.sceneManagerSnapshot.pipe(
        map((snapshot) => snapshot.context),
        distinctUntilChanged(),
        map((context) => context.currentScene.entities),
        concatMap((entities) =>
          fromObject3dTraverse(this.scene).pipe(
            filter(
              (previous) =>
                AppEntityUserDataSchema.safeParse(previous.userData).success
            ),
            toArray(),
            map((previousObjects) => [previousObjects, entities] as const)
          )
        )
      );

    this.subscriptions.push(
      sceneManagerEntities.subscribe(([previousObjects, entities]) =>
        this.syncEntities(previousObjects, entities, models)
      )
    );
  }

  private setupEvents() {
    /*
     * Animation loop
     */
    this.subscriptions.push(
      fromFrames().subscribe(() => {
        this.renderer.render(this.scene, this.appCamera.camera);

        this.appCamera.update();
        this.clank.update();
      })
    );

    /*
     * Disable app camera controls when dragging clank
     */
    this.subscriptions.push(
      fromEvent(this.clank, 'dragging-changed').subscribe((event) => {
        const isDragging = ('value' in event && event.value) as boolean;
        this.appCamera.controls.enabled = !isDragging;
      })
    );

    /*
     * Update renderer size and pixel ratio when window resizes
     */
    this.subscriptions.push(
      fromWindowResize().subscribe(({ height, width }) => {
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(clamp(window.devicePixelRatio, 1, 2));
      })
    );

    /*
     * Attach fullscreen keyboard shortcut event listener
     */
    this.subscriptions.push(
      fromFullscreenKeyup().subscribe((shouldFullscreen) => {
        if (shouldFullscreen) this.canvas.requestFullscreen();
        else document.exitFullscreen();
      })
    );
  }

  private syncEntities(
    previousObjects: Object3D[],
    entities: AppEntity[],
    models: Models
  ) {
    this.clank.deleteObjects(...previousObjects);
    this.scene.remove(...previousObjects);

    entities.forEach((entity) => {
      const {
        model,
        transform: { position, rotation, scale },
      } = entity;

      const group = new Group();
      group.add(models[model].scene.clone());

      group.position.set(position.x, position.y, position.z);
      group.rotation.set(rotation.x, rotation.y, rotation.z, rotation.order);
      group.scale.set(scale.x, scale.y, scale.z);
      group.userData.tags = [APP_TAGS.Entity];

      this.scene.add(group);
      this.clank.addObjects(group);
    });
  }

  public async run() {
    const assets = await loadSceneAssets();
    this.buildScene(assets);

    this.sceneManagerActor.send({ type: 'INIT' });
    await untilStateMatches(this.sceneManagerActor, 'active');

    this.setupEvents();

    // TODO: remove this after debugging
    // / ------------------------------------------------------------------------
    setTimeout(() => {
      const entityId = crypto.randomUUID();

      this.sceneManagerActor.send({
        type: 'ADD_ENTITY',
        entity: {
          id: entityId,
          model: 'arrow-basic',
          transform: { position: { x: 0, y: 0, z: 2 } },
        },
      });
    }, 2000);
    // / ------------------------------------------------------------------------
  }

  public dispose() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.appCamera.dispose();
    this.renderer.dispose();
  }
}
