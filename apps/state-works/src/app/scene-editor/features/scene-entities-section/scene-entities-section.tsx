import { InfoIcon } from 'lucide-solid';
import { type Component, For, Show, createSignal } from 'solid-js';

import { cn } from '@xstate-workshop/utils';

import type { AppEntity } from '../../../schemas';

import { SceneEntityTransform } from './scene-entity-transform/scene-entity-transform';

type SceneEntitiesSectionProps = {
  entities: AppEntity[];
};

export const SceneEntitiesSection: Component<SceneEntitiesSectionProps> = (
  props
) => {
  const [selectedEntity, setSelectedEntity] = createSignal<AppEntity>();

  return (
    <div class="border-primary flex flex-col space-y-2 border-t border-b p-4">
      <h2 class="text-sm">Entities</h2>

      <div class="flex flex-col space-y-4">
        <ul class="menu menu-sm bg-base-300 rounded-box w-full">
          <For each={props.entities}>
            {(entity) => (
              <li>
                <button
                  class={cn(
                    'grid grid-cols-[6rem_auto]',
                    selectedEntity() === entity && 'menu-active'
                  )}
                  onClick={() => setSelectedEntity(entity)}
                >
                  <span class="truncate">{entity.model}</span>
                  <span class="text-base-content/50 truncate">{entity.id}</span>
                </button>
              </li>
            )}
          </For>
        </ul>

        <Show
          when={selectedEntity()}
          fallback={
            <div class="alert alert-info alert-soft">
              <InfoIcon />
              <span>Select entity to view Transform</span>
            </div>
          }
        >
          <SceneEntityTransform entity={selectedEntity()!} />
        </Show>
      </div>
    </div>
  );
};
