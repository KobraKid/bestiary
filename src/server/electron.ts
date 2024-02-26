import chalk from "chalk";
import { app, BrowserWindow, dialog, ipcMain, IpcMainEvent, IpcMainInvokeEvent, Menu, protocol } from "electron";
import envPaths from "env-paths";
import Formula from "fparser";
import Handlebars from "handlebars";
import NodeCache from "node-cache";
import path from "path";
import { IServerInstance } from "../model/Config";
import { IEntryMetadata } from "../model/Entry";
import { IGroupMetadata, IGroupSettings, ISortSettings } from "../model/Group";
import { IMap } from "../model/Map";
import { IPackageMetadata, ISO639Code } from "../model/Package";
import { Config } from "./config";
import { clearEntryCache, clearLayoutCache, disconnect, getEntry, getGroup, getGroupEntries, getPackageList, getPackageListForServer, getResource, nextPage, prevPage } from "./database";
import { loadGroupConfig, savePkgConfig, updateCollectedStatusForEntry, updateGroupConfig } from "./group";
import { onCompile, onImport } from "./importer";
import { registerHelpers } from "./layout-builder";

enum Action {
    NONE,
    CONFIGURING,
    IMPORTING,
    COMPILING
}

//#region Setup and logging
export const paths = envPaths("Bestiary", { suffix: "" });
export const hb = registerHelpers(Handlebars);
export let isDev = !app.isPackaged;
console.log(chalk.blue(`
${isDev ? "🐬 " : ""}Bestiary ${process.env.npm_package_version}
${isDev ? "📗 " : ""}NodeJS ${process.version}
${isDev ? "⚡ " : ""}Electron: ${process.versions.electron}
${isDev ? "📦 " : ""}Package directory: ${paths.data}
${isDev ? "⚙ " : ""}Config directory: ${paths.config}
`));
export const config = new Config();
let window: BrowserWindow | null = null;
let currentAction: Action = Action.NONE;
const imgCache = new NodeCache({ stdTTL: 600, useClones: false });
//#endregion

/**
 * The main entry point into the app
 */
function main() {
    if (!app.requestSingleInstanceLock()) {
        app.quit();
    }
    else {

        //#region Message handling

        //#region Package API
        ipcMain.handle("pkg:load-pkgs", getPackageList);

        ipcMain.handle("pkg:load-pkgs-for-server", (_event: IpcMainEvent, server: IServerInstance) => getPackageListForServer(server));

        ipcMain.handle("pkg:load-group", getGroup);

        ipcMain.handle("pkg:load-group-entries", (
            event: IpcMainInvokeEvent,
            pkg: IPackageMetadata,
            group: IGroupMetadata,
            lang: ISO639Code,
            sortBy?: ISortSettings,
            groupBy?: IGroupSettings) =>
            getGroupEntries(event, { pkg, group, lang, sortBy, groupBy }));

        ipcMain.handle("pkg:prev-page", (
            event: IpcMainInvokeEvent,
            pkg: IPackageMetadata,
            group: IGroupMetadata,
            lang: ISO639Code,
            sortBy?: ISortSettings,
            groupBy?: IGroupSettings) => prevPage(event, { pkg, group, lang, sortBy, groupBy }));
        ipcMain.handle("pkg:next-page", (
            event: IpcMainInvokeEvent,
            pkg: IPackageMetadata,
            group: IGroupMetadata,
            lang: ISO639Code,
            sortBy?: ISortSettings,
            groupBy?: IGroupSettings) => nextPage(event, { pkg, group, lang, sortBy, groupBy }));

        ipcMain.handle("pkg:load-entry", async (_event: IpcMainInvokeEvent, pkg: IPackageMetadata, groupId: string, entryId: string, lang: ISO639Code): Promise<IEntryMetadata | IMap | null> => {
            return getEntry(pkg, groupId, entryId, lang);
        });
        //#endregion

        //#region Config API
        ipcMain.on("config:save-app-config", config.updateConfig.bind(config));

        ipcMain.on("config:save-pkg-config", savePkgConfig);

        ipcMain.on("config:update-group-config", updateGroupConfig);

        ipcMain.on("config:update-entry-collected-status", updateCollectedStatusForEntry);
        //#endregion

        //#region Menu API
        ipcMain.on("context-menu:show-group-menu", (event: IpcMainEvent, pkg: IPackageMetadata, group: IGroupMetadata) => {
            const menu = Menu.buildFromTemplate([
                {
                    label: group.name,
                    enabled: false
                },
                {
                    label: `Manage ${group.name}`,
                    click: () => {
                        currentAction = Action.CONFIGURING;
                        loadGroupConfig(event, pkg, group);
                    }
                }
            ]);
            const sender = BrowserWindow.fromWebContents(event.sender);
            if (sender && currentAction === Action.NONE) {
                menu.popup({ window: sender });
            }
        });

        ipcMain.on("task:compile", onCompile);
        //#endregion

        //#region Logging API
        ipcMain.handle("write", (_event: IpcMainInvokeEvent, ...message: string[]): void => console.log(chalk.magenta.bgGrey(...message)));

        ipcMain.handle("write-error", (_event: IpcMainInvokeEvent, ...message: string[]): void => console.log(chalk.red.bgWhiteBright(...message)));
        //#endregion

        //#region Misc. API
        ipcMain.handle("eval-formula", (_event: IpcMainInvokeEvent, expression: string, scope?: object): unknown => {
            return new Formula(expression).evaluate(scope || {});
        });

        ipcMain.on("action-complete", () => currentAction = Action.NONE);
        //#endregion

        //#endregion

        //#region Event handling

        /**
         * Focus window when user tries to launch second instance
         */
        app.on("second-instance", () => {
            if (window) {
                if (window.isMinimized()) {
                    window.restore();
                }
                window.focus();
            }
        });

        /**
         * Teardown when exiting app
         */
        app.on("window-all-closed", async () => {
            if (process.platform !== "darwin") {
                await disconnect();
                imgCache.flushAll();
                imgCache.close();
                app.quit();
            }
        });

        //#endregion

        protocol.registerSchemesAsPrivileged([
            { scheme: "bestiary", privileges: { standard: true, secure: true, supportFetchAPI: true } }
        ]);

        /**
         * Create the main window
         */
        app.whenReady().then(async () => {
            await config.initialiazeConfig();
            protocol.handle("bestiary", async request => {
                const { host, pathname } = new URL(request.url);
                const key = pathname.slice(1);
                let response = imgCache.get<string>(key);
                if (response === null || response === undefined) {
                    imgCache.set<string>(key, "data:image/jpeg;base64," + await getResource(host, pathname.slice(1), ISO639Code.English));
                    response = imgCache.get<string>(key);
                }
                return response ? await fetch(response) : new Response(null);
            });
            createMenu();
            window = createWindow();
            setWindowTitle();
        });
    }

}
/**
 * Creates the app menu
 */
