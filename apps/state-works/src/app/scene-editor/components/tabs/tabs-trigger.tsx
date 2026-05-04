import { type Component, type ComponentProps, splitProps } from 'solid-js';

import { cn } from '@xstate-workshop/utils';

import { useTabs } from './tabs-context';

type TabsTriggerProps = Omit<ComponentProps<'button'>, 'onClick'> & {
  value: string;
};

export const TabsTrigger: Component<TabsTriggerProps> = (props) => {
  const [local, rest] = splitProps(props, ['children', 'class', 'value']);

  const { onValueChange, value } = useTabs();

  const handleClick = () => onValueChange(local.value);

  return (
    <button
      role="tab"
      class={cn('tab', value() === local.value && 'tab-active', local.class)}
      onClick={handleClick}
      {...rest}
    >
      {local.children}
    </button>
  );
};
