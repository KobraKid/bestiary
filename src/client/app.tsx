import React, { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { CollectionMenu, PackageMenu } from "./components/menu";
import { DISPLAY_MODE, useViewModel } from "./hooks/useViewModel";
import useScript from "./hooks/useScript";
import { Options } from "./components/options";
import { PackageContext } from "./context";
import { ICollectionMetadata, ISorting } from "../model/Collection";
import { IEntryMetadata } from "../model/Entry";
import { IMap } from "../model/Map";
import { Collection } from "./components/collection";
import { Entry } from "./components/entry";
import { Map } from "./components/map";
import { GroupSettingsView } from "./components/group";
import { ImportView } from "./components/importview";
import "./styles/app.scss";
import "./styles/transitions.scss";
import "./styles/importer.scss";

/**
 * Represents a view frame for backwards navigation
 */
export interface ViewStackframe {
    /** The view's collection */
    collection: ICollectionMetadata,
    /** The view's entry - null or undefined if the previous frame was in collection mode */
    entry?: IEntryMetadata,
}

/**
 * The app entry point
 * @returns The app
 */
const App: React.FC = () => {
    const [optionsVisible, setOptionsVisible] = useState(false);
    const [pkgMenuExpanded, setPkgMenuExpanded] = useState(false);
    const {
        view,
        canNavigateBack,
        selectPkg,
        selectCollection,
        updateCollection,
        selectEntry,
        addEntryToCollection,
        navigateBack,
        prevPage, nextPage
    } = useViewModel();

    const handleLinkEvent = useCallback((e: CustomEvent) => {
        const link = e.detail.split(".");
        if (link.length === 2) {
            selectEntry(link[0], link[1]);
        }
    }, [selectEntry]);

    useEffect(() => {
        window.config.onShowOptions(() => setOptionsVisible(true));
        window.pkg.onLoadCollectionEntry(addEntryToCollection);
    }, []);

    useEffect(() => {
        window.addEventListener("link", handleLinkEvent, false);
        return () => window.removeEventListener("link", handleLinkEvent);
    }, [handleLinkEvent]);

    return (
        <>
            <Options show={optionsVisible} />
            <div className={pkgMenuExpanded ? "app-pkg-menu-expanded" : "app-pkg-menu-collapsed"}>
                <ImportView />
                <GroupSettingsView />
                <PackageContext.Provider value={{ pkg: view.pkg, selectCollection, selectEntry }}>
                    <PackageMenu
                        expanded={pkgMenuExpanded}
                        setExpanded={setPkgMenuExpanded}
                        onPackageClicked={selectPkg} />
                    {view.pkg &&
                        <>
                            <CollectionMenu
                                collections={view.pkg.collections}
                                pkgMenuExpanded={pkgMenuExpanded}
                                canNavigateBack={canNavigateBack}
                                onBackArrowClicked={navigateBack}
                                onCollectionClicked={selectCollection} />
                            <Page
                                collection={view.collection}
                                updateCollection={updateCollection}
                                prevPage={prevPage}
                                nextPage={nextPage}
                                entry={view.entry}
                                displayMode={view.displayMode} />
                        </>
                    }
                </PackageContext.Provider>
            </div>
        </>
    );
};

interface IPageProps {
    collection: ICollectionMetadata,
    updateCollection: (sortBy?: ISorting, sortDescending?: boolean) => void,
    entry: IEntryMetadata | undefined,
    displayMode: DISPLAY_MODE,
    prevPage: () => void,
    nextPage: () => void
}

const Page: React.FC<IPageProps> = (props: IPageProps) => {
    const { collection, updateCollection, entry, displayMode, prevPage, nextPage } = props;

    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);

    useEffect(() => {
        window.pkg.onUpdatePageCount(pageCount =>
            setTotalPages(pageCount));
        window.pkg.onUpdatePageNumber(page =>
            setCurrentPage(page + 1));
    });

    useScript(entry?.script);

    switch (displayMode) {
        case DISPLAY_MODE.collection:
            return (collection && collection.ns.length > 0)
                ? <Collection
                    collection={collection}
                    updateCollection={updateCollection}
                    currentPage={currentPage} totalPages={totalPages}
                    prevPage={prevPage} nextPage={nextPage} />
                : null;
        case DISPLAY_MODE.entry:
            return entry ? <Entry entry={entry} /> : null;
        case DISPLAY_MODE.map:
            return entry ? <Map map={entry as IMap} /> : null;
        default:
            return null;
    }
};

const container = document.getElementById("app");
const root = createRoot(container!);
root.render(<App />);
