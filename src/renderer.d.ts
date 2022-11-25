import IPackage, { IPackageMetadata } from './model/Package';

export interface IPkgAPI {
  loadPackages: () => Promise<IPackageMetadata[]>,
  loadPackage: (path: string) => Promise<IPackage | null>,
  parsePackage: (data: string) => Promise<IPackage | null>,
  fileExists: (path: string) => Promise<boolean>
}

export interface IMenuAPI {
  showCollectionMenu: (collection: string) => Promise<void>,
  manageCollection: (collectionManager: (collection: string) => void) => any
}

export interface IPathAPI {
  join: (...paths: string[]) => string
}

export interface ILoggingAPI {
  write: (...message: string[]) => Promise<void>,
  writeError: (...message: string[]) => Promise<void>,
}

declare global {
  interface Window {
    pkg: IPkgAPI,
    menu: IMenuAPI,
    path: IPathAPI,
    log: ILoggingAPI
  }
}
