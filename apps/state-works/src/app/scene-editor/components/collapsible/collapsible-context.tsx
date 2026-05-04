import { type Accessor, createContext, useContext } from 'solid-js';

type CollapsibleContextValue = {
  open: Accessor<boolean>;
  onOpenChange: (
    event: Event & { currentTarget: HTMLInputElement; target: HTMLInputElement }
  ) => void;
};

export const CollapsibleContext = createContext<CollapsibleContextValue>();

export const useCollapsible = (): CollapsibleContextValue => {
  const context = useContext(CollapsibleContext);

  if (context === undefined) {
    throw new Error('useCollapsible must be used within a Collapsible');
  }

  return context;
};
