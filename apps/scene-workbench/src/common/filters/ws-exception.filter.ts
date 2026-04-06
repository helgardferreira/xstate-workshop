/* eslint-disable @typescript-eslint/no-explicit-any */
import { ArgumentsHost, Catch } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';
import type { WebSocket } from 'ws';
import * as z from 'zod';

import {
  ServerMessageSchema,
  WsErrorSchema,
} from '@xstate-workshop/scene-protocol';

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  override catch(exception: any, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<WebSocket>();
    let response: z.input<typeof ServerMessageSchema>;

    try {
      response = ServerMessageSchema.encode({
        error: WsErrorSchema.parse(exception.getError()),
        meta: { ts: new Date() },
        type: 'ERROR',
      });
    } catch {
      response = {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal Server Error',
        },
        type: 'ERROR',
      };
    }

    client.send(JSON.stringify(response));
  }
}
