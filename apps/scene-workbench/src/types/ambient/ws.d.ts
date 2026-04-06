import 'ws';

declare module 'ws' {
  interface WebSocket {
    clientId?: string;
  }

  namespace WebSocket {
    interface WebSocket {
      clientId?: string;
    }
  }
}
