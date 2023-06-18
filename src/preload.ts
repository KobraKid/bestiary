import { contextBridge, ipcRenderer } from 'electron';
import path = require('path');
import chalk from 'chalk';
import { IPackageMetadata, ISO639Code } from './model/Package';
import { ICollectionMetadata } from './model/Collection';
import { ICollectionConfig, IPackageConfig } from './model/Config';
import IEntry from './model/Entry';

contextBridge.exposeInMainWorld('pkg', {
  loadPackages: (): Promise<IPackageMetadata[]> => ipcRenderer.invoke('pkg:load-pkgs'),
  loadCollection: (pkg: IPackageMetadata, collection: ICollectionMetadata, lang: ISO639Code): Promise<ICollectionMetadata> => ipcRenderer.invoke('pkg:load-collection', pkg, collection, lang),
  loadEntry: (pkg: IPackageMetadata, collection: ICollectionMetadata, entry: IEntry, lang: ISO639Code): Promise<IEntry> => ipcRenderer.invoke('pkg:load-entry', pkg, collection, entry, lang),
  fileExists: (path: string): Promise<boolean> => ipcRenderer.invoke('pkg:file-exists', path)
});

contextBridge.exposeInMainWorld('config', {
  loadPkgConfig: (pkg: any) => ipcRenderer.invoke('config:load-config', pkg),
  savePkgConfig: (pkgPath: string, config: IPackageConfig) => ipcRenderer.invoke('config:save-config', pkgPath, config),
  loadConfig: (pkg: any, collectionName: string) => ipcRenderer.invoke('config:load-collection-config', pkg, collectionName),
  saveConfig: (pkgPath: string, collectionName: string, config: ICollectionConfig[]) => ipcRenderer.invoke('config:save-collection-config', pkgPath, collectionName, config)
});

contextBridge.exposeInMainWorld('menu', {
  showCollectionMenu: (collection: string) => ipcRenderer.send('context-menu:show-collection-menu', collection),
  manageCollection: (collectionManager: (collection: string) => void) => {
    ipcRenderer.removeAllListeners('context-menu:manage-collection');
    ipcRenderer.on('context-menu:manage-collection', (_event: any, collection: string) => collectionManager(collection));
  }
});

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
});

contextBridge.exposeInMainWorld('formula', {
  eval: (expression: string, scope?: object) => ipcRenderer.invoke('eval-formula', expression, scope)
});