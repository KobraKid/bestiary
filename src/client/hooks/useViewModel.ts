import { useCallback, useReducer, useRef, useState } from "react";
import { IPackageMetadata, ISO639Code } from "../../model/Package";
import { IGroupMetadata, ISorting } from "../../model/Group";
import { IEntryMetadata } from "../../model/Entry";
import { IMap } from "../../model/Map";

interface BestiaryData {
    readonly view: ViewStackframe,
    canNavigateBack: boolean,
    selectPkg: (pkg: IPackageMetadata) => void,
    selectGroup: (group: IGroupMetadata) => void,
    updateGroup: (sortBy?: ISorting, sortDescending?: boolean) => void,
    selectEntry: (groupId: string, entryId: string) => void,
    selectLang: (lang: ISO639Code) => void,
    addEntryToGroup: (entry: IEntryMetadata) => void,
    navigateBack: () => void,
    prevPage: () => void,
    nextPage: () => void
}

/**
 * Display mode
 */
export const enum DISPLAY_MODE {
    /** Group */
    group,
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
    /** The view's group */
    group: IGroupMetadata,
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
                    const resetGroup = action.targetView.group;
                    let resetEntry = action.targetView.entry;
                    let displayMode = DISPLAY_MODE.group;

                    if (resetGroup.isMap && resetGroup.entries.length > 0) {
                        displayMode = DISPLAY_MODE.map;
                        resetEntry = resetGroup.entries.at(0);
                    }

                    return [{ pkg: resetPkg, group: resetGroup, entry: resetEntry, displayMode }];
                }
                else { return state; }
            case ViewStackframeActionType.NAVIGATE_FORWARDS:
                if (action.targetView && action.targetView.entry) {
                    window.log.write(`→ navigating to [${action.targetView.group.name} ${action.targetView.entry.bid}]`);

                    const displayMode = (action.targetView.group.isMap) ? DISPLAY_MODE.map : DISPLAY_MODE.entry;

                    return state.concat({ ...action.targetView, displayMode });
                }
                else { return state; }
            case ViewStackframeActionType.NAVIGATE_BACKWARDS:
                if (state.length >= 2) {
                    const targetView = state.at(-2)!;

                    window.log.write(`← returning to [${targetView.group.name} ${targetView.entry?.bid ?? "group"}]`);
                    return state.slice(0, -1);
                }
                else { return state; }
            case ViewStackframeActionType.COLLECT_ENTRY:
                if (action.newEntry && state.length >= 1 && action.newEntry.groupId === state.at(-1)!.group.ns) {
                    const currentView = state.at(-1)!;
                    const view = {
                        ...currentView!,
                        group: {
                            ...currentView.group,
                            entries: [
                                ...currentView.group.entries,
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
        pkg: { ns: "", name: "", path: "", icon: "", groups: [], langs: [] },
        group: { ns: "", name: "", entries: [], groupings: [], sortings: [] },
        displayMode: DISPLAY_MODE.group
    }]);

    const view = useRef<ViewStackframe>({
        pkg: { ns: "", name: "", path: "", icon: "", groups: [], langs: [] },
        group: { ns: "", name: "", entries: [], groupings: [], sortings: [] },
        displayMode: DISPLAY_MODE.group
    });

    view.current = views.at(-1)!;

    const selectPkg = useCallback((newPkg: IPackageMetadata) => {
        if (newPkg.ns === view.current.pkg.ns) { return; }
        selectGroup(newPkg, getFirstVisibleGroup(newPkg), lang);
    }, []);

    const selectGroup = useCallback((pkg: IPackageMetadata, newGroup: IGroupMetadata, lang: ISO639Code, sortBy?: ISorting, sortDescending?: boolean) => {
        window.pkg.stopLoadingGroupEntries();
        newGroup.entries = [];

        window.pkg.loadGroup(pkg, newGroup).then(group => {
            viewStackDispatch({
                type: ViewStackframeActionType.RESET,
                targetView: { pkg, group }
            });
            window.pkg.loadGroupEntries(pkg, group, lang, sortBy, sortDescending);
        });
    }, []);

    const addEntryToGroup = useCallback((entry: IEntryMetadata) =>
        viewStackDispatch({ type: ViewStackframeActionType.COLLECT_ENTRY, newEntry: entry }), []);

    const selectEntry = useCallback((newGroupId: string, newEntryId: string, lang: ISO639Code) => {
        if (newGroupId === view.current.group.ns && newEntryId === view.current.entry?.bid) { return; }

        window.pkg.loadEntry(view.current.pkg, newGroupId, newEntryId, lang).then(loadedEntry => {
            if (!loadedEntry) { return; }
            viewStackDispatch({
                type: ViewStackframeActionType.NAVIGATE_FORWARDS,
                targetView: { pkg: view.current.pkg, group: getGroupById(view.current.pkg, newGroupId), entry: loadedEntry }
            });
        });
    }, []);

    const prevPage = useCallback(() => {
        window.pkg.stopLoadingGroupEntries().then(stopped => {
            if (stopped) {
                view.current.group.entries = [];
                window.pkg.prevPage(view.current.pkg, view.current.group, lang);
            }
        });
    }, []);

    const nextPage = useCallback(() => {
        window.pkg.stopLoadingGroupEntries().then(stopped => {
            if (stopped) {
                view.current.group.entries = [];
                window.pkg.nextPage(view.current.pkg, view.current.group, lang);
            }
        });
    }, []);

    const navigateBack = useCallback(() =>
        viewStackDispatch({ type: ViewStackframeActionType.NAVIGATE_BACKWARDS }), []);

    return {
        view: view.current,
        canNavigateBack: views.length > 1,
        selectPkg,
        selectGroup: (newGroup: IGroupMetadata) => selectGroup(view.current.pkg, newGroup, lang),
        updateGroup: (sortBy?: ISorting, sortDescending?: boolean) => selectGroup(view.current.pkg, view.current.group, lang, sortBy, sortDescending),
        selectEntry: (groupId: string, entryId: string) => selectEntry(groupId, entryId, lang),
        selectLang: (lang: ISO639Code) => setLang(lang),
        addEntryToGroup: addEntryToGroup,
        navigateBack,
        prevPage, nextPage
    };
}

function getFirstVisibleGroup(pkg: IPackageMetadata): IGroupMetadata {
    return pkg.groups.find(c => !c.hidden)
        ?? pkg.groups.at(0)
        ?? { name: "", ns: "", entries: [], groupings: [], sortings: [] };
}

function getGroupById(pkg: IPackageMetadata, groupId: string): IGroupMetadata {
    return pkg.groups.find(c => c.ns === groupId)
        ?? { name: "???", ns: groupId, entries: [], groupings: [], sortings: [] };
}