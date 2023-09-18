import { createContext } from "react";
import { IPackageMetadata } from "./model/Package";
import { ICollectionMetadata } from "./model/Collection";
import { ICollectionConfig, IPackageConfig } from "./model/Config";

interface IPackageContext {
    pkg: IPackageMetadata,
    selectCollection: (collection: ICollectionMetadata) => void,
    selectEntry: (collectionId: string, entryId: string) => void
}

export const PackageContext = createContext<IPackageContext>({
    pkg: {
        name: "",
        ns: "",
        path: "",
        icon: "",
        collections: [],
        langs: []
    },
    selectCollection: () => { },
    selectEntry: () => { }
});

interface IPackageConfigContext {
    pkgConfig: IPackageConfig
}

export const PackageConfigContext = createContext<IPackageConfigContext>({
    pkgConfig: {}
});

interface ICollectionConfigContext {
    collectionConfig: ICollectionConfig[]
}

export const CollectionConfigContext = createContext<ICollectionConfigContext>({
    collectionConfig: []
});