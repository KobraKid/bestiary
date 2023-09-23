import { useCallback, useReducer, useState } from "react";
import { IPackageConfig } from "../../model/Config";
import { IPackageMetadata, ISO639Code } from "../../model/Package";
import { ICollectionMetadata } from "../../model/Collection";
import { IEntryMetadata } from "../../model/Entry";
import { IMap } from "../../model/Map";

interface BestiaryData {
    readonly view: ViewStackframe,
    canNavigateBack: boolean,
    selectPkg: (pkg: IPackageMetadata) => void,
    selectCollection: (collection: ICollectionMetadata) => void,
    selectEntry: (collectionId: string, entryId: string) => void,
    selectLang: (lang: ISO639Code) => void,
    addEntryToCollection: (entry: IEntryMetadata) => void,
    // collectEntry: (entryId: string, collectionConfigId: number) => void,
    pkgConfig: IPackageConfig,
    updatePkgConfig: () => void,
    navigateBack: () => void,
}

/**
 * Display mode
 */
export const enum DISPLAY_MODE {
    /** Collection */
    collection,
    /** Detailed entry */
    entry,
    /** Map view */
    map
}

/**
 * Represents a view frame for backwards navigation
 */
export interface ViewStackframe {
    /** The view's package */
    pkg: IPackageMetadata,
    /** The view's collection */
    collection: ICollectionMetadata,
    /** The view's entry */
    entry?: IEntryMetadata | IMap,
    /** The view's dispaly mode */
    displayMode: DISPLAY_MODE
}

enum ViewStackframeActionType {
    RESET,
    NAVIGATE_FORWARDS,
    NAVIGATE_BACKWARDS,
    COLLECT_ENTRY,
}

interface IViewStackframeDispatchAction {
    type: ViewStackframeActionType,
    targetView?: Omit<ViewStackframe, "displayMode">,
    newEntry?: IEntryMetadata
}

