import { IpcRendererEvent, contextBridge, ipcRenderer } from "electron";
import path = require("path");
import chalk from "chalk";
import { IPackageMetadata, ISO639Code } from "../model/Package";
import { ICollectionMetadata, ISorting } from "../model/Collection";
import { ICollectionConfig, IPackageConfig } from "../model/Config";
import { IEntryMetadata } from "../model/Entry";
import { IMap } from "../model/Map";

contextBridge.exposeInMainWorld("pkg", {
    loadPackages: (): Promise<IPackageMetadata[]> =>
        ipcRenderer.invoke("pkg:load-pkgs"),
    loadCollection: (pkg: IPackageMetadata, collection: ICollectionMetadata): Promise<ICollectionMetadata> =>
        ipcRenderer.invoke("pkg:load-collection", pkg, collection),
    loadCollectionEntries: (pkg: IPackageMetadata, collection: ICollectionMetadata, lang: ISO639Code, sortBy?: ISorting, sortDescending?: boolean): void =>
        ipcRenderer.send("pkg:load-collection-entries", pkg, collection, lang, sortBy, sortDescending),
    onLoadCollectionEntry: (callback: (entry: IEntryMetadata) => void) => {
        ipcRenderer.removeAllListeners("pkg:on-entry-loaded");
        ipcRenderer.on("pkg:on-entry-loaded", (_event: IpcRendererEvent, entry: IEntryMetadata) => callback(entry));
    },
    onUpdatePageCount: (callback: (pageCount: number) => void) => {
        ipcRenderer.removeAllListeners("pkg:update-page-count");
        ipcRenderer.on("pkg:update-page-count", (_event: IpcRendererEvent, pageCount: number) => callback(pageCount));
    },
    onUpdatePageNumber: (callback: (page: number) => void) => {
        ipcRenderer.removeAllListeners("pkg:update-page-number");
        ipcRenderer.on("pkg:update-page-number", (_event: IpcRendererEvent, page: number) => callback(page));
    },
    prevPage: (pkg: IPackageMetadata, collection: ICollectionMetadata, lang: ISO639Code, sortBy?: ISorting, sortDescending?: boolean) =>
        ipcRenderer.send("pkg:prev-page", pkg, collection, lang, sortBy, sortDescending),
    nextPage: (pkg: IPackageMetadata, collection: ICollectionMetadata, lang: ISO639Code, sortBy?: ISorting, sortDescending?: boolean) =>
        ipcRenderer.send("pkg:next-page", pkg, collection, lang, sortBy, sortDescending),
    stopLoadingCollectionEntries: () =>
        ipcRenderer.send("pkg:stop-loading-collection"),
    loadEntry: (pkg: IPackageMetadata, collectionId: string, entryId: string, lang: ISO639Code): Promise<IEntryMetadata | IMap | null> =>
        ipcRenderer.invoke("pkg:load-entry", pkg, collectionId, entryId, lang),
    fileExists: (path: string): Promise<boolean> => ipcRenderer.invoke("pkg:file-exists", path)
});

contextBridge.exposeInMainWorld("config", {
    onShowOptions: (callback: () => void) => {
        ipcRenderer.on("options:show-options", () => callback());
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    loadPkgConfig: (pkg: any) => ipcRenderer.invoke("config:load-config", pkg),
    savePkgConfig: (pkgPath: string, config: IPackageConfig) => ipcRenderer.invoke("config:save-config", pkgPath, config),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    loadConfig: (pkg: any, collectionName: string) => ipcRenderer.invoke("config:load-collection-config", pkg, collectionName),
    saveConfig: (pkgPath: string, collectionName: string, config: ICollectionConfig[]) => ipcRenderer.invoke("config:save-collection-config", pkgPath, collectionName, config)
});

contextBridge.exposeInMainWorld("menu", {
    showCollectionMenu: (collection: string) => ipcRenderer.send("context-menu:show-collection-menu", collection),
    manageCollection: (collectionManager: (collection: string) => void) => {
        ipcRenderer.removeAllListeners("context-menu:manage-collection");
        ipcRenderer.on("context-menu:manage-collection", (_event: IpcRendererEvent, collection: string) => collectionManager(collection));
    }
});

contextBridge.exposeInMainWorld("importer", {
    importStart: (callback: () => void) => {
        ipcRenderer.on("importer:import-start", () => callback());
    },
    importUpdate: (callback: (update: string, pctComplete: number, totalPctCompletion: number) => void) => {
        ipcRenderer.on("importer:import-update", (_event: IpcRendererEvent, update: string, pctComplete: number, totalPctCompletion: number) =>
            callback(update, pctComplete, totalPctCompletion));
    },
    importComplete: (callback: () => void) => {
        ipcRenderer.on("importer:import-complete", () => callback());
    },
    importFailed: (callback: () => void) => {
        ipcRenderer.on("importer:import-failed", () => callback());
    }
});

contextBridge.exposeInMainWorld("path", {
    join: (...paths: string[]): string => {
        let joined = "";
        try {
            joined = path.join(...paths);
        } catch (err: unknown) {
            console.log(chalk.gray.bgRedBright(err));
        }
        return joined;
    },
});

contextBridge.exposeInMainWorld("log", {
    write: (...message: string[]): Promise<void> => ipcRenderer.invoke("write", message),
    writeError: (...message: string[]): Promise<void> => ipcRenderer.invoke("write-error", message)
});

contextBridge.exposeInMainWorld("formula", {
    eval: (expression: string, scope?: object) => ipcRenderer.invoke("eval-formula", expression, scope)
});