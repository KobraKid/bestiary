import { createContext } from "react";
import IPackage from "./model/Package";
import ICollection from "./model/Collection";
import IEntry from "./model/Entry";
import { ILayoutProps } from "./model/Layout";

interface IPackageContext {
    pkg: IPackage,
    selectCollection: (collection: ICollection) => void,
    selectEntry: (entry: IEntry, collection?: ICollection) => void
}

export const PackageContext = createContext<IPackageContext>({
    pkg: {
        metadata: {
            name: "",
            path: "",
            icon: "",
            color: "#000000",
            font: "",
            defs: {}
        },
        collections: []
    },
    selectCollection: () => { },
    selectEntry: () => { }
});

interface ICollectionContext {
    collection: ICollection
}

export const CollectionContext = createContext<ICollectionContext>({
    collection: {
        name: "",
        layout: {},
        layoutPreview: {},
        layoutLink: {},
        data: []
    }
});

interface IEntryContext {
    entry: IEntry,
    layout: ILayoutProps
}

export const EntryContext = createContext<IEntryContext>({
    entry: {
        id: "",
        attributes: {}
    },
    layout: {}
});