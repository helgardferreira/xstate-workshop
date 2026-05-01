import type { Component } from 'solid-js';

import { EditorCollapsible } from './components';

export const SceneEditor: Component = () => {
  return (
    <div class="absolute top-0 right-0 h-full p-4">
      <EditorCollapsible
        class="bg-base-200 border-primary pointer-events-auto w-80 overflow-hidden"
        defaultOpen
        title="Scene Editor"
      >
        <div class="h-100">
          {/* // TODO: implement scene editor UI here */}
          WIP
        </div>
      </EditorCollapsible>
    </div>
  );
};
