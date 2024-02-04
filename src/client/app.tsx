import React, { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { CSSTransition } from "react-transition-group";
import { IAppConfig } from "../model/Config";
import { IEntryMetadata } from "../model/Entry";
import { IGroupMetadata } from "../model/Group";
import { IMap } from "../model/Map";
import { Entry } from "./components/entry";
import { Group } from "./components/group";
import { GroupConfigView } from "./components/groupConfig";
import { Map } from "./components/map";
import { GroupMenu, PackageMenu } from "./components/menu";
import { Options } from "./components/options";
import { CompileView } from "./components/tasks/compileView";
import { ImportView } from "./components/tasks/importView";
import { AppContext, PackageContext } from "./context";
import useScript from "./hooks/useScript";
import { DISPLAY_MODE, useViewModel } from "./hooks/useViewModel";

import "./styles/app.scss";
import "./styles/transitions.scss";

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
    const [config, setConfig] = useState<IAppConfig | null>(null);
    const [optionsVisible, setOptionsVisible] = useState(false);
    const [pkgMenuExpanded, setPkgMenuExpanded] = useState(false);
    const {
        view,
        isLoading,
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
        window.menu.actionComplete(); // force no action in progress
        window.config.saveAppConfig(); // force a load from the saved config
        window.config.onUpdateAppConfig(setConfig);
        window.menu.onShowOptions(() => setOptionsVisible(true));
        window.pkg.onLoadGroupEntry(addEntryToGroup);
        window.config.onUpdateGroupConfig(updateConfig);
    }, []);

    useEffect(() => {
        window.addEventListener("link", handleLinkEvent, false);
        return () => window.removeEventListener("link", handleLinkEvent);
    }, [handleLinkEvent]);

    return (
        <AppContext.Provider value={{ config }}>
            <LoadingMask isLoading={isLoading} />
            <Options show={optionsVisible} onHide={() => {
                setOptionsVisible(false);
                window.menu.actionComplete();
            }} />
            <div className={pkgMenuExpanded ? "app-pkg-menu-expanded" : "app-pkg-menu-collapsed"}
                style={{ backgroundColor: config?.bgColor }}>
                <PackageContext.Provider value={{ pkg: view.pkg, selectGroup, selectEntry, updateGroup }}>
                    <ImportView />
                    <CompileView />
                    <GroupConfigView />
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
        </AppContext.Provider>
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

interface ILoadingMaskProps {
    isLoading: boolean
}

const LoadingMask: React.FC<ILoadingMaskProps> = (props: ILoadingMaskProps) => {
    const { isLoading } = props;
    const nodeRef = useRef(null);

    return (
        <CSSTransition nodeRef={nodeRef} in={isLoading} classNames="loading" timeout={{ enter: 1000, exit: 0 }}>
            <div ref={nodeRef}>
                <div className="loading-spinner"></div>
            </div>
        </CSSTransition>
    );
};

const container = document.getElementById("app");
const root = createRoot(container!);
root.render(<App />);
