import { type Component, Show } from 'solid-js';

import { useSelector } from '@xstate-workshop/solid-xstate';

import { EditorPanel, SceneEntitiesSection } from './features';
import { useSceneEditor } from './scene-editor-context';

// TODO: implement modal for deleting scene entities and mount here
export const SceneEditor: Component = () => {
  const { sceneManagerActor } = useSceneEditor();

  const currentScene = useSelector(
    sceneManagerActor,
    (snapshot) => snapshot.context.currentScene
  );

  const sceneEntities = () => currentScene().entities;

  return (
    <>
      <EditorPanel>
        <Show when={sceneEntities().length}>
          <SceneEntitiesSection entities={sceneEntities()} />
        </Show>
      </EditorPanel>
    </>
  );
};
