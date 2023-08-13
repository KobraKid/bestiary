import { useCallback, useReducer, useState } from 'react';
import { IPackageConfig } from './model/Config';
import { IEntryMetadata } from './model/Entry';
import { IPackageMetadata, IPackageSchema, ISO639Code } from './model/Package';
import { ICollectionMetadata } from './model/Collection';

interface BestiaryData {
    pkg: IPackageMetadata,
    selectPkg: (pkg: IPackageMetadata) => void,
    collection: ICollectionMetadata,
    selectCollection: (collection: ICollectionMetadata) => void,
    getCollectionEntry: (entry: IEntryMetadata) => void,
    collectEntry: (entryId: string, collectionConfigId: number) => void,
    entry: IEntryMetadata | null,
    selectEntry: (collection: ICollectionMetadata, entry: IEntryMetadata) => void,
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
    /** The view's package */
    pkg: IPackageMetadata,
    /** The view's collection */
    collection: ICollectionMetadata,
    /** The view's entry */
    entry: IEntryMetadata | null
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
    const [collection, setCollection] = useState<ICollectionMetadata>({ name: "", ns: "", entries: [], groupings: [] });
    const [entry, setEntry] = useState<IEntryMetadata | null>(null);

    const [displayMode, setDisplayMode] = useState<DISPLAY_MODE>(DISPLAY_MODE.collection);
    const [pkgConfig, setPkgConfig] = useState<IPackageConfig>({});

    const [lang, setLang] = useState<ISO639Code>(ISO639Code.English);

    const viewStackReducer = useCallback((state: ViewStackframe[], action: IViewStackframeDispatchAction): ViewStackframe[] => {
        switch (action.type) {
            case ViewStackframeActionType.RESET:
                const resetCollection: ICollectionMetadata = action.targetView?.collection ?? { name: "", ns: "", entries: [], groupings: [] };
                let resetEntry: IEntryMetadata | null = null;
                window.log.write('• navigation reset');

                if (isMapView(resetCollection) && resetCollection.entries.length > 0) {
                    setDisplayMode(DISPLAY_MODE.map);
                    resetEntry = resetCollection.entries[0] || null;
                } else {
                    setDisplayMode(DISPLAY_MODE.collection);
                    resetEntry = action.targetView?.entry || null;
                }

                selectCollection(action.targetView?.pkg || null as any, null as any, resetCollection, lang);

                return [{ pkg: action.targetView?.pkg || null as any, collection: resetCollection, entry: resetEntry }];

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

                return state.concat(action.currentView!);

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
                        selectCollection(state[state.length - 1]!.pkg, null as any, state[state.length - 1]!.collection, lang);
                    }
                }

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
                pkg: newPkg,
                collection: newPkg.collections.length > 0 ? newPkg.collections[0]! : { name: "", ns: "", entries: [], groupings: [] },
                entry: null
            }
        });

        // window.config.loadPkgConfig(newPkg).then(setPkgConfig);
    }, []);

    const selectCollection = useCallback((pkg: IPackageMetadata, _collection: ICollectionMetadata, newCollection: ICollectionMetadata, lang: ISO639Code) => {
        // if (newCollection.id === collection.id) { return; }

        window.pkg.stopLoadingCollectionEntries();
        window.pkg.loadCollection(pkg as IPackageSchema, newCollection, lang).then((collection: ICollectionMetadata) => {
            setEntry(null);
            setCollection(collection);
            if ((collection?.entries?.length ?? 0) === 0) {
                window.pkg.loadCollectionEntries(pkg as IPackageSchema, collection, lang);
            }
        });
    }, []);

    const getCollectionEntry = useCallback((entry: IEntryMetadata) => {
        setCollection(collection => {
            const newCollection = { ...collection };
            newCollection.entries = newCollection.entries || [];
            newCollection.entries.push(entry);
            return newCollection;
        })
    }, []);

    const selectEntry = useCallback((pkg: IPackageMetadata, collection: ICollectionMetadata, entry: IEntryMetadata | null, newCollection: ICollectionMetadata | null, newEntry: IEntryMetadata, lang: ISO639Code) => {
        if (newEntry.id === entry?.id) { return; }

        window.pkg.stopLoadingCollectionEntries();
        window.pkg.loadEntry(pkg as IPackageSchema, newCollection || collection, newEntry.id, lang).then((loadedEntry: IEntryMetadata) => {
            viewStackDispatch({
                type: ViewStackframeActionType.NAVIGATE_FORWARDS,
                currentView: { pkg, collection, entry },
                targetView: { pkg, collection: newCollection || collection, entry: loadedEntry }
            });
        });
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
        getCollectionEntry,
        entry,
        selectEntry: (newCollection: ICollectionMetadata | null, newEntry: IEntryMetadata) => selectEntry(pkg, collection, entry, newCollection, newEntry, lang),
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