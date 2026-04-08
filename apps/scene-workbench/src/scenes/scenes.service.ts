import { Injectable, NotFoundException } from '@nestjs/common';

import { SceneConfig } from '@xstate-workshop/scene-protocol';

// TODO: remove this after debugging
const sceneConfigMap = new Map<string, SceneConfig>();

@Injectable()
export class ScenesService {
  constructor() {}

  async create(data: SceneConfig): Promise<SceneConfig> {
    const scene = sceneConfigMap.get(data.name);

    if (scene) return scene;

    sceneConfigMap.set(data.name, data);

    // this.broadcastService.broadcast.created({ item: todo });

    return data;
  }

  async findAll(): Promise<SceneConfig[]> {
    const scenes = Array.from(sceneConfigMap.values());

    return scenes;
  }

  async findOne(name: string): Promise<SceneConfig> {
    const scene = sceneConfigMap.get(name);

    if (!scene) throw new NotFoundException('SceneConfig not found');

    return scene;
  }

  async update(
    name: string,
    data: Pick<SceneConfig, 'entities' | 'environment'>
  ): Promise<SceneConfig> {
    const scene = sceneConfigMap.get(name);

    if (!scene) throw new NotFoundException('SceneConfig not found');

    scene.entities = data.entities;
    if (data.environment) scene.environment = data.environment;

    // this.broadcastService.broadcast.patched({
    //   changes: data,
    //   id,
    //   updatedAt: todo.updatedAt,
    // });

    return scene;
  }

  async remove(name: string): Promise<void> {
    const hasRemoved = sceneConfigMap.delete(name);

    if (hasRemoved === false) {
      throw new NotFoundException('SceneConfig not found');
    }

    // this.broadcastService.broadcast.deleted({ id });
  }
}
