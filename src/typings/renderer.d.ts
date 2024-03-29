import { GroupForConfig, IAppConfig, IGroupConfig, IServerInstance } from "../model/Config";
import { IPackageMetadata, ISO639Code } from "../model/Package";
import { IGroupMetadata, IGroupSettings, ISortSettings } from "../model/Group";
import { IEntryMetadata } from "../model/Entry";
import { IMap } from "../model/Map";
import { RecompileOption } from "../client/components/tasks/compileView";

export interface IPkgAPI {
    loadPackages: () => Promise<IPackageMetadata[]>,
    loadPackagesForServer: (server: IServerInstance) => Promise<IPackageMetadata[]>,
    loadGroup: (pkg: IPackageMetadata, group: IGroupMetadata) => Promise<IGroupMetadata | null>,
    loadGroupEntries: (pkg: IPackageMetadata, group: IGroupMetadata, lang: ISO639Code, sortBy?: ISortSettings, groupBy?: IGroupSettings) => Promise<IEntryMetadata[]>,
    onLoadGroupEntry: (callback: (entry: IEntryMetadata) => void) => void,
    onUpdatePageCount: (callback: (pageCount: number) => void) => void,
    onUpdatePageNumber: (callback: (page: number) => void) => void,
    prevPage: (pkg: IPackageMetadata, group: IGroupMetadata, lang: ISO639Code, sortBy?: ISortSettings, sortDescending?: boolean) => Promise<IEntryMetadata[]>,
    nextPage: (pkg: IPackageMetadata, group: IGroupMetadata, lang: ISO639Code, sortBy?: ISortSettings, sortDescending?: boolean) => Promise<IEntryMetadata[]>,
    loadEntry: (pkg: IPackageMetadata, groupId: string, entryId: string, lang: ISO639Code) => Promise<IEntryMetadata | IMap | null>,
}

export interface IConfigAPI {
    saveAppConfig: (config?: IAppConfig) => void,
    onUpdateAppConfig: (callback: (config: IAppConfig) => void) => void,
    savePkgConfig: () => Promise<void>,
    updateGroupConfig: (pkg: IPackageMetadata, group: IGroupMetadata, config: GroupForConfig) => Promise<void>,
    onUpdateGroupConfig: (callback: (config: IGroupConfig) => void) => void,
    updateEntryCollectedStatus: (group: IGroupMetadata, groupId: number, entryId: string, value?: number) => Promise<void>
}

export interface IMenuAPI {
    onShowOptions: (callback: () => void) => void,
    onShowCompile: (callback: () => void) => void,
    showGroupMenu: (pkg: IPackageMetadata, group: IGroupMetadata) => Promise<void>,
    onConfigureGroup: (groupManager: (pkg: IPackageMetadata, group: IGroupMetadata, config: IGroupConfig) => void) => Promise<void>,
    actionComplete: () => void
}

export interface ITaskAPI {
    taskUpdate: (callback: (update: string, pctComplete: number, totalPctCompletion: number) => void) => void,
    taskComplete: (callback: () => void) => void,
    taskFailed: (callback: () => void) => void,
    // specific tasks
    importPackage: (callback: () => void) => void,
    compilePackage: (pkg: IPackageMetadata, compileAllGroups: boolean, recompileOption: RecompileOption, groupCompilationSettings: boolean[]) => void,
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
        task: ITaskAPI,
        path: IPathAPI,
        log: ILoggingAPI,
        formula: IFormulaAPI
    }
}
