import { useCallback, useReducer, useState } from 'react';
import ICollection from './model/Collection';
import { IPackageConfig } from './model/Config';
import IEntry from './model/Entry';
import { LAYOUT_TYPE } from './model/Layout';
import IPackage from './model/Package';

interface BestiaryData {
    pkg: IPackage,
    selectPkg: (pkg: IPackage) => void,
    collection: ICollection,
    selectCollection: (collection: ICollection) => void,
    collectEntry: (entryId: string, collectionConfigId: number) => void,
    entry: IEntry | null,
    selectEntry: (entry: IEntry, collection?: ICollection) => void,
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
    collection: ICollection,
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
    const [pkg, setPkg] = useState<IPackage>({
        metadata: { name: "", path: "", icon: "", color: "", font: "", defs: {} },
        collections: []
    });
    const [collection, setCollection] = useState<ICollection>({
        name: "", layout: {}, layoutPreview: {}, layoutLink: {}, data: []
    });
    const [entry, setEntry] = useState<IEntry | null>(null);

    const [displayMode, setDisplayMode] = useState<DISPLAY_MODE>(DISPLAY_MODE.collection);
    const [pkgConfig, setPkgConfig] = useState<IPackageConfig>({});

    const viewStackReducer = useCallback((state: ViewStackframe[], action: IViewStackframeDispatchAction): ViewStackframe[] => {
        switch (action.type) {
            case ViewStackframeActionType.RESET:
                const resetCollection: ICollection = action.targetView?.collection ?? { name: "", layout: {}, layoutPreview: {}, layoutLink: {}, data: [] };
                let resetEntry: IEntry | null = null;
                window.log.write('• navigation reset');

                if (isMapView(resetCollection) && resetCollection.data.length > 0) {
                    setDisplayMode(DISPLAY_MODE.map);
                    resetEntry = resetCollection.data[0] || null;
                } else {
                    setDisplayMode(DISPLAY_MODE.collection);
                    resetEntry = action.targetView?.entry || null;
                }

                setEntry(null);
                setCollection(resetCollection);
                setEntry(resetEntry);

                return [{ collection: resetCollection, entry: resetEntry }];

            case ViewStackframeActionType.NAVIGATE_FORWARDS:
                window.log.write(`→ going from [${action.currentView?.collection?.name} ${action.currentView?.entry?.id ?? "collection"}]  to  [${action.targetView?.collection?.name} ${action.targetView?.entry?.id}]`);
                if (!action.targetView?.collection ||
                    (action.currentView?.collection?.name === action.targetView.collection.name && action.currentView.entry?.id === action.targetView.entry?.id)) {
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
                window.log.write(`← return to  [${targetView?.collection?.name ?? "...nowhere..."} ${targetView?.entry?.id ?? "collection"}] from [${currentView?.collection?.name} ${currentView?.entry?.id ?? "collection"}]`);

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

    const selectPkg = useCallback((newPkg: IPackage) => {
        if (newPkg.metadata.path === pkg?.metadata.path) { return; }

        setPkg(newPkg);
        viewStackDispatch({
            type: ViewStackframeActionType.RESET,
            targetView: {
                collection: newPkg.collections.length > 0 ? newPkg.collections[0]! : { name: "", layout: {}, layoutPreview: {}, layoutLink: {}, data: [] },
                entry: null
            }
        });

        window.config.loadPkgConfig(newPkg).then(setPkgConfig);
    }, []);

    const selectCollection = useCallback((newCollection: ICollection) => {
        if (newCollection.name === collection?.name) { return; }
        viewStackDispatch({ type: ViewStackframeActionType.RESET, targetView: { collection: newCollection, entry: null } });
    }, []);

    const selectEntry = useCallback((currentEntry: IEntry | null, newEntry: IEntry, newCollection: ICollection | null | undefined) => {
        if (newEntry.id === currentEntry?.id) { return; }
        viewStackDispatch({
            type: ViewStackframeActionType.NAVIGATE_FORWARDS,
            targetView: { collection: newCollection || collection, entry: newEntry },
            currentView: { collection: collection, entry: currentEntry }
        });
    }, []);

    const updatePkgConfig = useCallback((pkg: IPackage) => window.config.loadPkgConfig(pkg).then(setPkgConfig), []);

    const collectEntry = useCallback((entryId: string, collectionConfigId: number, currentPkg: IPackage | null, currentCollection: ICollection, currentConfig: IPackageConfig) => {
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
        selectPkg,
        collection,
        selectCollection,
        entry,
        selectEntry: (newEntry: IEntry, newCollection?: ICollection) => selectEntry(entry, newEntry, newCollection),
        collectEntry: (entryId: string, collectionConfigId: number) => collectEntry(entryId, collectionConfigId, pkg, collection, pkgConfig),
        pkgConfig,
        updatePkgConfig: () => updatePkgConfig(pkg),
        displayMode,
        canNavigateBack: (views.length > 1),
        navigateBack
    }
}

/**
 * Checks if a collection is a Map
 * 
 * @param collection The collection to test
 * @returns Whether the collection's type is `LAYOUT_TYPE.map`
 */
function isMapView(collection?: ICollection | null | undefined): boolean {
    return collection?.layout?.type === LAYOUT_TYPE.map;
}