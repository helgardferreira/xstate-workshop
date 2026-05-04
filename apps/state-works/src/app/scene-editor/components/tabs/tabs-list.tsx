import { type Component, type ComponentProps, splitProps } from 'solid-js';

import { cn } from '@xstate-workshop/utils';

type TabsListProps = ComponentProps<'div'>;

export const TabsList: Component<TabsListProps> = (props) => {
  const [local, rest] = splitProps(props, ['children', 'class']);

  return (
    <div role="tablist" class={cn('tabs tabs-box', local.class)} {...rest}>
      {local.children}
    </div>
  );
};
