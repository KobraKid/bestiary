import { app, BrowserWindow, dialog, ipcMain, IpcMainEvent, IpcMainInvokeEvent, Menu, protocol } from "electron";
import chalk from "chalk";
import envPaths from "env-paths";
import Formula from "fparser";
import Handlebars from "handlebars";
import path from "path";
import { disconnect, getGroup, getGroupEntries, getEntry, getPackageList, nextPage, prevPage, stopLoadingGroupEntries, clearEntryCache, clearLayoutCache, getResource } from "./database";
import { onImport, publishPackage } from "./importer";
import { registerHelpers } from "./layout-builder";
import { IPackageMetadata, ISO639Code } from "../model/Package";
import { IGroupMetadata, IGroupSettings, ISortSettings } from "../model/Group";
import { IEntryMetadata } from "../model/Entry";
import { IMap } from "../model/Map";
import { loadGroupConfig, savePkgConfig, updateCollectedStatusForEntry, updateGroupConfig } from "./group";
import { Config } from "./config";

//#region Setup and logging
export const paths = envPaths("Bestiary", { suffix: "" });
export const hb = registerHelpers(Handlebars);
export const isDev = !app.isPackaged;
console.log(chalk.blue(`
${isDev ? "🐬 " : ""}Bestiary ${process.env.npm_package_version}
${isDev ? "📗 " : ""}NodeJS ${process.version}
${isDev ? "⚡ " : ""}Electron: ${process.versions.electron}
${isDev ? "📦 " : ""}Package directory: ${paths.data}
${isDev ? "⚙ " : ""}Config directory: ${paths.config}
`));
const config = new Config();
let window: BrowserWindow | null = null;
let currentPkg: IPackageMetadata | null = null;
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

        ipcMain.handle("pkg:load-group", (event: IpcMainInvokeEvent, pkg: IPackageMetadata, group: IGroupMetadata): Promise<IGroupMetadata> => {
            currentPkg = pkg;
            return getGroup(event, pkg, group);
        });

        ipcMain.handle("pkg:load-group-entries", (
            event: IpcMainInvokeEvent,
            pkg: IPackageMetadata,
            group: IGroupMetadata,
            lang: ISO639Code,
            sortBy?: ISortSettings,
            groupBy?: IGroupSettings) =>
            getGroupEntries({ event, pkg, group, lang, sortBy, groupBy }));

        ipcMain.handle("pkg:prev-page", (
            event: IpcMainInvokeEvent,
            pkg: IPackageMetadata,
            group: IGroupMetadata,
            lang: ISO639Code,
            sortBy?: ISortSettings,
            groupBy?: IGroupSettings) => prevPage({ event, pkg, group, lang, sortBy, groupBy }));
        ipcMain.handle("pkg:next-page", (
            event: IpcMainInvokeEvent,
            pkg: IPackageMetadata,
            group: IGroupMetadata,
            lang: ISO639Code,
            sortBy?: ISortSettings,
            groupBy?: IGroupSettings) => nextPage({ event, pkg, group, lang, sortBy, groupBy }));

        ipcMain.handle("pkg:stop-loading-group", stopLoadingGroupEntries);

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

        //#region Context Menu API
        ipcMain.on("context-menu:show-group-menu", (event: IpcMainEvent, pkg: IPackageMetadata, group: IGroupMetadata) => {
            const menu = Menu.buildFromTemplate([
                {
                    label: group.name,
                    enabled: false
                },
                {
                    label: `Manage ${group.name}`,
                    click: () => loadGroupConfig(event, pkg, group)
                }
            ]);
            const sender = BrowserWindow.fromWebContents(event.sender);
            if (sender) {
                menu.popup({ window: sender });
            }
        });
        //#endregion

        //#region Logging API
        ipcMain.handle("write", (_event: IpcMainInvokeEvent, ...message: string[]): void => console.log(chalk.magenta.bgGrey(...message)));

        ipcMain.handle("write-error", (_event: IpcMainInvokeEvent, ...message: string[]): void => console.log(chalk.red.bgWhiteBright(...message)));
        //#endregion

        //#region Misc. API
        ipcMain.handle("eval-formula", (_event: IpcMainInvokeEvent, expression: string, scope?: object): unknown => {
            return new Formula(expression).evaluate(scope || {});
        });
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
                return fetch("data:image/jpeg;base64," + await getResource(host, pathname.slice(1), ISO639Code.English));
            });
            createMenu();
            window = createWindow();
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
                label: "Import...",
                accelerator: "CmdOrCtrl+I",
                click: (_menuItem, browserWindow) => {
                    browserWindow?.webContents.send("importer:import-start");
                    if (browserWindow) {
                        dialog.showOpenDialog(browserWindow, {
                            title: "Bestiary", buttonLabel: "Import", properties: ["openFile"], filters: [{ name: "JSON", extensions: ["json"] }]
                        }).then((files) => {
                            onImport(browserWindow, files);
                        });
                    }
                }
            },
            {
                label: "Publish",
                accelerator: "CmdOrCtrl+P",
                click: () => publishPackage(currentPkg)
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
                        browserWindow?.webContents.send("options:show-options");
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
        title: isDev ? `Bestiary | DEVELOPMENT | ${app.getVersion()} | ${app.getLocale()}` : `Bestiary ${app.getVersion()}`,
        darkTheme: true,
        autoHideMenuBar: !isDev,
        frame: true, // isDev,
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

main();