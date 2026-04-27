import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  InternalServerErrorException,
  Logger,
  Param,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { type Observable, map } from 'rxjs';
import { z } from 'zod';

import {
  type SceneConfig,
  SceneConfigSchema,
  type SceneSummary,
  SceneSummarySchema,
} from '@xstate-workshop/scene-protocol';

import { ZodHttpInterceptor } from '../common/interceptors';
import { ZodHttpPipe } from '../common/pipes';

import { ScenesService } from './scenes.service';

@Controller('scenes')
export class ScenesController {
  constructor(private readonly scenesService: ScenesService) {}

  @Get()
  @UseInterceptors(new ZodHttpInterceptor(SceneSummarySchema))
  findAllScenes(): Observable<SceneSummary[]> {
    return this.scenesService.findAll().pipe(
      map((result) => {
        if (!result.ok) {
          if (result.error instanceof HttpException) throw result.error;

          Logger.error(result.error);

          throw new InternalServerErrorException();
        }

        return result.value;
      })
    );
  }

  @Get(':name')
  @UseInterceptors(new ZodHttpInterceptor(SceneConfigSchema))
  findSceneByName(
    @Param('name', new ZodHttpPipe(z.string())) name: string
  ): Observable<SceneConfig> {
    return this.scenesService.findOne(name).pipe(
      map((result) => {
        if (!result.ok) {
          if (result.error instanceof HttpException) throw result.error;

          Logger.error(result.error);

          throw new InternalServerErrorException();
        }

        return result.value;
      })
    );
  }

  @Post()
  @UseInterceptors(new ZodHttpInterceptor(SceneConfigSchema))
  upsertScene(
    @Body(new ZodHttpPipe(SceneConfigSchema)) body: SceneConfig
  ): Observable<SceneConfig> {
    return this.scenesService.upsert(body).pipe(
      map((result) => {
        if (!result.ok) {
          if (result.error instanceof HttpException) throw result.error;

          Logger.error(result.error);

          throw new InternalServerErrorException();
        }

        return result.value;
      })
    );
  }

  @Delete(':name')
  removeSceneByName(
    @Param('name', new ZodHttpPipe(z.string())) name: string
  ): Observable<void> {
    return this.scenesService.remove(name).pipe(
      map((result) => {
        if (!result.ok) {
          if (result.error instanceof HttpException) throw result.error;

          Logger.error(result.error);

          throw new InternalServerErrorException();
        }

        return result.value;
      })
    );
  }
}
