import { useCallback, useReducer, useRef, useState } from "react";
import { IPackageMetadata, ISO639Code } from "../../model/Package";
import { ICollectionMetadata, ISorting } from "../../model/Collection";
import { IEntryMetadata } from "../../model/Entry";
import { IMap } from "../../model/Map";

interface BestiaryData {
    readonly view: ViewStackframe,
    canNavigateBack: boolean,
    selectPkg: (pkg: IPackageMetadata) => void,
    selectCollection: (collection: ICollectionMetadata) => void,
    updateCollection: (sortBy?: ISorting, sortDescending?: boolean) => void,
    selectEntry: (collectionId: string, entryId: string) => void,
    selectLang: (lang: ISO639Code) => void,
    addEntryToCollection: (entry: IEntryMetadata) => void,
    navigateBack: () => void,
    prevPage: () => void,
    nextPage: () => void
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

    const view = useRef<ViewStackframe>({
        pkg: { ns: "", name: "", path: "", icon: "", collections: [], langs: [] },
        collection: { ns: "", name: "", entries: [], groupings: [], sortings: [] },
        displayMode: DISPLAY_MODE.collection
    });

    view.current = views.at(-1)!;

    const selectPkg = useCallback((newPkg: IPackageMetadata) => {
        if (newPkg.ns === view.current.pkg.ns) { return; }
        selectCollection(newPkg, getFirstVisibleCollection(newPkg), lang);
    }, []);

    const selectCollection = useCallback((pkg: IPackageMetadata, newCollection: ICollectionMetadata, lang: ISO639Code, sortBy?: ISorting, sortDescending?: boolean) => {
        window.pkg.stopLoadingCollectionEntries();
        newCollection.entries = [];

        window.pkg.loadCollection(pkg, newCollection).then(collection => {
            viewStackDispatch({
                type: ViewStackframeActionType.RESET,
                targetView: { pkg, collection }
            });
            window.pkg.loadCollectionEntries(pkg, collection, lang, sortBy, sortDescending);
        });
    }, []);

    const addEntryToCollection = useCallback((entry: IEntryMetadata) =>
        viewStackDispatch({ type: ViewStackframeActionType.COLLECT_ENTRY, newEntry: entry }), []);

    const selectEntry = useCallback((newCollectionId: string, newEntryId: string, lang: ISO639Code) => {
        if (newCollectionId === view.current.collection.ns && newEntryId === view.current.entry?.bid) { return; }

        window.pkg.loadEntry(view.current.pkg, newCollectionId, newEntryId, lang).then(loadedEntry => {
            if (!loadedEntry) { return; }
            viewStackDispatch({
                type: ViewStackframeActionType.NAVIGATE_FORWARDS,
                targetView: { pkg: view.current.pkg, collection: getCollectionById(view.current.pkg, newCollectionId), entry: loadedEntry }
            });
        });
    }, []);

    const prevPage = useCallback(() => {
        window.pkg.stopLoadingCollectionEntries().then(stopped => {
            if (stopped) {
                view.current.collection.entries = [];
                window.pkg.prevPage(view.current.pkg, view.current.collection, lang);
            }
        });
    }, []);

    const nextPage = useCallback(() => {
        window.pkg.stopLoadingCollectionEntries().then(stopped => {
            if (stopped) {
                view.current.collection.entries = [];
                window.pkg.nextPage(view.current.pkg, view.current.collection, lang);
            }
        });
    }, []);

    const navigateBack = useCallback(() =>
        viewStackDispatch({ type: ViewStackframeActionType.NAVIGATE_BACKWARDS }), []);

    return {
        view: view.current,
        canNavigateBack: views.length > 1,
        selectPkg,
        selectCollection: (newCollection: ICollectionMetadata) => selectCollection(view.current.pkg, newCollection, lang),
        updateCollection: (sortBy?: ISorting, sortDescending?: boolean) => selectCollection(view.current.pkg, view.current.collection, lang, sortBy, sortDescending),
        selectEntry: (collectionId: string, entryId: string) => selectEntry(collectionId, entryId, lang),
        selectLang: (lang: ISO639Code) => setLang(lang),
        addEntryToCollection,
        navigateBack,
        prevPage, nextPage
    };
}

function getFirstVisibleCollection(pkg: IPackageMetadata): ICollectionMetadata {
    return pkg.collections.find(c => !c.hidden)
        ?? pkg.collections.at(0)
        ?? { name: "", ns: "", entries: [], groupings: [], sortings: [] };
}

function getCollectionById(pkg: IPackageMetadata, collectionId: string): ICollectionMetadata {
    return pkg.collections.find(c => c.ns === collectionId)
        ?? { name: "???", ns: collectionId, entries: [], groupings: [], sortings: [] };
}