function createMenu(): void {
    const devMenu: Electron.MenuItemConstructorOptions = isDev ? {
        type: "submenu",
        label: "Dev Options",
        submenu: [
            {
                label: "Toggle Dev Mode",
                accelerator: "CmdOrCtrl+Alt+Insert",
                click: () => isDev = !isDev
            },
            {
                label: "Clear Entry Cache",
                accelerator: "CmdOrCtrl+E",
                click: clearEntryCache
            },
            {
                label: "Clear Layout Cache",
                accelerator: "CmdOrCtrl+L",
                click: clearLayoutCache
            },
            {
                label: "Import",
                accelerator: "CmdOrCtrl+I",
                click: (_menuItem, browserWindow) => {
                    if (currentAction === Action.NONE) {
                        currentAction = Action.IMPORTING;
                        browserWindow?.webContents.send("task:import");
                        if (browserWindow) {
                            dialog.showOpenDialog(browserWindow, {
                                title: "Bestiary", buttonLabel: "Import", properties: ["openFile"], filters: [{ name: "JSON", extensions: ["json"] }]
                            }).then((files) => {
                                onImport(browserWindow, files);
                            });
                        }
                    }
                }
            },
            {
                label: "Compile",
                accelerator: "Alt+C",
                click: (_menuItem, browserWindow) => {
                    if (currentAction === Action.NONE) {
                        currentAction = Action.COMPILING;
                        browserWindow?.webContents.send("menu:show-compile");
                    }
                }
            }
        ]
    } : { type: "separator" };
    const menu = Menu.buildFromTemplate([
        {
            label: "File",
            submenu: [
                {
                    label: "Options",
                    accelerator: "CmdOrCtrl+O",
                    click: (_menuItem, browserWindow) => {
                        if (currentAction === Action.NONE) {
                            currentAction = Action.CONFIGURING;
                            browserWindow?.webContents.send("menu:show-options");
                        }
                    }
                },
                devMenu,
                { role: "quit" }
            ]
        },
        { role: "editMenu" },
        { role: "viewMenu" },
        { role: "windowMenu" }
    ]);
    Menu.setApplicationMenu(menu);
}

/**
 * Creates the main app window
 */
function createWindow(): BrowserWindow {
    const win = new BrowserWindow({
        width: 1280,
        height: 720,
        darkTheme: true,
        webPreferences: {
            sandbox: false,
            preload: path.join(__dirname, "preload.js")
        }
    });

    win.loadFile(path.join(__dirname, "index.html"));

    win.on("ready-to-show", () => {
        win.webContents.send("config:updated-app-config", config.config);
        if (isDev) {
            win.webContents.openDevTools({ mode: "left" });
        }
    });

    win.on("close", () => {
        savePkgConfig();
        config.saveConfig();
    });

    return win;
}

export function setWindowTitle(serverName?: string): void {
    let title = `Bestiary${serverName ? " @ " + serverName : ""} v${app.getVersion()}`;
    if (isDev) { title += ` | DEVELOPMENT | ${app.getLocale()}`; }
    window?.setTitle(title);
}

main();