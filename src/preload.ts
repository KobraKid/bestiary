import { contextBridge, ipcRenderer } from 'electron';
import path = require('path');
import IPackage, { IPackageMetadata } from './interfaces/IPackage';

contextBridge.exposeInMainWorld('electronAPI', {
  loadPackages: (): Promise<IPackageMetadata[]> => ipcRenderer.invoke('load-pkgs'),
  loadPackage: (path: string): Promise<IPackage | null> => ipcRenderer.invoke('load-pkg', path)
});

contextBridge.exposeInMainWorld('path', {
  join: (...paths: string[]): string => {
    let joined = "";
    try {
      joined = path.join(...paths);
    } catch (err: any) {
      console.log(err);
    }
    return joined;
  },
});