import { Module } from '@nestjs/common';

import { BroadcastModule } from '../broadcast/broadcast.module';

import { TextToSpeechGateway } from './text-to-speech.gateway';

// TODO: rename module
@Module({
  imports: [BroadcastModule],
  providers: [TextToSpeechGateway],
})
export class TextToSpeechModule {}
