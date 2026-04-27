import { Module } from '@nestjs/common';

import { BroadcastModule } from '../broadcast/broadcast.module';

import { ScenesController } from './scenes.controller';
import { ScenesGateway } from './scenes.gateway';
import { ScenesService } from './scenes.service';

@Module({
  imports: [BroadcastModule],
  controllers: [ScenesController],
  providers: [ScenesGateway, ScenesService],
})
export class ScenesModule {}
