import { IpcRendererEvent, contextBridge, ipcRenderer } from "electron";
import path = require("path");
import chalk from "chalk";
import { IPackageMetadata, ISO639Code } from "../model/Package";
import { IGroupMetadata, IGroupSettings, ISortSettings } from "../model/Group";
import { GroupForConfig, IAppConfig, IGroupConfig, IServerInstance } from "../model/Config";
import { IEntryMetadata } from "../model/Entry";
import { IMap } from "../model/Map";
import { RecompileOption } from "../client/components/tasks/compileView";

contextBridge.exposeInMainWorld("pkg", {
    loadPackages: (): Promise<IPackageMetadata[]> =>
        ipcRenderer.invoke("pkg:load-pkgs"),
    loadPackagesForServer: (server: IServerInstance): Promise<IPackageMetadata[]> =>
        ipcRenderer.invoke("pkg:load-pkgs-for-server", server),
    loadGroup: (pkg: IPackageMetadata, group: IGroupMetadata): Promise<IGroupMetadata | null> =>
        ipcRenderer.invoke("pkg:load-group", pkg, group),
    loadGroupEntries: (pkg: IPackageMetadata, group: IGroupMetadata, lang: ISO639Code, sortBy?: ISortSettings, groupBy?: IGroupSettings) =>
        ipcRenderer.invoke("pkg:load-group-entries", pkg, group, lang, sortBy, groupBy),
    onLoadGroupEntry: (callback: (entry: IEntryMetadata) => void) => {
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
    prevPage: (pkg: IPackageMetadata, group: IGroupMetadata, lang: ISO639Code, sortBy?: ISortSettings, sortDescending?: boolean) =>
        ipcRenderer.invoke("pkg:prev-page", pkg, group, lang, sortBy, sortDescending),
    nextPage: (pkg: IPackageMetadata, group: IGroupMetadata, lang: ISO639Code, sortBy?: ISortSettings, sortDescending?: boolean) =>
        ipcRenderer.invoke("pkg:next-page", pkg, group, lang, sortBy, sortDescending),
    loadEntry: (pkg: IPackageMetadata, groupId: string, entryId: string, lang: ISO639Code): Promise<IEntryMetadata | IMap | null> =>
        ipcRenderer.invoke("pkg:load-entry", pkg, groupId, entryId, lang),
});

contextBridge.exposeInMainWorld("config", {
    saveAppConfig: (config?: IAppConfig) =>
        ipcRenderer.send("config:save-app-config", config),
    onUpdateAppConfig: (callback: (config: IAppConfig) => void) => {
        ipcRenderer.removeAllListeners("config:updated-app-config");
        ipcRenderer.on("config:updated-app-config", (_event: IpcRendererEvent, config: IAppConfig) => callback(config));
    },
    savePkgConfig: () =>
        ipcRenderer.send("config:save-pkg-config"),
    updateGroupConfig: (pkg: IPackageMetadata, group: IGroupMetadata, config: GroupForConfig) =>
        ipcRenderer.send("config:update-group-config", pkg, group, config),
    onUpdateGroupConfig: (callback: (config: IGroupConfig) => void) => {
        ipcRenderer.removeAllListeners("config:updated-group-config");
        ipcRenderer.on("config:updated-group-config", (_event: IpcRendererEvent, config: IGroupConfig) => callback(config));
    },
    updateEntryCollectedStatus: (group: IGroupMetadata, groupId: number, entryId: string, value?: number) =>
        ipcRenderer.send("config:update-entry-collected-status", group, groupId, entryId, value)
});

contextBridge.exposeInMainWorld("menu", {
    onShowOptions: (callback: () => void) => ipcRenderer.on("menu:show-options", () => callback()),
    onShowCompile: (callback: () => void) => ipcRenderer.on("menu:show-compile", () => callback()),
    showGroupMenu: (pkg: IPackageMetadata, group: IGroupMetadata) => ipcRenderer.send("context-menu:show-group-menu", pkg, group),
    onConfigureGroup: (groupManager: (pkg: IPackageMetadata, group: IGroupMetadata, config: IGroupConfig) => void) => {
        ipcRenderer.removeAllListeners("context-menu:manage-group");
        ipcRenderer.on("context-menu:manage-group", (_event: IpcRendererEvent, pkg: IPackageMetadata, group: IGroupMetadata, config: IGroupConfig) => groupManager(pkg, group, config));
    },
    actionComplete: () => ipcRenderer.send("action-complete")
});

contextBridge.exposeInMainWorld("task", {
    taskUpdate: (callback: (update: string, pctComplete: number, totalPctCompletion: number) => void) => {
        ipcRenderer.on("task:task-update", (_event: IpcRendererEvent, update: string, pctComplete: number, totalPctCompletion: number) =>
            callback(update, pctComplete, totalPctCompletion));
    },
    taskComplete: (callback: () => void) => {
        ipcRenderer.on("task:task-complete", () => callback());
    },
    taskFailed: (callback: () => void) => {
        ipcRenderer.on("task:task-failed", () => callback());
    },
    // specific tasks
    importPackage: (callback: () => void) => ipcRenderer.on("task:import", () => callback()),
    compilePackage: (pkg: IPackageMetadata, compileAllGroups: boolean, recompileOption: RecompileOption, groupCompilationSettings: boolean[]) => {
        ipcRenderer.send("task:compile", pkg, compileAllGroups, recompileOption, groupCompilationSettings);
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