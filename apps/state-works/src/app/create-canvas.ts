import { html } from '@xstate-workshop/utils';

export function createCanvas(id: string): HTMLCanvasElement {
  const element = document.getElementById(id);

  if (element === null) throw new Error(`Element with id "${id}" is missing`);

  element.innerHTML = html`
    <div class="h-screen w-screen overflow-hidden">
      <canvas class="scene outline-none"></canvas>
    </div>
  `;

  const canvas = document.querySelector<HTMLCanvasElement>('canvas.scene');
  if (canvas === null) throw new Error('Scene canvas element is missing');

  return canvas;
}
