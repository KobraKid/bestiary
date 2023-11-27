import { app, BrowserWindow, dialog, ipcMain, IpcMainEvent, IpcMainInvokeEvent, Menu } from "electron";
import chalk from "chalk";
import envPaths from "env-paths";
import Formula from "fparser";
import Handlebars from "handlebars";
import path from "path";
import { disconnect, getCollection, getCollectionEntries, getEntry, getPackageList, nextPage, prevPage, setup as setupDB, stopLoadingCollectionEntries } from "./database";
import { onImport } from "./importer";
import { registerHelpers } from "./layout-builder";
import { IPackageMetadata, ISO639Code } from "../model/Package";
import { ICollectionMetadata, ISorting } from "../model/Collection";
import { IEntryMetadata } from "../model/Entry";
import { IMap } from "../model/Map";
import { loadCollectionConfig, saveConfig } from "./collection";

/**
 * Setup and logging
 */
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

/**
 * Creates the main app window
 */
function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 720,
        title: isDev ? `Bestiary | DEVELOPMENT | ${process.env.npm_package_version}` : "Bestiary",
        darkTheme: true,
        autoHideMenuBar: !isDev,
        // frame: isDev,
        webPreferences: {
            sandbox: false,
            preload: path.join(__dirname, "preload.js")
        }
    });

    win.loadFile(path.join(__dirname, "index.html"));

    win.on("ready-to-show", () => {
        if (isDev) {
            win.webContents.openDevTools({ mode: "undocked" });
        }
    });

    win.on("close", () => {
        saveConfig();
    });
}

/**
 * Load all packages
 */
ipcMain.handle("pkg:load-pkgs", (): Promise<IPackageMetadata[]> => getPackageList());

ipcMain.handle("pkg:load-collection", (event: IpcMainInvokeEvent, pkg: IPackageMetadata, collection: ICollectionMetadata): Promise<ICollectionMetadata> => {
    return getCollection(event, pkg, collection);
});

ipcMain.on("pkg:load-collection-entries", (
    event: IpcMainInvokeEvent,
    pkg: IPackageMetadata,
    collection: ICollectionMetadata,
    lang: ISO639Code,
    sortBy?: ISorting,
    sortDescending?: boolean): Promise<void> =>
    getCollectionEntries({ event, pkg, collection, lang, sortBy, sortDescending }));

ipcMain.on("pkg:prev-page", (
    event: IpcMainInvokeEvent,
    pkg: IPackageMetadata,
    collection: ICollectionMetadata,
    lang: ISO639Code,
    sortBy?: ISorting,
    sortDescending?: boolean) => prevPage({ event, pkg, collection, lang, sortBy, sortDescending }));
ipcMain.on("pkg:next-page", (
    event: IpcMainInvokeEvent,
    pkg: IPackageMetadata,
    collection: ICollectionMetadata,
    lang: ISO639Code,
    sortBy?: ISorting,
    sortDescending?: boolean) => nextPage({ event, pkg, collection, lang, sortBy, sortDescending }));

ipcMain.on("pkg:stop-loading-collection", (): void => stopLoadingCollectionEntries());

ipcMain.handle("pkg:load-entry", async (_event: IpcMainInvokeEvent, pkg: IPackageMetadata, collectionId: string, entryId: string, lang: ISO639Code): Promise<IEntryMetadata | IMap | null> => {
    return getEntry(pkg, collectionId, entryId, lang);
});

// ipcMain.handle("pkg:file-exists", (_event: IpcMainInvokeEvent, filePath: string): boolean => existsSync(filePath));

// ipcMain.handle("config:load-config", async (_event: IpcMainInvokeEvent, pkg: unknown) => createOrLoadConfig(pkg));

// ipcMain.handle("config:save-config", async (_event: IpcMainInvokeEvent, pkgPath: string, config: IPackageConfig) => saveConfig(pkgPath, config));

// ipcMain.handle("config:load-collection-config", async (_event: IpcMainInvokeEvent, pkg: unknown, collection: string) => createOrLoadCollectionConfig(pkg, collection));

// ipcMain.handle("config:save-collection-config", async (_event: IpcMainInvokeEvent, pkgPath: string, collection: string, config: ICollectionConfig[]) => saveCollectionConfig(pkgPath, collection, config));

ipcMain.on("context-menu:show-collection-menu", (event: IpcMainEvent, pkg: IPackageMetadata, collection: ICollectionMetadata) => {
    const menu = Menu.buildFromTemplate([
        {
            label: collection.name,
            enabled: false
        },
        {
            label: "Manage collection",
            click: () => loadCollectionConfig(event, pkg, collection)
        }
    ]);
    const sender = BrowserWindow.fromWebContents(event.sender);
    if (sender) {
        menu.popup({ window: sender });
    }
});

ipcMain.handle("write", (_event: IpcMainInvokeEvent, ...message: string[]): void => console.log(chalk.magenta.bgGrey(...message)));

ipcMain.handle("write-error", (_event: IpcMainInvokeEvent, ...message: string[]): void => console.log(chalk.red.bgWhiteBright(...message)));

ipcMain.handle("eval-formula", (_event: IpcMainInvokeEvent, expression: string, scope?: object): unknown => {
    return new Formula(expression).evaluate(scope || {});
});

/**
 * Create the main window
 */
app.whenReady().then(async () => {
    await setupDB();
    const menu = Menu.buildFromTemplate([
        {
            label: "File",
            submenu: [
                {
                    label: "Options",
                    accelerator: "CmdOrCtrl+O",
                    click: (_menuItem, browserWindow) => {
                        browserWindow?.webContents.send("options:open-options");
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
                { type: "separator" },
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