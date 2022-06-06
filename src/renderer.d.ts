import IPackage, { IPackageMetadata } from './interfaces/IPackage';

export interface IElectronAPI {
  loadPackages: () => Promise<IPackageMetadata[]>,
  loadPackage: (path: string) => Promise<IPackage | null>
}

declare global {
  interface Window {
    electronAPI: IElectronAPI
  }
}
