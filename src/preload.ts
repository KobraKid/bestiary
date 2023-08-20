import { IpcRendererEvent, contextBridge, ipcRenderer } from 'electron';
import path = require('path');
import chalk from 'chalk';
import { IPackageSchema, ISO639Code } from './model/Package';
import { ICollectionMetadata } from './model/Collection';
import { ICollectionConfig, IPackageConfig } from './model/Config';
import { IEntryMetadata } from './model/Entry';

contextBridge.exposeInMainWorld('pkg', {
  loadPackages: (): Promise<IPackageSchema[]> => ipcRenderer.invoke('pkg:load-pkgs'),
  loadCollection: (pkg: IPackageSchema, collection: ICollectionMetadata, lang: ISO639Code): Promise<ICollectionMetadata> => ipcRenderer.invoke('pkg:load-collection', pkg, collection, lang),
  loadCollectionEntries: (pkg: IPackageSchema, collection: ICollectionMetadata, lang: ISO639Code): void => ipcRenderer.send('pkg:load-collection-entries', pkg, collection, lang),
  onLoadCollectionEntry: (callback: (entry: IEntryMetadata) => void) => {
    ipcRenderer.removeAllListeners('pkg:load-collection-entry');
    ipcRenderer.on('pkg:load-collection-entry', (_event: IpcRendererEvent, entry: IEntryMetadata) => callback(entry));
  },
  stopLoadingCollectionEntries: () => ipcRenderer.send('pkg:stop-loading-collection'),
  loadEntry: (pkg: IPackageSchema, collection: ICollectionMetadata, entryId: string, lang: ISO639Code): Promise<IEntryMetadata | null> => ipcRenderer.invoke('pkg:load-entry', pkg, collection, entryId, lang),
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

contextBridge.exposeInMainWorld('importer', {
  importStart: (callback: Function) => {
    ipcRenderer.on('importer:import-start', (_event: any) => callback());
  },
  importUpdate: (callback: (update: string) => void) => {
    ipcRenderer.on('importer:import-update', (_event: any, update: string) => callback(update));
  },
  importComplete: (callback: Function) => {
    ipcRenderer.on('importer:import-complete', (_event: any) => callback());
  },
  importFailed: (callback: Function) => {
    ipcRenderer.on('importer:import-failed', (_event: any) => callback());
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