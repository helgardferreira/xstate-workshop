import {
  type Component,
  type ComponentProps,
  Show,
  splitProps,
} from 'solid-js';

import { useTabs } from './tabs-context';

type TabsContentProps = ComponentProps<'div'> & {
  value: string;
};

export const TabsContent: Component<TabsContentProps> = (props) => {
  const [local, rest] = splitProps(props, ['children', 'value']);

  const { value } = useTabs();

  return (
    <Show when={value() === local.value}>
      <div {...rest}>{local.children}</div>
    </Show>
  );
};
