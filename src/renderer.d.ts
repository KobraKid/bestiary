import { ICollectionConfig, IPackageConfig } from './model/Config';
import { IPackageMetadata, ISO639Code } from './model/Package';
import { ICollectionMetadata } from './model/Collection';
import IEntry from './model/Entry';

export interface IPkgAPI {
  loadPackages: () => Promise<IPackageMetadata[]>,
  loadCollection: (pkg: IPackageMetadata, collection: ICollectionMetadata, lang: ISO639Code) => Promise<ICollectionMetadata>,
  loadEntry: (pkg: IPackageMetadata, collection: ICollectionMetadata, entry: IEntry, lang: ISO639Code) => Promise<IEntry>,
  fileExists: (path: string) => Promise<boolean>
}

export interface IConfigAPI {
  loadPkgConfig: (pkg: any) => Promise<IPackageConfig>,
  savePkgConfig: (pkgPath: string, config: IPackageConfig) => Promise<void>,
  loadConfig: (pkg: any, collectionName: string) => Promise<ICollectionConfig[]>,
  saveConfig: (pkgPath: string, collectionName: string, config: ICollectionConfig[]) => Promise<void>
}

export interface IMenuAPI {
  showCollectionMenu: (collection: string) => Promise<void>,
  manageCollection: (collectionManager: (collection: string) => void) => any
}

export interface IImporterAPI {
  importBuiltIn: (pkgName: string) => void
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
    importer: IImporterAPI,
    path: IPathAPI,
    log: ILoggingAPI,
    formula: IFormulaAPI
  }
}
