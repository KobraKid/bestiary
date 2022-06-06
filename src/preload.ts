const { contextBridge, ipcRenderer } = require('electron');
import IPackage, { IPackageMetadata } from './interfaces/IPackage';

contextBridge.exposeInMainWorld('electronAPI', {
  loadPackages: (): Promise<IPackageMetadata[]> => ipcRenderer.invoke('load-pkgs'),
  loadPackage: (path: string): Promise<IPackage | null> => ipcRenderer.invoke('load-pkg', path)
});
