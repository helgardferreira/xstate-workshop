import {
  type Component,
  type ComponentProps,
  type JSX,
  Show,
  createSignal,
  splitProps,
} from 'solid-js';

import { cn } from '@xstate-workshop/utils';

type EditorCollapsibleProps = ComponentProps<'div'> & {
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: JSX.Element;
};

export const EditorCollapsible: Component<EditorCollapsibleProps> = (props) => {
  const [local, rest] = splitProps(props, [
    'children',
    'class',
    'defaultOpen',
    'onOpenChange',
    'title',
  ]);

  const [open, setOpen] = createSignal(local.defaultOpen ?? false);

  const handleOpenChange = (
    event: Event & { currentTarget: HTMLInputElement; target: HTMLInputElement }
  ) => {
    if (typeof local.onOpenChange === 'function') {
      local.onOpenChange(event.target.checked);
    }

    setOpen(event.target.checked);
  };

  return (
    <div
      class={cn(
        'collapse-plus bg-base-100 border-base-300 collapse border',
        local.class
      )}
      {...rest}
    >
      <input
        checked={open()}
        class="peer"
        onChange={handleOpenChange}
        type="checkbox"
      />

      <div class="collapse-title text-xs">
        <Show fallback={<br />} when={!!local.title}>
          {local.title}
        </Show>
      </div>
      <div class="collapse-content">{local.children}</div>
    </div>
  );
};
