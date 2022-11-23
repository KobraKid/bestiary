import IPackage, { IPackageMetadata } from './model/Package';

export interface IElectronAPI {
  loadPackages: () => Promise<IPackageMetadata[]>,
  loadPackage: (path: string) => Promise<IPackage | null>,
  parsePackage: (data: string) => Promise<IPackage | null>,
  fileExists: (path: string) => Promise<boolean>,
  write: (...message: string[]) => Promise<void>,
  writeError: (...message: string[]) => Promise<void>,
}

export interface IPathAPI {
  join: (...paths: string[]) => string
}

declare global {
  interface Window {
    electronAPI: IElectronAPI,
    path: IPathAPI,
  }
}
