import { IpcRendererEvent, contextBridge, ipcRenderer } from "electron";
import path = require("path");
import chalk from "chalk";
import { IPackageMetadata, ISO639Code } from "../model/Package";
import { ICollectionMetadata, ISorting } from "../model/Collection";
import { ICollectionConfig } from "../model/Config";
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
    stopLoadingCollectionEntries: (): Promise<boolean> =>
        ipcRenderer.invoke("pkg:stop-loading-collection"),
    loadEntry: (pkg: IPackageMetadata, collectionId: string, entryId: string, lang: ISO639Code): Promise<IEntryMetadata | IMap | null> =>
        ipcRenderer.invoke("pkg:load-entry", pkg, collectionId, entryId, lang),
});

contextBridge.exposeInMainWorld("config", {
    onShowOptions: (callback: () => void) => {
        ipcRenderer.on("options:show-options", () => callback());
    },
    savePkgConfig: () =>
        ipcRenderer.send("config:save-config"),
    updateCollectionConfig: (pkg: IPackageMetadata, collection: ICollectionMetadata, config: ICollectionConfig) =>
        ipcRenderer.send("config:update-collection-config", pkg, collection, config),
    updateEntryCollectedStatus: (collection: ICollectionMetadata, groupId: number, entryId: string) =>
        ipcRenderer.send("config:update-entry-collected-status", collection, groupId, entryId)
});

contextBridge.exposeInMainWorld("menu", {
    showCollectionMenu: (pkg: IPackageMetadata, collection: ICollectionMetadata) => ipcRenderer.send("context-menu:show-collection-menu", pkg, collection),
    onConfigureCollection: (collectionManager: (pkg: IPackageMetadata, collection: ICollectionMetadata, config: ICollectionConfig) => void) => {
        ipcRenderer.removeAllListeners("context-menu:manage-collection");
        ipcRenderer.on("context-menu:manage-collection", (_event: IpcRendererEvent, pkg: IPackageMetadata, collection: ICollectionMetadata, config: ICollectionConfig) => collectionManager(pkg, collection, config));
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