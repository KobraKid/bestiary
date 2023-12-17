import { createContext } from "react";
import { IPackageMetadata } from "../model/Package";
import { IGroupMetadata } from "../model/Group";
import { IGroupConfig, IPackageConfig } from "../model/Config";

interface IPackageContext {
    pkg: IPackageMetadata,
    selectGroup: (group: IGroupMetadata) => void,
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