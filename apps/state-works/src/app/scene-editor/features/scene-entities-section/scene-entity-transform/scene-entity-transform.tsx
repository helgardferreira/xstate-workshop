import { type Component } from 'solid-js';

import type { AppEntity } from '../../../../schemas';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTitle,
} from '../../../components';

type SceneEntityTransformProps = {
  entity: AppEntity;
};

// TODO: implement UI for this
// TODO: continue here...
export const SceneEntityTransform: Component<SceneEntityTransformProps> = (
  props
) => {
  const position = () => props.entity.transform.position;
  const rotation = () => props.entity.transform.rotation;
  const scale = () => props.entity.transform.scale;

  return (
    <Collapsible defaultOpen>
      <CollapsibleTitle>
        <h1 class="text-xs">Transform</h1>
      </CollapsibleTitle>

      <CollapsibleContent>
        <div class="overflow-x-auto">
          <table class="table-sm table table-fixed">
            <thead>
              <tr class="text-center text-xs">
                <th class="w-18" />
                <th>x</th>
                <th>y</th>
                <th>z</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Position</td>
                <td class="text-center">{position().x}</td>
                <td class="text-center">{position().y}</td>
                <td class="text-center">{position().z}</td>
              </tr>
              <tr>
                <td>Rotation</td>
                <td class="text-center">{rotation().x}</td>
                <td class="text-center">{rotation().y}</td>
                <td class="text-center">{rotation().z}</td>
              </tr>
              <tr>
                <td>Scale</td>
                <td class="text-center">{scale().x}</td>
                <td class="text-center">{scale().y}</td>
                <td class="text-center">{scale().z}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
