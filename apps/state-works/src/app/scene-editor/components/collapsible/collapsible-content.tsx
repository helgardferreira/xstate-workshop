import { type Component, type ComponentProps, splitProps } from 'solid-js';

import { cn } from '@xstate-workshop/utils';

type CollapsibleContentProps = ComponentProps<'div'>;

export const CollapsibleContent: Component<CollapsibleContentProps> = (
  props
) => {
  const [local, rest] = splitProps(props, ['children', 'class']);

  return (
    <div class={cn('collapse-content', local.class)} {...rest}>
      {local.children}
    </div>
  );
};
