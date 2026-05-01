/* @refresh reload */
import { render } from 'solid-js/web';

import { SceneEditor } from './scene-editor';

export function createSceneEditor(id: string): () => void {
  const element = document.getElementById(id) as HTMLElement;

  if (import.meta.env.DEV && !(element instanceof HTMLElement)) {
    throw new Error(`Element with id "${id}" is missing`);
  }

  return render(() => <SceneEditor />, element);
}
