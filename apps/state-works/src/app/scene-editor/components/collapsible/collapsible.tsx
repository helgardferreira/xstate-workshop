import {
  type Component,
  type ComponentProps,
  createSignal,
  splitProps,
} from 'solid-js';

import { cn } from '@xstate-workshop/utils';

import { CollapsibleContext } from './collapsible-context';

type CollapsibleProps = ComponentProps<'div'> & {
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export const Collapsible: Component<CollapsibleProps> = (props) => {
  const [local, rest] = splitProps(props, [
    'children',
    'class',
    'defaultOpen',
    'onOpenChange',
  ]);

  const [open, setOpen] = createSignal(local.defaultOpen ?? false);

  const onOpenChange = (
    event: Event & { currentTarget: HTMLInputElement; target: HTMLInputElement }
  ) => {
    if (typeof local.onOpenChange === 'function') {
      local.onOpenChange(event.target.checked);
    }

    setOpen(event.target.checked);
  };

  return (
    <CollapsibleContext.Provider value={{ open, onOpenChange }}>
      <div
        class={cn(
          'collapse-plus bg-base-100 border-base-300 collapse border',
          local.class
        )}
        {...rest}
      >
        {local.children}
      </div>
    </CollapsibleContext.Provider>
  );
};
