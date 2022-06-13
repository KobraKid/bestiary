import IPackage, { IPackageMetadata } from './interfaces/IPackage';

export interface IElectronAPI {
  loadPackages: () => Promise<IPackageMetadata[]>,
  loadPackage: (path: string) => Promise<IPackage | null>
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
