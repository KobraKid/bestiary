import { contextBridge, ipcRenderer } from 'electron';
import path = require('path');
import IPackage, { IPackageMetadata } from './model/Package';
import chalk from 'chalk';

contextBridge.exposeInMainWorld('electronAPI', {
  loadPackages: (): Promise<IPackageMetadata[]> => ipcRenderer.invoke('load-pkgs'),
  loadPackage: (dir: string): Promise<IPackage | null> => ipcRenderer.invoke('load-pkg', dir),
  parsePackage: (data: string): Promise<IPackage | null> => ipcRenderer.invoke('parse-pkg', data),
  fileExists: (path: string): Promise<boolean> => ipcRenderer.invoke('file-exists', path),
  write: (...message: string[]): Promise<void> => ipcRenderer.invoke('write', message),
  writeError: (...message: string[]): Promise<void> => ipcRenderer.invoke('write-error', message)
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