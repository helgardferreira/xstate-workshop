import { html } from '@xstate-workshop/utils';

export function createCanvas(): HTMLCanvasElement {
  const root = document.getElementById('root');

  if (root === null) throw new Error('Root element is missing');

  root.innerHTML = html`
    <div class="h-screen w-screen overflow-hidden">
      <canvas class="scene outline-none"></canvas>
    </div>
  `;

  const canvas = document.querySelector<HTMLCanvasElement>('canvas.scene');
  if (canvas === null) throw new Error('Scene canvas element is missing');

  return canvas;
}
