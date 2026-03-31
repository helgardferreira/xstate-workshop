import type { Controller, GUI } from 'lil-gui';

import type { WidenPrimitive } from '@xstate-workshop/utils';

import { createControlsPanel } from '../../../utils';

// TODO: restore this or remove this after debugging
/*
export type FolderConfig = {
  id: string;
  title?: string;
  children?: FolderConfig[];
  closed?: boolean;
};
*/
export type FolderConfig = {
  id: string;
  title?: string;
  children?: FolderConfig[];
  closed?: boolean;
};

type ExtractFolderIds<T extends FolderConfig> =
  | T['id']
  | (T extends {
      children: (infer C extends FolderConfig)[];
    }
      ? ExtractFolderIds<C>
      : never);

export type ButtonControlConfig = {
  type: 'button';
  value: () => void;
  name?: string;
};

export type CheckboxControlConfig = {
  type: 'checkbox';
  value: boolean;
  name?: string;
};

export type ColorControlConfig = {
  type: 'color';
  value: number | string | { r: number; g: number; b: number };
  name?: string;
};

export type DropdownControlConfig = {
  type: 'dropdown';
  value: number | string;
  options: Record<string, number | string> | Array<number | string>;
  name?: string;
};

export type NumberControlConfig = {
  type: 'number';
  value: number;
  max?: number;
  min?: number;
  name?: string;
  step?: number;
};

export type TextControlConfig = {
  type: 'text';
  value: string;
  name?: string;
};

// TODO: maybe implement additional control config types (e.g. `VectorControlConfig`)
export type ControlConfigs = Record<
  string,
  | ButtonControlConfig
  | CheckboxControlConfig
  | ColorControlConfig
  | DropdownControlConfig
  | NumberControlConfig
  | TextControlConfig
>;

export type ControlsConfigs<T extends FolderConfig> =
  ExtractFolderIds<T> extends infer U
    ? {
        [K in Extract<U, string>]?: ControlConfigs;
      }
    : never;

type Controls<T extends ControlsConfigs<FolderConfig>> = {
  [K in keyof T]: T[K] extends infer U extends ControlConfigs
    ? {
        [P in keyof U]: WidenPrimitive<U[P]['value']>;
      }
    : never;
};

// TODO: create similar `Controllers` type to map `ControlsConfigs` to `Controller` record
type Controllers<T extends ControlsConfigs<FolderConfig>> = {
  [K in keyof T]: T[K] extends infer U extends ControlConfigs
    ? {
        [P in keyof U]: Controller;
      }
    : never;
};

type Folders<T extends FolderConfig> = Record<ExtractFolderIds<T>, GUI>;

// TODO: maybe implement (optional?) automatic folder id -> folder title formatting
// TODO: maybe implement (optional?) automatic control key -> controller name formatting
// TODO: find way to improve boiler plate
//       - maybe refactor `ControlsPanel` to use builder pattern to incrementally build controls based off of folders and controls configs (with folders being optional)
// TODO: use `ControlsPanel` instance as dependency to allow for easier adhoc control panel additions
// TODO: implement error handling for duplicate folder ids
// TODO: implement this
//       - add ability to create new control and / or controller
//       - refactor `setupControlsPanel` to `ControlsPanel` class
export class ControlsPanel<
  const TFolderConfig extends FolderConfig,
  const TControlsConfigs extends ControlsConfigs<TFolderConfig>,
> {
  private readonly gui: GUI;

  public readonly controllers: Controllers<TControlsConfigs>;
  public readonly controls: Controls<TControlsConfigs>;
  public readonly folders: Folders<TFolderConfig>;

  constructor(
    folderConfigs: TFolderConfig[],
    controlsConfigs: TControlsConfigs
  ) {
    // TODO: move `createControlsPanel` logic into `ControlsPanel` class
    this.gui = createControlsPanel();

    this.folders = this.createFolders(folderConfigs, this.gui);
    const { controllers, controls } = this.createControls(controlsConfigs);
    this.controllers = controllers;
    this.controls = controls;
  }

  private createFolders(
    folderConfigs: FolderConfig[],
    parent: GUI,
    folders: Record<string, unknown> = {}
  ): Folders<TFolderConfig> {
    folderConfigs.forEach((folderConfig) => {
      const folder = parent.addFolder(folderConfig.title ?? folderConfig.id);
      folders[folderConfig.id] = folder;

      if (folderConfig.closed) folder.close();

      if (folderConfig.children) {
        this.createFolders(folderConfig.children, folder, folders);
      }
    });

    return folders as Folders<TFolderConfig>;
  }

  private createControls(controlsConfigs: TControlsConfigs): {
    controls: Controls<TControlsConfigs>;
    controllers: Controllers<TControlsConfigs>;
  } {
    const controllers = {} as Controllers<TControlsConfigs>;
    const controls = {} as Controls<TControlsConfigs>;

    Object.entries<ControlConfigs>(controlsConfigs).forEach(
      ([folderKey, controlConfigs]) => {
        const folder = this.folders[folderKey as keyof Folders<TFolderConfig>];
        const folderControls: Record<string, unknown> = {};
        const folderControllers: Record<string, Controller> = {};

        Object.entries(controlConfigs).forEach(([key, controlConfig]) => {
          folderControls[key] = controlConfig.value;

          switch (controlConfig.type) {
            case 'button':
            case 'checkbox':
            case 'text': {
              const { name } = controlConfig;
              const controller = folder.add(folderControls, key);
              if (name !== undefined) controller.name(name);
              folderControllers[key] = controller;
              break;
            }
            case 'color': {
              const { name } = controlConfig;
              const controller = folder.addColor(folderControls, key);
              if (name !== undefined) controller.name(name);
              folderControllers[key] = controller;
              break;
            }
            case 'dropdown': {
              const { options, name } = controlConfig;
              const controller = folder.add(folderControls, key, options);
              if (name !== undefined) controller.name(name);
              folderControllers[key] = controller;
              break;
            }
            case 'number': {
              const { max, min, name, step } = controlConfig;
              const controller = folder.add(folderControls, key);
              if (max !== undefined) controller.max(max);
              if (min !== undefined) controller.min(min);
              if (name !== undefined) controller.name(name);
              if (step !== undefined) controller.step(step);
              folderControllers[key] = controller;
              break;
            }
          }
        });

        controllers[folderKey as keyof Controllers<TControlsConfigs>] =
          folderControllers as Controllers<TControlsConfigs>[keyof Controllers<TControlsConfigs>];
        controls[folderKey as keyof Controls<TControlsConfigs>] =
          folderControls as Controls<TControlsConfigs>[keyof Controls<TControlsConfigs>];
      }
    );

    return { controllers, controls };
  }

  public dispose(): void {
    Object.values<GUI>(this.folders).forEach((folder) => folder.destroy());
  }
}
