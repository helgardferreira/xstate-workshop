import { WsException } from '@nestjs/websockets';

import { type WsError, WsErrorSchema } from '@xstate-workshop/scene-protocol';

export class WsErrorException extends WsException {
  constructor(error: WsError) {
    super(WsErrorSchema.encode(error));
  }
}
