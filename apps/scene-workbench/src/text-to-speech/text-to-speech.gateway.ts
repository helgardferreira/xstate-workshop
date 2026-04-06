import { type OnGatewayInit, WebSocketGateway } from '@nestjs/websockets';
import type { WebSocketServer } from 'ws';

import { BroadcastService } from '../broadcast/broadcast.service';

// TODO: rename path and class
@WebSocketGateway({ path: 'text-to-speech' })
export class TextToSpeechGateway implements OnGatewayInit<WebSocketServer> {
  constructor(private readonly broadcastService: BroadcastService) {}

  afterInit(server: WebSocketServer) {
    this.broadcastService.init(server);
  }
}
