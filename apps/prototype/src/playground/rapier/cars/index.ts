import type * as RapierNS from '@dimforge/rapier3d';
import { type Subscription } from 'rxjs';
import {
  MeshStandardMaterial,
  PCFSoftShadowMap,
  Quaternion,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';

import { clamp } from '@xstate-workshop/utils';

import {
  type PhysicsWorldHelper,
  createCanvas,
  createPhysicsWorldHelper,
  fromFrames,
  fromFullscreenKeyup,
  fromWindowResize,
  setConnectedBodiesRotation,
  setConnectedBodiesTranslation,
} from '../../../utils';

import { Car } from './car/car';
import { type ControlConfigs, ControlsPanel } from './controls-panel';
import { type CarCamera, createCarCamera } from './create-car-camera';
import { type Floor, createFloor } from './create-floor';
import { type Lights, createLights } from './create-lights';
import { loadModels } from './load-models';
import { loadTextures } from './load-textures';

export class CarsPlayground {
  private canvas: HTMLCanvasElement;
  private carCamera: CarCamera;
  private lights: Lights;
  private renderer: WebGLRenderer;
  private scene: Scene;
  private subscriptions: Subscription[] = [];

  private car: Car | undefined;
  // TODO: restore this after debugging
  // private controlsPanel: ControlsPanel | undefined;
  private eventQueue: RapierNS.EventQueue | undefined;
  private floor: Floor | undefined;
  private physicsWorldHelper: PhysicsWorldHelper | undefined;

  constructor() {
    this.canvas = createCanvas();

    this.renderer = new WebGLRenderer({ canvas: this.canvas });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(clamp(window.devicePixelRatio, 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;

    this.scene = new Scene();

    this.carCamera = createCarCamera(this.scene, this.canvas);
    // TODO: remove this after implementing custom camera controls
    /*
    this.carCamera.controls.enablePan = false;
    this.carCamera.controls.enableZoom = false;
    this.carCamera.controls.minPolarAngle = 1.4;
    */
    this.carCamera.controls.target.set(0, 2.5, 0);

    this.lights = createLights(this.scene);

    this.subscriptions.push(
      fromWindowResize().subscribe(({ height, width }) => {
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(clamp(window.devicePixelRatio, 1, 2));
      })
    );

    this.subscriptions.push(
      fromFullscreenKeyup().subscribe((shouldFullscreen) => {
        if (shouldFullscreen) this.canvas.requestFullscreen();
        else document.exitFullscreen();
      })
    );
  }

  public run = async () => {
    const Rapier = await import('@dimforge/rapier3d');
    // TODO: restore this after debugging
    // const world = new Rapier.World({ x: 0, y: -9.82, z: 0 });
    // TODO: remove this after debugging
    const world = new Rapier.World({ x: 0, y: 0, z: 0 });
    world.numSolverIterations = 8;

    const models = await loadModels();
    const textures = await loadTextures();

    this.scene.background = textures.environmentMap;
    this.scene.environment = textures.environmentMap;

    // TODO: refactor this after refactoring `createPhysicsWorldHelper`
    this.physicsWorldHelper = createPhysicsWorldHelper(world);
    this.scene.add(this.physicsWorldHelper.lines);

    const floorMaterial = new MeshStandardMaterial({
      color: 0x77_77_77,
      metalness: 0,
      roughness: 1,
    });

    this.floor = createFloor(Rapier, world, this.scene, {
      depth: 100,
      material: floorMaterial,
      width: 100,
    });

    this.car = new Car(Rapier, world, this.scene, models.car, {
      position: { x: 0, y: 2, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      /*
      position: { x: 0, y: 4, z: 0 },
      rotation: { x: 0, y: 0, z: Math.PI * 0.5 },
      scale: 2,
      */
    });

    // TODO: maybe implement a different class(es), or function(s), for creating folder configs and controls configs
    // TODO: implement some kind of `FolderConfigInfer` or `FolderConfigFrom` type utility
    // TODO: continue here...
    ////// ---------------------------------------------------------------------
    /*
    export type FolderConfig = {
      readonly id: string;
      readonly title?: string;
      readonly children?: readonly FolderConfig[];
      readonly closed?: boolean;
    };
    */

    /*
    type FolderConfigFrom<T> = T extends {
      readonly id: infer U;
      readonly title?: string;
      readonly children?: readonly FolderConfig[];
      readonly closed?: boolean;
    }
      ? U
      : never;
    */
    /*
    type FolderConfigFrom<T> =
      T extends FolderConfig<infer TId, infer TTitle> ? [TId, TTitle] : never;
    */

    // TODO: rename this to just `PanelFolder` if going with functional approach
    type PanelFolderConfig<
      TId extends string,
      TControlConfigs extends ControlConfigs,
      TChildren extends
        | PanelFolderConfig<string, ControlConfigs>[]
        | unknown[] = unknown[],
    > = {
      id: TId;
      title: string | undefined;
      closed: boolean | undefined;
      children: TChildren;
      controls: TControlConfigs | undefined;
    };

    // TODO: experiment with function implementation
    //       - experiment with function overloads for options / children argument positioning
    //       - figure out controls config at folder level
    function createPanelFolder<
      const TId extends string,
      const TControlConfigs extends ControlConfigs,
      const TChildren extends PanelFolderConfig<string, ControlConfigs>[],
    >(
      id: TId,
      title?: string,
      closed?: boolean,
      children?: TChildren,
      controls?: TControlConfigs
    ): PanelFolderConfig<TId, TControlConfigs, TChildren> {
      return {
        id,
        title,
        closed,
        children: children ?? ([] as unknown as TChildren),
        controls,
      };
    }

    // TODO: experiment with class implementation
    //       - experiment with constructor overloads for options / children argument positioning
    //       - figure out controls config at folder level
    class PanelFolder<
      const TId extends string,
      const TChildren extends PanelFolder<string>[] | unknown[] = unknown[],
    > {
      public readonly id: TId;
      public readonly title: string | undefined;
      public readonly closed: boolean | undefined;
      public readonly children: TChildren;

      constructor(
        id: TId,
        title?: string,
        closed?: boolean,
        children?: TChildren
      ) {
        this.id = id;
        this.title = title;
        this.closed = closed;
        this.children = children ?? ([] as unknown as TChildren);
      }
    }

    /*
    children: [
      { id: 'ambientLight', title: 'Ambient Light', closed: true },
      {
        id: 'directionalLight',
        title: 'Directional Light',
        children: [
          {
            id: 'directionalLightPosition',
            title: 'Position',
            closed: true,
          },
          {
            id: 'directionalLightShadow',
            title: 'Shadow',
            children: [
              { id: 'directionalLightShadowCamera', title: 'Camera' },
            ],
            closed: true,
          },
        ],
      },
    ],
    */

    const panelFolder = createPanelFolder('lights', 'Lights', false, [
      createPanelFolder('ambientLight', 'Ambient Light', true),
      createPanelFolder('directionalLight', 'Directional Light', false, [
        createPanelFolder('directionalLightPosition', 'Position', true),
        createPanelFolder('directionalLightShadow', 'Shadow', true, [
          createPanelFolder(
            'directionalLightShadowCamera',
            'Camera',
            false,
            [],
            {
              top: {
                type: 'number',
                value: this.lights.directionalLight.shadow.camera.top,
                max: 20,
                min: 0.1,
                name: 'Top',
                step: 0.01,
              },
            }
          ),
        ]),
      ]),
    ]);

    const _a = panelFolder.children[1].children[1].children[0];

    type A = typeof _a;

    type AB = A['controls'];

    const panelFolderInstance = new PanelFolder('lights', 'Lights', false, [
      new PanelFolder('ambientLight', 'Ambient Light', true),
      new PanelFolder('directionalLight', 'Directional Light', false, [
        new PanelFolder('directionalLightPosition', 'Position', true),
        new PanelFolder('directionalLightShadow', 'Shadow', true, [
          new PanelFolder('directionalLightShadowCamera', 'Camera'),
        ]),
      ]),
    ]);

    const _b =
      panelFolderInstance.children[1].children[1].children[0].id ===
      'directionalLightShadowCamera';

    // type A = [1, 2];
    // type B = 3;
    // type C = [...A, B]
    ////// ---------------------------------------------------------------------

    // TODO: move this to separate method on `CarsPlayground` (`createControlsPanel`)
    ////// ---------------------------------------------------------------------
    // TODO: implement this
    const controlsPanel = new ControlsPanel(
      [
        // lightsFolder,
        {
          id: 'lights',
          title: 'Lights',
          children: [
            { id: 'ambientLight', title: 'Ambient Light', closed: true },
            {
              id: 'directionalLight',
              title: 'Directional Light',
              children: [
                {
                  id: 'directionalLightPosition',
                  title: 'Position',
                  closed: true,
                },
                {
                  id: 'directionalLightShadow',
                  title: 'Shadow',
                  children: [
                    { id: 'directionalLightShadowCamera', title: 'Camera' },
                  ],
                  closed: true,
                },
              ],
            },
          ],
        },
        { id: 'physics', title: 'Physics' },
        {
          id: 'car',
          title: 'Car',
          children: [
            { id: 'carWheelHub', title: 'Wheel Hub' },
            { id: 'carSteeringKnuckle', title: 'Steering Knuckle' },
          ],
        },
      ],
      {
        ambientLight: {
          color: {
            type: 'color',
            value: this.lights.ambientLight.color.getHex(),
            name: 'Color',
          },
          intensity: {
            type: 'number',
            value: this.lights.ambientLight.intensity,
            max: 10,
            min: 0,
            name: 'Intensity',
            step: 0.001,
          },
          visible: {
            type: 'checkbox',
            value: this.lights.ambientLight.visible,
            name: 'Visible',
          },
        },
        directionalLight: {
          color: {
            type: 'color',
            value: this.lights.directionalLight.color.getHex(),
            name: 'Color',
          },
          intensity: {
            type: 'number',
            value: this.lights.directionalLight.intensity,
            max: 10,
            min: 0,
            name: 'Intensity',
            step: 0.001,
          },
          visible: {
            type: 'checkbox',
            value: this.lights.directionalLight.visible,
            name: 'Visible',
          },
          helper: {
            type: 'checkbox',
            value: this.lights.helpers.directionalLight.visible,
            name: 'Helper',
          },
        },
        directionalLightPosition: {
          x: {
            type: 'number',
            value: this.lights.directionalLight.position.x,
            max: 20,
            min: -20,
            step: 0.01,
          },
          y: {
            type: 'number',
            value: this.lights.directionalLight.position.y,
            max: 20,
            min: -20,
            step: 0.01,
          },
          z: {
            type: 'number',
            value: this.lights.directionalLight.position.z,
            max: 20,
            min: -20,
            step: 0.01,
          },
        },
        directionalLightShadow: {
          mapSize: {
            type: 'dropdown',
            value: this.lights.directionalLight.shadow.mapSize.x,
            options: {
              '128x128': 128,
              '256x256': 256,
              '512x512': 512,
              '1024x1024': 1024,
              '2048x2048': 2048,
              '4096x4096': 4096,
              '8192x8192': 8192,
            },
            name: 'Map Size',
          },
          normalBias: {
            type: 'number',
            value: this.lights.directionalLight.shadow.normalBias,
            max: 0.05,
            min: -0.05,
            name: 'Normal Bias',
            step: 0.001,
          },
          bias: {
            type: 'number',
            value: this.lights.directionalLight.shadow.bias,
            max: 0.05,
            min: -0.05,
            name: 'Bias',
            step: 0.001,
          },
        },
        directionalLightShadowCamera: {
          top: {
            type: 'number',
            value: this.lights.directionalLight.shadow.camera.top,
            max: 20,
            min: 0.1,
            name: 'Top',
            step: 0.01,
          },
          right: {
            type: 'number',
            value: this.lights.directionalLight.shadow.camera.right,
            max: 20,
            min: 0.1,
            name: 'Right',
            step: 0.01,
          },
          bottom: {
            type: 'number',
            value: this.lights.directionalLight.shadow.camera.bottom,
            max: -0.1,
            min: -20,
            name: 'Bottom',
            step: 0.01,
          },
          left: {
            type: 'number',
            value: this.lights.directionalLight.shadow.camera.left,
            max: -0.1,
            min: -20,
            name: 'Left',
            step: 0.01,
          },
          near: {
            type: 'number',
            value: this.lights.directionalLight.shadow.camera.near,
            max: 100,
            min: 0.5,
            name: 'Near',
            step: 0.01,
          },
          far: {
            type: 'number',
            value: this.lights.directionalLight.shadow.camera.far,
            max: 100,
            min: 0.5,
            name: 'Far',
            step: 0.01,
          },
          helper: {
            type: 'checkbox',
            value: this.lights.helpers.directionalLightCamera.visible,
            name: 'Helper',
          },
        },
        physics: {
          helper: { type: 'checkbox', value: true, name: 'Helper' },
          running: { type: 'checkbox', value: true, name: 'Running' },
          numSolverIterations: {
            type: 'number',
            value: world.numSolverIterations,
            max: 16,
            min: 4,
            name: 'Number of Solver Iterations',
            step: 1,
          },
        },
        car: {
          resetPose: {
            type: 'button',
            value: () => {
              setConnectedBodiesRotation(
                world,
                this.car!.body.body,
                new Quaternion()
              );
              setConnectedBodiesTranslation(
                world,
                this.car!.body.body,
                new Vector3(0, 3, 0)
              );
            },
          },
        },
        carWheelHub: {
          angle: {
            type: 'number',
            value: 0,
            max: 180,
            min: -180,
            name: 'Angle',
            step: 0.1,
          },
          stiffness: {
            type: 'number',
            value: 1_000,
            max: 50_000,
            min: 1,
            name: 'Stiffness',
            step: 1,
          },
          damping: {
            type: 'number',
            value: 500,
            max: 5_000,
            min: 1,
            name: 'Damping',
            step: 1,
          },
        },
        carSteeringKnuckle: {
          angle: {
            type: 'number',
            value: 0,
            max: 35,
            min: -35,
            name: 'Angle',
            step: 0.1,
          },
          stiffness: {
            type: 'number',
            value: 5_000,
            max: 50_000,
            min: 1,
            name: 'Stiffness',
            step: 1,
          },
          damping: {
            type: 'number',
            value: 500,
            max: 5_000,
            min: 1,
            name: 'Damping',
            step: 1,
          },
        },
      }
    );

    // controlsPanel.folders.lights
    ////// ---------------------------------------------------------------------

    // TODO: implement controller change listeners for `CarsPlayground`
    ////// ---------------------------------------------------------------------
    controlsPanel.controllers.ambientLight.color.onChange((value: number) => {
      this.lights.ambientLight.color.set(value);
    });
    controlsPanel.controllers.ambientLight.intensity.onChange(
      (value: number) => {
        this.lights.ambientLight.intensity = value;
      }
    );
    controlsPanel.controllers.ambientLight.visible.onChange(
      (value: boolean) => {
        this.lights.ambientLight.visible = value;
      }
    );

    const updateDirectionalLightTransform = () => {
      this.lights.directionalLight.position.copy(
        controlsPanel.controls.directionalLightPosition
      );
      this.lights.helpers.directionalLight.update();
    };

    controlsPanel.controllers.directionalLightPosition.x.onChange(
      updateDirectionalLightTransform
    );
    controlsPanel.controllers.directionalLightPosition.y.onChange(
      updateDirectionalLightTransform
    );
    controlsPanel.controllers.directionalLightPosition.z.onChange(
      updateDirectionalLightTransform
    );

    const directionalLightShadowCameraPlaneUpdater = (
      plane: 'bottom' | 'far' | 'left' | 'near' | 'right' | 'top'
    ) => {
      return (value: number) => {
        this.lights.directionalLight.shadow.camera[plane] = value;
        this.lights.directionalLight.shadow.camera.updateProjectionMatrix();
        this.lights.helpers.directionalLightCamera.update();
      };
    };

    controlsPanel.controllers.directionalLightShadowCamera.top.onChange(
      directionalLightShadowCameraPlaneUpdater('top')
    );
    controlsPanel.controllers.directionalLightShadowCamera.right.onChange(
      directionalLightShadowCameraPlaneUpdater('right')
    );
    controlsPanel.controllers.directionalLightShadowCamera.bottom.onChange(
      directionalLightShadowCameraPlaneUpdater('bottom')
    );
    controlsPanel.controllers.directionalLightShadowCamera.left.onChange(
      directionalLightShadowCameraPlaneUpdater('left')
    );
    controlsPanel.controllers.directionalLightShadowCamera.near.onChange(
      directionalLightShadowCameraPlaneUpdater('near')
    );
    controlsPanel.controllers.directionalLightShadowCamera.far.onChange(
      directionalLightShadowCameraPlaneUpdater('far')
    );

    controlsPanel.controllers.directionalLightShadowCamera.helper.onChange(
      (value: boolean) => {
        this.lights.helpers.directionalLightCamera.visible =
          value && controlsPanel.controls.directionalLight.visible;
      }
    );
    controlsPanel.controllers.directionalLightShadow.mapSize.onChange(
      (value: number) => {
        this.lights.directionalLight.shadow.mapSize.set(value, value);
        this.lights.directionalLight.shadow.map?.dispose();
        this.lights.directionalLight.shadow.map = null;
      }
    );
    controlsPanel.controllers.directionalLightShadow.normalBias.onChange(
      (value: number) => {
        this.lights.directionalLight.shadow.normalBias = value;
      }
    );
    controlsPanel.controllers.directionalLightShadow.bias.onChange(
      (value: number) => {
        this.lights.directionalLight.shadow.bias = value;
      }
    );
    controlsPanel.controllers.directionalLight.color.onChange(
      (value: number) => {
        this.lights.directionalLight.color.set(value);
        this.lights.helpers.directionalLight.update();
      }
    );
    controlsPanel.controllers.directionalLight.intensity.onChange(
      (value: number) => {
        this.lights.directionalLight.intensity = value;
      }
    );
    controlsPanel.controllers.directionalLight.visible.onChange(
      (value: boolean) => {
        this.lights.directionalLight.visible = value;
        this.lights.helpers.directionalLightCamera.visible =
          value && controlsPanel.controls.directionalLightShadowCamera.helper;
        this.lights.helpers.directionalLight.visible =
          value && controlsPanel.controls.directionalLight.helper;
      }
    );
    controlsPanel.controllers.directionalLight.helper.onChange(
      (value: boolean) => {
        this.lights.helpers.directionalLight.visible =
          value && controlsPanel.controls.directionalLight.visible;
      }
    );

    // TODO: figure out better way to handle this
    // controlsPanel.controllers.physics.running.onChange
    controlsPanel.controllers.physics.helper.onChange((value: boolean) => {
      if (this.physicsWorldHelper === undefined) return;
      this.physicsWorldHelper.lines.visible = value;
    });
    controlsPanel.controllers.physics.numSolverIterations.onChange(
      (value: number) => {
        world.integrationParameters.numSolverIterations = value;
        world.bodies.forEach((body) => body.wakeUp());
      }
    );

    // TODO: implement remaining controller change listeners
    /*
    // TODO: implement this properly later
    function updateWheelHub() {
      const targetPos = controls.car.wheelHub.angle * (Math.PI / 180);
      const stiffness = controls.car.wheelHub.stiffness;
      const damping = controls.car.wheelHub.damping;

      // TODO: use motor velocity API instead of motor position API after debugging
      // hubJoint.configureMotorVelocity(5, 1);
      car.wheels.frontLeft.hubToWheelJoint.configureMotorPosition(
        targetPos,
        stiffness,
        damping
      );
      car.wheels.frontRight.hubToWheelJoint.configureMotorPosition(
        targetPos,
        stiffness,
        damping
      );
    }

    controlsPanel.controllers.car.wheelHub.angle.onChange(updateWheelHub);
    controlsPanel.controllers.car.wheelHub.damping.onChange(updateWheelHub);
    controlsPanel.controllers.car.wheelHub.stiffness.onChange(updateWheelHub);
    updateWheelHub();

    function updateSteeringKnuckle() {
      const targetPos = controls.car.steeringKnuckle.angle * (Math.PI / 180);
      const stiffness = controls.car.steeringKnuckle.stiffness;
      const damping = controls.car.steeringKnuckle.damping;

      car.wheels.frontLeft.steeringKnuckleToHubJoint?.configureMotorPosition(
        targetPos,
        stiffness,
        damping
      );
      car.wheels.frontRight.steeringKnuckleToHubJoint?.configureMotorPosition(
        targetPos,
        stiffness,
        damping
      );
    }

    controlsPanel.controllers.car.steeringKnuckle.angle.onChange(
      updateSteeringKnuckle
    );
    controlsPanel.controllers.car.steeringKnuckle.damping.onChange(
      updateSteeringKnuckle
    );
    controlsPanel.controllers.car.steeringKnuckle.stiffness.onChange(
      updateSteeringKnuckle
    );
    updateSteeringKnuckle();
    */
    ////// ---------------------------------------------------------------------

    // TODO: remove this after debugging
    ////// ---------------------------------------------------------------------
    console.log('folders', controlsPanel.folders);
    console.log('controllers', controlsPanel.controllers);
    console.log('controls', controlsPanel.controls);
    console.log(controlsPanel.controls.ambientLight.color);
    ////// ---------------------------------------------------------------------

    // TODO: restore this after debugging
    /*
    this.controlsPanel = setupControlsPanel({
      car: this.car,
      lights: this.lights,
      physicsWorldHelper: this.physicsWorldHelper,
      world,
    });
    */

    // TODO: restore this after debugging
    /*
    this.physicsWorldHelper.lines.visible =
      this.controlsPanel.controls.physics.helper;
    */
    // TODO: remove this after debugging
    this.physicsWorldHelper.lines.visible = true;

    const eventQueue = new Rapier.EventQueue(true);

    this.subscriptions.push(
      fromFrames().subscribe(() => {
        this.carCamera.update();

        // TODO: restore this after debugging
        /*
        if (
          !this.controlsPanel ||
          this.controlsPanel.controls.physics.running
        ) {
          world.step(eventQueue);
        }
        */

        // TODO: remove this after debugging
        world.step(eventQueue);

        this.car?.update();
        this.physicsWorldHelper?.update();

        this.renderer.render(this.scene, this.carCamera.camera);
      })
    );
  };

  public dispose = () => {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.carCamera.dispose();
    // TODO: restore this after debugging
    // this.controlsPanel?.dispose();
    this.lights.dispose();
    this.car?.dispose();
    this.floor?.dispose();
    this.eventQueue?.free();
  };
}
