import { sceneProtocol } from '@xstate-workshop/scene-protocol';

import { WebGLApp } from './app';

sceneProtocol();

const app = new WebGLApp();

app.run();
