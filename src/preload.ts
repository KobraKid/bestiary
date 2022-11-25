import { contextBridge, ipcRenderer } from 'electron';
import path = require('path');
import IPackage, { IPackageMetadata } from './model/Package';
import chalk from 'chalk';

contextBridge.exposeInMainWorld('pkg', {
  loadPackages: (): Promise<IPackageMetadata[]> => ipcRenderer.invoke('pkg:load-pkgs'),
  loadPackage: (dir: string): Promise<IPackage | null> => ipcRenderer.invoke('pkg:load-pkg', dir),
  parsePackage: (data: string): Promise<IPackage | null> => ipcRenderer.invoke('pkg:parse-pkg', data)
});

contextBridge.exposeInMainWorld('menu', {
  showCollectionMenu: (collection: string) => ipcRenderer.send('context-menu:show-collection-menu', collection),
  manageCollection: (collectionManager: (collection: string) => void) => {
    ipcRenderer.removeAllListeners('context-menu:manage-collection');
    ipcRenderer.on('context-menu:manage-collection', (_event: any, collection: string) => collectionManager(collection));
  }
})

contextBridge.exposeInMainWorld('path', {
  join: (...paths: string[]): string => {
    let joined = '';
    try {
      joined = path.join(...paths);
    } catch (err: any) {
      console.log(chalk.gray.bgRedBright(err));
    }
    return joined;
  },
});

contextBridge.exposeInMainWorld('log', {
  write: (...message: string[]): Promise<void> => ipcRenderer.invoke('write', message),
  writeError: (...message: string[]): Promise<void> => ipcRenderer.invoke('write-error', message)
})