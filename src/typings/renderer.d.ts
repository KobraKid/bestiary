import { ICollectionConfig, IPackageConfig } from "../model/Config";
import { IPackageMetadata, ISO639Code } from "../model/Package";
import { ICollectionMetadata, ISorting } from "../model/Collection";
import { IEntryMetadata } from "../model/Entry";
import { IMap } from "../model/Map";

export interface IPkgAPI {
  loadPackages: () => Promise<IPackageMetadata[]>,
  loadCollection: (pkg: IPackageMetadata, collection: ICollectionMetadata) => Promise<ICollectionMetadata>,
  loadCollectionEntries: (pkg: IPackageMetadata, collection: ICollectionMetadata, lang: ISO639Code, sortBy?: ISorting, sortDescending?: boolean) => void,
  onLoadCollectionEntry: (callback: (entry: IEntryMetadata) => void) => void,
  onUpdatePageCount: (callback: (pageCount: number) => void) => void,
  onUpdatePageNumber: (callback: (page: number) => void) => void,
  prevPage: (pkg: IPackageMetadata, collection: ICollectionMetadata, lang: ISO639Code, sortBy?: ISorting, sortDescending?: boolean) => void,
  nextPage: (pkg: IPackageMetadata, collection: ICollectionMetadata, lang: ISO639Code, sortBy?: ISorting, sortDescending?: boolean) => void,
  stopLoadingCollectionEntries: () => void,
  loadEntry: (pkg: IPackageMetadata, collectionId: string, entryId: string, lang: ISO639Code) => Promise<IEntryMetadata | IMap | null>,
  fileExists: (path: string) => Promise<boolean>
}

export interface IConfigAPI {
  onShowOptions: (callback: () => void) => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  loadPkgConfig: (pkg: any) => Promise<IPackageConfig>,
  savePkgConfig: (pkgPath: string, config: IPackageConfig) => Promise<void>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  loadConfig: (pkg: any, collectionName: string) => Promise<ICollectionConfig[]>,
  saveConfig: (pkgPath: string, collectionName: string, config: ICollectionConfig[]) => Promise<void>
}

export interface IMenuAPI {
  showCollectionMenu: (collection: string) => Promise<void>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  manageCollection: (collectionManager: (collection: string) => void) => any
}

export interface IImporterAPI {
  importStart: (callback: () => void) => void,
  importUpdate: (callback: (update: string, pctComplete: number, totalPctCompletion: number) => void) => void,
  importComplete: (callback: () => void) => void,
  importFailed: (callback: () => void) => void
}

export interface IPathAPI {
  join: (...paths: string[]) => string
}

export interface ILoggingAPI {
  write: (...message: string[]) => Promise<void>,
  writeError: (...message: string[]) => Promise<void>,
}

export interface IFormulaAPI {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
