import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import * as z from 'zod';

import {
  type SceneConfig,
  SceneConfigSchema,
} from '@xstate-workshop/scene-protocol';

import { ZodHttpInterceptor } from '../common/interceptors';
import { ZodHttpPipe } from '../common/pipes';

import { ScenesService } from './scenes.service';

// TODO: implement HTTP REST request module to handle scene config serialization and de-serialization
// TODO: continue here...
@Controller('scenes')
export class ScenesController {
  constructor(private readonly scenesService: ScenesService) {}

  @Post()
  @UseInterceptors(new ZodHttpInterceptor(SceneConfigSchema))
  createScene(
    @Body(new ZodHttpPipe(SceneConfigSchema)) body: SceneConfig
  ): Promise<SceneConfig> {
    return this.scenesService.create(body);
  }

  @Get()
  @UseInterceptors(new ZodHttpInterceptor(SceneConfigSchema))
  findAllScenes(): Promise<SceneConfig[]> {
    return this.scenesService.findAll();
  }

  @Get(':name')
  @UseInterceptors(new ZodHttpInterceptor(SceneConfigSchema))
  findSceneByName(
    @Param('name', new ZodHttpPipe(z.string())) name: string
  ): Promise<SceneConfig> {
    return this.scenesService.findOne(name);
  }

  @Patch(':name')
  @UseInterceptors(new ZodHttpInterceptor(SceneConfigSchema))
  updateSceneByName(
    @Param('name', new ZodHttpPipe(z.string())) name: string,
    @Body(
      new ZodHttpPipe(
        SceneConfigSchema.pick({ entities: true, environment: true })
      )
    )
    body: Pick<SceneConfig, 'entities' | 'environment'>
  ): Promise<SceneConfig> {
    return this.scenesService.update(name, body);
  }

  @Delete(':name')
  removeSceneByName(
    @Param('name', new ZodHttpPipe(z.string())) name: string
  ): Promise<void> {
    return this.scenesService.remove(name);
  }
}
