import { createContext, useContext } from 'solid-js';

import type { SceneManagerActorRef } from '../actors';

export type SceneEditorContextValue = {
  sceneManagerActor: SceneManagerActorRef;
};

export const SceneEditorContext = createContext<SceneEditorContextValue>();

export const useSceneEditor = (): SceneEditorContextValue => {
  const context = useContext(SceneEditorContext);

  if (context === undefined) {
    throw new Error(
      'useSceneEditor must be used within the SceneEditorContext Provider'
    );
  }

  return context;
};
