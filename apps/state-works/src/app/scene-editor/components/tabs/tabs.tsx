import {
  type Component,
  type ComponentProps,
  createSignal,
  splitProps,
} from 'solid-js';

import { cn } from '@xstate-workshop/utils';

import { TabsContext } from './tabs-context';

type TabsProps = Omit<ComponentProps<'div'>, 'value'> & {
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

export const Tabs: Component<TabsProps> = (props) => {
  const [local, rest] = splitProps(props, [
    'children',
    'class',
    'defaultValue',
    'onValueChange',
  ]);

  const [value, setValue] = createSignal<string | undefined>(
    local.defaultValue
  );

  const onValueChange = (value: string) => {
    local.onValueChange?.(value);
    setValue(value);
  };

  return (
    <TabsContext.Provider value={{ onValueChange, value }}>
      <div class={cn('flex flex-col', local.class)} {...rest}>
        {local.children}
      </div>
    </TabsContext.Provider>
  );
};
