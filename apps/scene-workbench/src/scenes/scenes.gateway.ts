import { type OnGatewayInit, WebSocketGateway } from '@nestjs/websockets';
import type { WebSocketServer } from 'ws';

import { BroadcastService } from '../broadcast/broadcast.service';

@WebSocketGateway({ path: 'scene' })
export class ScenesGateway implements OnGatewayInit<WebSocketServer> {
  constructor(private readonly broadcastService: BroadcastService) {}

  afterInit(server: WebSocketServer) {
    this.broadcastService.init(server);
  }
}
