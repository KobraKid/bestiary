import { contextBridge, ipcRenderer } from 'electron';
import path = require('path');
import IPackage, { IPackageMetadata } from './interfaces/IPackage';
import chalk from 'chalk';

contextBridge.exposeInMainWorld('electronAPI', {
  loadPackages: (): Promise<IPackageMetadata[]> => ipcRenderer.invoke('load-pkgs'),
  loadPackage: (dir: string): Promise<IPackage | null> => ipcRenderer.invoke('load-pkg', dir)
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