export function useViewModel(): BestiaryData {
    const [pkgConfig, setPkgConfig] = useState<IPackageConfig>({});

    const [lang, setLang] = useState<ISO639Code>(ISO639Code.English);

    const viewStackReducer = useCallback((state: ViewStackframe[], action: IViewStackframeDispatchAction): ViewStackframe[] => {
        switch (action.type) {
            case ViewStackframeActionType.RESET:
                if (action.targetView) {
                    window.log.write("• navigation reset");

                    const resetPkg = action.targetView.pkg;
                    const resetCollection = action.targetView.collection;
                    let resetEntry = action.targetView.entry;
                    let displayMode = DISPLAY_MODE.collection;

                    if (resetCollection.isMap && resetCollection.entries.length > 0) {
                        displayMode = DISPLAY_MODE.map;
                        resetEntry = resetCollection.entries.at(0);
                    }

                    return [{ pkg: resetPkg, collection: resetCollection, entry: resetEntry, displayMode }];
                }
                else { return state; }
            case ViewStackframeActionType.NAVIGATE_FORWARDS:
                if (action.targetView && action.targetView.entry) {
                    window.log.write(`→ navigating to [${action.targetView.collection.name} ${action.targetView.entry.bid}]`);

                    const displayMode = (action.targetView.collection.isMap) ? DISPLAY_MODE.map : DISPLAY_MODE.entry;

                    return state.concat({ ...action.targetView, displayMode });
                }
                else { return state; }
            case ViewStackframeActionType.NAVIGATE_BACKWARDS:
                if (state.length >= 2) {
                    const targetView = state.at(-2)!;

                    window.log.write(`← returning to [${targetView.collection.name} ${targetView.entry?.bid ?? "collection"}]`);
                    return state.slice(0, -1);
                }
                else { return state; }
            case ViewStackframeActionType.COLLECT_ENTRY:
                if (action.newEntry && state.length >= 1 && action.newEntry.collectionId === state.at(-1)!.collection.ns) {
                    const currentView = state.at(-1)!;
                    const view = {
                        ...currentView!,
                        collection: {
                            ...currentView.collection,
                            entries: [
                                ...currentView.collection.entries,
                                action.newEntry
                            ]
                        }
                    };
                    return [...state.slice(0, -1), view];
                }
                else { return state; }
            default:
                return state;
        }
    }, []);
    const [views, viewStackDispatch] = useReducer<(state: ViewStackframe[], action: IViewStackframeDispatchAction) => ViewStackframe[]>(viewStackReducer, [{
        pkg: { ns: "", name: "", path: "", icon: "", collections: [], langs: [] },
        collection: { ns: "", name: "", entries: [], groupings: [], sortings: [] },
        displayMode: DISPLAY_MODE.collection
    }]);

    const selectPkg = useCallback((oldPkg: IPackageMetadata, newPkg: IPackageMetadata) => {
        if (newPkg.ns === oldPkg.ns) { return; }
        selectCollection(newPkg, "", getFirstVisibleCollection(newPkg), lang);

        // window.config.loadPkgConfig(newPkg).then(setPkgConfig);
    }, []);

    const selectCollection = useCallback((pkg: IPackageMetadata, prevCollectionId: string, newCollection: ICollectionMetadata, lang: ISO639Code) => {
        if (newCollection.ns !== prevCollectionId) {
            // Reload entries for the new collection
            window.pkg.stopLoadingCollectionEntries();
            newCollection.entries = [];
        }

        window.pkg.loadCollection(pkg, newCollection).then(collection => {
            viewStackDispatch({
                type: ViewStackframeActionType.RESET,
                targetView: { pkg: pkg, collection: collection }
            });
            if ((collection.entries?.length ?? 0) === 0) {
                window.pkg.loadCollectionEntries(pkg, collection, lang);
            }
        });
    }, []);

    const addEntryToCollection = useCallback((entry: IEntryMetadata) =>
        viewStackDispatch({ type: ViewStackframeActionType.COLLECT_ENTRY, newEntry: entry }), []);

    const selectEntry = useCallback((pkg: IPackageMetadata, prevCollection: ICollectionMetadata, prevEntry: IEntryMetadata | undefined, newCollectionId: string, newEntryId: string, lang: ISO639Code) => {
        if (newCollectionId === prevCollection.ns && newEntryId === prevEntry?.bid) { return; }

        window.pkg.loadEntry(pkg, newCollectionId, newEntryId, lang).then(loadedEntry => {
            if (!loadedEntry) { return; }
            viewStackDispatch({
                type: ViewStackframeActionType.NAVIGATE_FORWARDS,
                targetView: { pkg, collection: getCollectionById(pkg, newCollectionId), entry: loadedEntry }
            });
        });
    }, []);

    const navigateBack = useCallback(() =>
        viewStackDispatch({ type: ViewStackframeActionType.NAVIGATE_BACKWARDS }), []);

    const updatePkgConfig = useCallback((pkg: unknown) => window.config.loadPkgConfig(pkg).then(setPkgConfig), []);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    const collectEntry = useCallback((entryId: string, collectionConfigId: number, currentPkg: any, currentCollection: any, currentConfig: IPackageConfig) => {
        // Clone current config
        const newPkgConfig: IPackageConfig = JSON.parse(JSON.stringify(currentConfig));
        if (currentPkg && newPkgConfig) {
            // Get the collection configs for the current collection
            const collectionConfigs = newPkgConfig[currentCollection.name];
            if (collectionConfigs) {
                // Get the specific config we're changing
                const configToEdit = collectionConfigs.find(config => config.id === collectionConfigId);
                if (configToEdit) {
                    // Remove the ID if it already exists, otherwise add it
                    const newEntries = configToEdit.collectedEntryIds.includes(entryId) ?
                        configToEdit.collectedEntryIds.filter(entry => entry !== entryId)
                        : configToEdit.collectedEntryIds.concat(entryId);
                    // Save the change
                    configToEdit.collectedEntryIds = newEntries;
                    window.config.savePkgConfig(currentPkg.metadata.path, newPkgConfig);
                    setPkgConfig(newPkgConfig);
                }
            }
        }
    }, []);

    const view = views.at(-1) || {
        pkg: { ns: "", name: "", path: "", icon: "", collections: [], langs: [] },
        collection: { ns: "", name: "", entries: [], groupings: [], sortings: [] },
        displayMode: DISPLAY_MODE.collection
    };

    return {
        view,
        canNavigateBack: views.length > 1,
        selectPkg: (newPkg: IPackageMetadata) => selectPkg(view.pkg, newPkg),
        selectCollection: (newCollection: ICollectionMetadata) => selectCollection(view.pkg, view.collection.ns, newCollection, lang),
        selectEntry: (collectionId: string, entryId: string) => selectEntry(view.pkg, view.collection, view.entry, collectionId, entryId, lang),
        selectLang: (lang: ISO639Code) => setLang(lang),
        addEntryToCollection,
        // collectEntry: (entryId: string, collectionConfigId: number) => collectEntry(entryId, collectionConfigId, {}, {}, pkgConfig),
        pkgConfig,
        updatePkgConfig: () => updatePkgConfig({}),
        navigateBack
    };
}

function getFirstVisibleCollection(pkg: IPackageMetadata): ICollectionMetadata {
    return pkg.collections.find(c => !c.hidden)
        ?? pkg.collections.at(0)
        ?? { name: "", ns: "", entries: [], groupings: [], sortings: [] };
}

function getCollectionById(pkg: IPackageMetadata, collectionId: string | null): ICollectionMetadata {
    return pkg.collections.find(c => c.ns === collectionId)
        ?? { name: "", ns: "", entries: [], groupings: [], sortings: [] };
}