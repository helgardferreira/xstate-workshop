import { type Accessor, createContext, useContext } from 'solid-js';

type TabsContextValue = {
  onValueChange: (value: string) => void;
  value: Accessor<string | undefined>;
};

export const TabsContext = createContext<TabsContextValue>();

export const useTabs = (): TabsContextValue => {
  const context = useContext(TabsContext);

  if (context === undefined) {
    throw new Error('useTabs must be used within a Tabs');
  }

  return context;
};
