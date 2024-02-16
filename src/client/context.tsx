import { createContext } from "react";
import { IPackageMetadata } from "../model/Package";
import { IGroupMetadata, IGroupSettings, ISortSettings } from "../model/Group";
import { IAppConfig, IGroupConfig, IPackageConfig } from "../model/Config";

interface IAppContext {
    config?: IAppConfig
}

export const AppContext = createContext<IAppContext>({});

interface IPackageContext {
    pkg: IPackageMetadata,
    selectGroup: (group: IGroupMetadata) => void,
    updateGroup: (sortBy?: ISortSettings, groupBy?: IGroupSettings) => void,
    selectEntry: (groupId: string, entryId: string) => void
}

export const PackageContext = createContext<IPackageContext>({
    pkg: {
        name: "",
        ns: "",
        path: "",
        icon: "",
        groups: [],
        langs: []
    },
    selectGroup: () => { },
    updateGroup: () => { },
    selectEntry: () => { }
});

interface IPackageConfigContext {
    pkgConfig: IPackageConfig
}

export const PackageConfigContext = createContext<IPackageConfigContext>({
    pkgConfig: {}
});

interface IGroupConfigContext {
    groupConfig: IGroupConfig[]
}

export const GroupConfigContext = createContext<IGroupConfigContext>({
    groupConfig: []
});