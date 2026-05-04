import { type Component, type ParentProps } from 'solid-js';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTitle,
} from '../../components';

export const EditorPanel: Component<ParentProps> = (props) => {
  return (
    <div class="absolute top-0 right-0 h-full overflow-hidden p-4">
      <Collapsible
        class="bg-base-200 border-primary w-editor-width pointer-events-auto overflow-hidden"
        defaultOpen
      >
        <CollapsibleTitle>
          <h1 class="text-sm">Scene Editor</h1>
        </CollapsibleTitle>

        <CollapsibleContent class="p-0">
          <div class="h-editor-height flex flex-col overflow-auto">
            {props.children}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
