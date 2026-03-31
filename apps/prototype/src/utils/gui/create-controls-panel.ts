import { GUI } from 'lil-gui';

import { fromControlsPanelShow } from '../observable/from-controls-panel-show';

type SetupControlsPanelOptions = {
  autoPlace?: boolean;
  closeFolders?: boolean;
  container?: Node;
  hide?: boolean;
  injectStyles?: boolean;
  parent?: GUI;
  title?: string;
  touchStyles?: number;
  width?: number;
};

export function createControlsPanel(
  options: SetupControlsPanelOptions = {}
): GUI {
  const {
    autoPlace,
    closeFolders,
    container,
    hide,
    injectStyles,
    parent,
    title = 'Controls Panel',
    touchStyles,
    width = 300,
  } = options;

  const gui = new GUI({
    autoPlace,
    closeFolders,
    container,
    injectStyles,
    parent,
    title,
    touchStyles,
    width,
  });

  if (hide) gui.hide();

  fromControlsPanelShow(gui).subscribe((show) => {
    if (show) gui.show();
    else gui.hide();
  });

  return gui;
}
