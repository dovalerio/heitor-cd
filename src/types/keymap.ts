export interface KeymapFile {
  version: number;
  description: string;
  shortcuts: Partial<Record<ActionId, string>>;
}

export type ActionId =
  | 'app.goDashboard'
  | 'app.goComposer'
  | 'app.goStacks'
  | 'app.goImagesNetworks'
  | 'app.goLogs'
  | 'app.goCloud'
  | 'app.openCommandPalette'
  | 'app.focusSearch'
  | 'app.refreshCurrentView'
  | 'app.openKeymaps'
  | 'app.toggleMonitoring'
  | 'app.increaseZoom'
  | 'app.decreaseZoom'
  | 'app.resetZoom'
  | 'help.showShortcuts'
  | 'selection.toggleItem'
  | 'item.openContextMenu'
  | 'navigation.openCategoryTree'
  | 'tree.previousNode'
  | 'tree.nextNode'
  | 'tree.expandNode'
  | 'tree.collapseNode'
  | 'tree.activateNode'
  | 'composer.addService'
  | 'composer.moveServiceMode'
  | 'composer.moveServiceUp'
  | 'composer.moveServiceDown'
  | 'composer.confirmMove'
  | 'composer.cancelMove'
  | 'logs.copyStdErr'
  | 'modal.close'
  | 'dashboard.toggleStoppedContainers';

export interface ParsedShortcut {
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
  key: string;
}
