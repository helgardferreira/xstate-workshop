import {
  type Component,
  type ComponentProps,
  Show,
  splitProps,
} from 'solid-js';

import { cn } from '@xstate-workshop/utils';

import { useCollapsible } from './collapsible-context';

type CollapsibleTitleProps = ComponentProps<'div'>;

export const CollapsibleTitle: Component<CollapsibleTitleProps> = (props) => {
  const { open, onOpenChange } = useCollapsible();

  const [local, rest] = splitProps(props, ['children', 'class']);

  return (
    <>
      <input
        checked={open()}
        class="p-0"
        onChange={onOpenChange}
        type="checkbox"
      />
      <div class={cn('collapse-title', local.class)} {...rest}>
        <Show fallback={<br />} when={!!local.children}>
          {local.children}
        </Show>
      </div>
    </>
  );
};
