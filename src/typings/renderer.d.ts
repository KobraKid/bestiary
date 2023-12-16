import { ICollectionConfig } from "../model/Config";
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
  stopLoadingCollectionEntries: () => Promise<boolean>,
  loadEntry: (pkg: IPackageMetadata, collectionId: string, entryId: string, lang: ISO639Code) => Promise<IEntryMetadata | IMap | null>,
}

export interface IConfigAPI {
  onShowOptions: (callback: () => void) => void,
  savePkgConfig: () => Promise<void>,
  updateCollectionConfig: (pkg: IPackageMetadata, collection: ICollectionMetadata, config: ICollectionConfig) => Promise<void>,
  updateEntryCollectedStatus: (collection: ICollectionMetadata, groupId: number, entryId: string) => Promise<void>
}

export interface IMenuAPI {
  showCollectionMenu: (pkg: IPackageMetadata, collection: ICollectionMetadata) => Promise<void>,
  onConfigureCollection: (collectionManager: (pkg: IPackageMetadata, collection: ICollectionMetadata, config: ICollectionConfig) => void) => Promise<void>
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
  eval: (expression: string, scope?: object) => Promise<unknown>
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
