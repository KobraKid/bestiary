import React, { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { CollectionMenu, PackageMenu } from "./menu";
import { DISPLAY_MODE, useViewModel } from "./hooks/useViewModel";
import { PackageConfigContext, PackageContext } from "./context";
import { ICollectionMetadata } from "./model/Collection";
import { IEntryMetadata } from "./model/Entry";
import { Entry } from "./entry";
import "./styles/app.scss";
import "./styles/transitions.scss";
import "./styles/importer.scss";
import { Collection } from "./collection";

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
    const [pkgMenuExpanded, setPkgMenuExpanded] = useState(false);
    const {
        view,
        canNavigateBack,
        selectPkg,
        selectCollection,
        selectEntry,
        addEntryToCollection,
        pkgConfig, // updatePkgConfig,
        navigateBack
    } = useViewModel();

    const handleLinkEvent = useCallback((e: CustomEvent) => {
        const link = e.detail.split(".");
        if (link.length === 2) {
            selectEntry(link[0], link[1]);
        }
    }, [selectEntry]);

    useEffect(() => {
        window.pkg.onLoadCollectionEntry(addEntryToCollection);
    }, []);

    useEffect(() => {
        window.addEventListener("link", handleLinkEvent, false);
        return () => window.removeEventListener("link", handleLinkEvent);
    }, [handleLinkEvent]);

    return (
        <div className={pkgMenuExpanded ? "app-pkg-menu-expanded" : "app-pkg-menu-collapsed"}>
            <ImportView />
            <PackageContext.Provider value={{ pkg: view.pkg, selectCollection, selectEntry }}>
                <PackageConfigContext.Provider value={{ pkgConfig }}>
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
                            <Page collection={view.collection} entry={view.entry} displayMode={view.displayMode} />
                        </>
                    }
                </PackageConfigContext.Provider>
            </PackageContext.Provider>
        </div>
    );
};

interface IPageProps {
    collection: ICollectionMetadata,
    entry: IEntryMetadata | undefined,
    displayMode: DISPLAY_MODE
}

const Page: React.FC<IPageProps> = (props: IPageProps) => {
    const { collection, entry, displayMode } = props;

    const entriesPerPage = 50;

    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);

    const prevPage = useCallback(() => setCurrentPage(page => Math.max(page - 1, 1)), []);
    const nextPage = useCallback((totalPages: number) => setCurrentPage(page => Math.min(page + 1, totalPages)), []);

    useEffect(() => {
        if (displayMode === DISPLAY_MODE.collection) {
            if (collection.entries?.length) {
                const pages = Math.max(Math.ceil(collection.entries.length / entriesPerPage), 1);
                setTotalPages(pages);
                setCurrentPage(page => page > pages ? 1 : page);
            }
            else {
                setTotalPages(1);
                setCurrentPage(1);
            }
        }
    }, [collection]);

    switch (displayMode) {
        case DISPLAY_MODE.collection:
            return (collection && collection.ns.length > 0)
                ? <Collection
                    collection={collection}
                    currentPage={currentPage} totalPages={totalPages} entriesPerPage={entriesPerPage}
                    prevPage={prevPage} nextPage={() => nextPage(totalPages)} />
                : null;
        case DISPLAY_MODE.entry:
            return entry ? <Entry entry={entry} /> : null;
        default:
            return null;
    }
};

enum ImportState {
    NOT_IMPORTING,
    IMPORTING,
    IMPORT_COMPLETE,
    IMPORT_FAILED
}

const ImportView: React.FC = () => {
    const [importState, setImportState] = useState<ImportState>(ImportState.NOT_IMPORTING);
    const [importTotalComplete, setImportTotalComplete] = useState<number>(0);
    const [importPctComplete, setImportPctComplete] = useState<number>(0);
    const [importMessage, setImportMessage] = useState<string>("");

    useEffect(() => {
        window.importer.importStart(() => {
            setImportState(ImportState.IMPORTING);
        });

        window.importer.importUpdate((update: string, pctComplete: number, totalPctCompletion: number) => {
            setImportMessage(update);
            setImportTotalComplete(totalPctCompletion);
            setImportPctComplete(pctComplete);
        });

        window.importer.importComplete(() => {
            setImportState(ImportState.IMPORT_COMPLETE);
            setTimeout(() => setImportState(ImportState.NOT_IMPORTING), 800);
        });

        window.importer.importFailed(() => {
            setImportState(ImportState.IMPORT_FAILED);
            setTimeout(() => setImportState(ImportState.NOT_IMPORTING), 800);
        });
    }, []);

    if (importState === ImportState.NOT_IMPORTING) { return null; }

    return (
        <div className='import-mask'>
            {importState === ImportState.IMPORTING &&
                <>
                    <div className='import-loading' />
                    <div className='import-message'>{importMessage}</div>
                    <div className='import-percent'>
                        <div className='import-percent-label'>
                            <div>{`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(importPctComplete * 100)}%`}</div>
                        </div>
                        <div className='import-percent-inner' style={{ width: `${importPctComplete * 100}%` }} />
                    </div>
                    <div className='import-percent'>
                        <div className='import-percent-label'>
                            <div>{`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(importTotalComplete * 100)}%`}</div>
                        </div>
                        <div className='import-percent-inner' style={{ width: `${importTotalComplete * 100}%` }} />
                    </div>
                </>
            }
            {importState === ImportState.IMPORT_COMPLETE &&
                <div className='import-loading-complete'>
                    <svg height='150' width='200'>
                        <path d='M180 0 L200 20 L70 150 L0 80 L20 60 L70 110 Z' stroke='#00CC00' fill='#00CC00' />
                    </svg>
                </div>
            }
            {importState === ImportState.IMPORT_FAILED &&
                <div className='import-loading-failed'>
                    <svg height='200' width='200'>
                        <path d='M0 20 L20 0 L100 80 L180 0 L200 20 L120 100 L200 180 L180 200 L100 120 L20 200 L0 180 L80 100 Z' stroke='#CC0000' fill='#CC0000' />
                    </svg>
                </div>
            }
        </div>
    );
};

const container = document.getElementById("app");
const root = createRoot(container!);
root.render(<App />);
