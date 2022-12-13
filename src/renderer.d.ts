import { ICollectionConfig, IPackageConfig } from './model/Config';
import IPackage, { IPackageMetadata } from './model/Package';

export interface IPkgAPI {
  loadPackages: () => Promise<IPackageMetadata[]>,
  loadPackage: (path: string) => Promise<IPackage | null>,
  parsePackage: (data: string) => Promise<IPackage | null>,
  fileExists: (path: string) => Promise<boolean>
}

export interface IConfigAPI {
  loadPkgConfig: (pkg: IPackage) => Promise<IPackageConfig>,
  savePkgConfig: (pkgPath: string, config: IPackageConfig) => Promise<void>,
  loadConfig: (pkg: IPackage, collectionName: string) => Promise<ICollectionConfig[]>,
  saveConfig: (pkgPath: string, collectionName: string, config: ICollectionConfig[]) => Promise<void>
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

export interface IFormulaAPI {
  eval: (expression: string, scope?: object) => Promise<any>
}

declare global {
  interface Window {
    pkg: IPkgAPI,
    config: IConfigAPI,
    menu: IMenuAPI,
    path: IPathAPI,
    log: ILoggingAPI,
    formula: IFormulaAPI
  }
}
