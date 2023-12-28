import React, { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { GroupMenu, PackageMenu } from "./components/menu";
import { DISPLAY_MODE, useViewModel } from "./hooks/useViewModel";
import useScript from "./hooks/useScript";
import { Options } from "./components/options";
import { PackageContext } from "./context";
import { IGroupMetadata } from "../model/Group";
import { IEntryMetadata } from "../model/Entry";
import { IMap } from "../model/Map";
import { Group } from "./components/group";
import { Entry } from "./components/entry";
import { Map } from "./components/map";
import { GroupConfigView } from "./components/groupConfig";
import { ImportView } from "./components/importview";
import "./styles/app.scss";
import "./styles/transitions.scss";
import "./styles/importer.scss";

/**
 * Represents a view frame for backwards navigation
 */
export interface ViewStackframe {
    /** The view's group */
    group: IGroupMetadata,
    /** The view's entry - null or undefined if the previous frame was in group mode */
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
        selectGroup,
        updateGroup,
        selectEntry,
        addEntryToGroup,
        updateConfig,
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
        window.pkg.onLoadGroupEntry(addEntryToGroup);
        window.config.onUpdateGroupConfig(updateConfig);
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
                <GroupConfigView />
                <PackageContext.Provider value={{ pkg: view.pkg, selectGroup, selectEntry, updateGroup }}>
                    <PackageMenu
                        expanded={pkgMenuExpanded}
                        setExpanded={setPkgMenuExpanded}
                        onPackageClicked={selectPkg} />
                    {view.pkg &&
                        <>
                            <GroupMenu
                                groups={view.pkg.groups}
                                pkgMenuExpanded={pkgMenuExpanded}
                                canNavigateBack={canNavigateBack}
                                onBackArrowClicked={navigateBack}
                                onGroupClicked={selectGroup} />
                            <Page
                                group={view.group}
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
    group: IGroupMetadata,
    entry: IEntryMetadata | undefined,
    displayMode: DISPLAY_MODE,
    prevPage: () => void,
    nextPage: () => void
}

const Page: React.FC<IPageProps> = (props: IPageProps) => {
    const { group, entry, displayMode, prevPage, nextPage } = props;

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
        case DISPLAY_MODE.group:
            return (group && group.ns.length > 0)
                ? <Group
                    group={group}
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
