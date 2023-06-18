import { useCallback, useReducer, useState } from 'react';
import { IPackageConfig } from './model/Config';
import IEntry from './model/Entry';
import { IPackageMetadata, ISO639Code } from './model/Package';
import { ICollectionMetadata } from './model/Collection';

interface BestiaryData {
    pkg: IPackageMetadata,
    selectPkg: (pkg: IPackageMetadata) => void,
    collection: ICollectionMetadata,
    selectCollection: (collection: ICollectionMetadata) => void,
    collectEntry: (entryId: string, collectionConfigId: number) => void,
    entry: IEntry | null,
    selectEntry: (collection: ICollectionMetadata, entry: IEntry) => void,
    pkgConfig: IPackageConfig,
    updatePkgConfig: () => void,
    displayMode: DISPLAY_MODE,
    canNavigateBack: boolean,
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
    /** The view's collection */
    collection: ICollectionMetadata,
    /** The view's entry */
    entry: IEntry | null
}

enum ViewStackframeActionType {
    RESET,
    NAVIGATE_FORWARDS,
    NAVIGATE_BACKWARDS
}

interface IViewStackframeDispatchAction {
    type: ViewStackframeActionType,
    targetView?: ViewStackframe,
    currentView?: ViewStackframe
}

export function useBestiaryViewModel(): BestiaryData {
    const [pkg, setPkg] = useState<IPackageMetadata>({ name: "", ns: "", path: "", icon: "", collections: [], langs: [] });
    const [collection, setCollection] = useState<ICollectionMetadata>({ name: "", id: "", entries: [] });
    const [entry, setEntry] = useState<IEntry | null>(null);

    const [displayMode, setDisplayMode] = useState<DISPLAY_MODE>(DISPLAY_MODE.collection);
    const [pkgConfig, setPkgConfig] = useState<IPackageConfig>({});

    const [lang, setLang] = useState<ISO639Code>(ISO639Code.English);

    const viewStackReducer = useCallback((state: ViewStackframe[], action: IViewStackframeDispatchAction): ViewStackframe[] => {
        switch (action.type) {
            case ViewStackframeActionType.RESET:
                const resetCollection: ICollectionMetadata = action.targetView?.collection ?? { name: "", id: "", entries: [] };
                let resetEntry: IEntry | null = null;
                window.log.write('• navigation reset');

                if (isMapView(resetCollection) && resetCollection.entries.length > 0) {
                    setDisplayMode(DISPLAY_MODE.map);
                    resetEntry = resetCollection.entries[0] || null;
                } else {
                    setDisplayMode(DISPLAY_MODE.collection);
                    resetEntry = action.targetView?.entry || null;
                }

                setEntry(null);
                setCollection(resetCollection);
                setEntry(resetEntry);

                return [{ collection: resetCollection, entry: resetEntry }];

            case ViewStackframeActionType.NAVIGATE_FORWARDS:
                window.log.write(`→ going from [${action.currentView?.collection?.name} ${action.currentView?.entry?.entryId ?? "collection"}]  to  [${action.targetView?.collection?.name} ${action.targetView?.entry?.entryId}]`);
                if (!action.targetView?.collection ||
                    (action.currentView?.collection?.name === action.targetView.collection.name && action.currentView.entry?.entryId === action.targetView.entry?.entryId)) {
                    return state;
                }

                if (isMapView(action.targetView?.collection)) {
                    setDisplayMode(DISPLAY_MODE.map);
                }
                else {
                    setDisplayMode(DISPLAY_MODE.entry);
                }
                setEntry(null);
                setCollection(action.targetView.collection);
                setEntry(action.targetView.entry);

                return state.concat(action.targetView);

            case ViewStackframeActionType.NAVIGATE_BACKWARDS:
                if (state.length < 2) { return state; }
                const currentView = state[state.length - 1];
                const targetView = state[state.length - 2];
                window.log.write(`← return to  [${targetView?.collection?.name ?? "...nowhere..."} ${targetView?.entry?.entryId ?? "collection"}] from [${currentView?.collection?.name} ${currentView?.entry?.entryId ?? "collection"}]`);

                if (!targetView) { return state; }

                if (isMapView(targetView.collection)) {
                    setDisplayMode(DISPLAY_MODE.map);
                }
                else {
                    if (targetView.entry) {
                        setDisplayMode(DISPLAY_MODE.entry);
                    }
                    else {
                        setDisplayMode(DISPLAY_MODE.collection);
                    }
                }
                setCollection(targetView.collection);
                setEntry(targetView.entry);

                return state.slice(0, -1);

            default:
                return state;
        }
    }, []);
    const [views, viewStackDispatch] = useReducer(viewStackReducer, []);

    const selectPkg = useCallback((oldPkg: IPackageMetadata, newPkg: IPackageMetadata) => {
        if (newPkg.ns === oldPkg.ns) { return; }

        setPkg(newPkg);
        viewStackDispatch({
            type: ViewStackframeActionType.RESET,
            targetView: {
                collection: newPkg.collections.length > 0 ? newPkg.collections[0]! : { name: "", id: "", entries: [] },
                entry: null
            }
        });

        // window.config.loadPkgConfig(newPkg).then(setPkgConfig);
    }, []);

    const selectCollection = useCallback((pkg: IPackageMetadata, collection: ICollectionMetadata, _newCollection: ICollectionMetadata, lang: ISO639Code) => {
        // if (newCollection.id === collection.id) { return; }

        window.pkg.loadCollection(pkg, collection, lang).then((collection: ICollectionMetadata) => {
            setCollection(collection);
            viewStackDispatch({ type: ViewStackframeActionType.RESET, targetView: { collection: collection, entry: null } })
        });
    }, []);

    const selectEntry = useCallback((pkg: IPackageMetadata, collection: ICollectionMetadata, entry: IEntry | null, newCollection: ICollectionMetadata | null, newEntry: IEntry, lang: ISO639Code) => {
        if (newEntry.entryId === entry?.entryId) { return; }

        window.pkg.loadEntry(pkg, newCollection || collection, newEntry, lang).then((loadedEntry: IEntry) =>
            (() => { console.log('navigating to', collection, entry); return true; })() &&
            viewStackDispatch({
                type: ViewStackframeActionType.NAVIGATE_FORWARDS,
                currentView: { collection: collection, entry: entry },
                targetView: { collection: newCollection || collection, entry: loadedEntry }
            })
        );
    }, []);

    const updatePkgConfig = useCallback((pkg: any) => window.config.loadPkgConfig(pkg).then(setPkgConfig), []);

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

    const navigateBack = useCallback(() => viewStackDispatch({ type: ViewStackframeActionType.NAVIGATE_BACKWARDS }), []);

    return {
        pkg,
        selectPkg: (newPkg: IPackageMetadata) => selectPkg(pkg, newPkg),
        collection,
        selectCollection: (newCollection: ICollectionMetadata) => selectCollection(pkg, collection, newCollection, lang),
        entry,
        selectEntry: (newCollection: ICollectionMetadata | null, newEntry: IEntry) => selectEntry(pkg, collection, entry, newCollection, newEntry, lang),
        collectEntry: (entryId: string, collectionConfigId: number) => collectEntry(entryId, collectionConfigId, {}, {}, pkgConfig),
        pkgConfig,
        updatePkgConfig: () => updatePkgConfig({}),
        displayMode,
        canNavigateBack: (views.length > 1),
        navigateBack
    }
}

function isMapView(_collection: ICollectionMetadata): boolean {
    return false;
}