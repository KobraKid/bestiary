import { app, BrowserWindow, dialog, ipcMain, IpcMainEvent, IpcMainInvokeEvent, Menu } from "electron";
import chalk from "chalk";
import envPaths from "env-paths";
import Formula from "fparser";
import Handlebars from "handlebars";
import path from "path";
import { disconnect, getGroup, getGroupEntries, getEntry, getPackageList, nextPage, prevPage, stopLoadingGroupEntries, clearEntryCache, clearLayoutCache } from "./database";
import { onImport } from "./importer";
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
//#endregion

//#region Message handling

//#region Package API
ipcMain.handle("pkg:load-pkgs", getPackageList);

ipcMain.handle("pkg:load-group", (event: IpcMainInvokeEvent, pkg: IPackageMetadata, group: IGroupMetadata): Promise<IGroupMetadata> => {
    return getGroup(event, pkg, group);
});

ipcMain.on("pkg:load-group-entries", (
    event: IpcMainInvokeEvent,
    pkg: IPackageMetadata,
    group: IGroupMetadata,
    lang: ISO639Code,
    sortBy?: ISortSettings,
    groupBy?: IGroupSettings): Promise<void> =>
    getGroupEntries({ event, pkg, group, lang, sortBy, groupBy }));

ipcMain.on("pkg:prev-page", (
    event: IpcMainInvokeEvent,
    pkg: IPackageMetadata,
    group: IGroupMetadata,
    lang: ISO639Code,
    sortBy?: ISortSettings,
    groupBy?: IGroupSettings) => prevPage({ event, pkg, group, lang, sortBy, groupBy }));
ipcMain.on("pkg:next-page", (
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

/**
 * Creates the main app window
 */
function createWindow(): void {
    const win = new BrowserWindow({
        width: 1280,
        height: 720,
        title: isDev ? `Bestiary | DEVELOPMENT | ${process.env.npm_package_version}` : "Bestiary",
        darkTheme: true,
        autoHideMenuBar: !isDev,
        frame: isDev,
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
}

/**
 * Create the main window
 */
app.whenReady().then(async () => {
    await config.initialiazeConfig();
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
                devMenu,
                { role: "quit" }
            ]
        },
        { role: "editMenu" },
        { role: "viewMenu" },
        { role: "windowMenu" }
    ]);
    Menu.setApplicationMenu(menu);
    createWindow();
});

/**
 * Teardown when exiting
 */
app.on("window-all-closed", async () => {
    if (process.platform !== "darwin") {
        await disconnect();
        app.quit();
    }
});