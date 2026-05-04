/* @refresh reload */
import { render } from 'solid-js/web';

import { SceneEditor } from './scene-editor';
import {
  SceneEditorContext,
  type SceneEditorContextValue,
} from './scene-editor-context';

type CreateSceneEditorOptions = {
  context: SceneEditorContextValue;
  elementId: string;
};

export function createSceneEditor({
  context,
  elementId,
}: CreateSceneEditorOptions): () => void {
  const element = document.getElementById(elementId) as HTMLElement;

  if (import.meta.env.DEV && !(element instanceof HTMLElement)) {
    throw new Error(`Element with id "${elementId}" is missing`);
  }

  return render(
    () => (
      <SceneEditorContext.Provider value={context}>
        <SceneEditor />
      </SceneEditorContext.Provider>
    ),
    element
  );
}
