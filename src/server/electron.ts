import { app, BrowserWindow, dialog, ipcMain, IpcMainEvent, IpcMainInvokeEvent, Menu } from "electron";
import chalk from "chalk";
import envPaths from "env-paths";
import Formula from "fparser";
import Handlebars from "handlebars";
import path from "path";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { mkdir } from "fs/promises";
import { disconnect, getCollection, getCollectionEntries, getEntry, getPackageList, nextPage, prevPage, setup as setupDB, stopLoadingCollectionEntries } from "./database";
import { onImport } from "./importer";
import { registerHelpers } from "./layout-builder";
import { ICollectionConfig, IPackageConfig } from "../model/Config";
import { IPackageMetadata, ISO639Code } from "../model/Package";
import { ICollectionMetadata, ISorting } from "../model/Collection";
import { IEntryMetadata } from "../model/Entry";
import { IMap } from "../model/Map";

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
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createOrLoadConfig(pkg: any): Promise<IPackageConfig> {
    const pkgConfigPath = path.join(paths.config, path.basename(pkg.metadata.path));
    const pkgConfigFile = path.join(pkgConfigPath, "config.json");

    try {
        await mkdir(pkgConfigPath, { recursive: true });

        if (!existsSync(pkgConfigFile)) {
            console.log(chalk.blue("Creating config file", pkgConfigFile));
            writeFileSync(pkgConfigFile, "{}");
        }

        const pkgConfig: IPackageConfig = JSON.parse(readFileSync(pkgConfigFile, { encoding: "utf-8" }));
        return pkgConfig;
    } catch (err: unknown) {
        console.log(chalk.white.bgRed("❌ Error loading package config at \"" + pkgConfigFile + "\"", err));
    }

    return {};
}

/**
 * Loads the configuration data for a collection from a package's configuration file.
 * If the package doesn't have a configuration file, one is created.
 * 
 * @param pkg The package to load the config file for
 * @param collection The collection name to load the config for
 * @returns The configuration data for a collection
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createOrLoadCollectionConfig(pkg: any, collectionName: string): Promise<ICollectionConfig[]> {
    const pkgConfig = await createOrLoadConfig(pkg);
    let collectionConfig: ICollectionConfig[] = [];
    if (pkgConfig) {
        collectionConfig = pkgConfig[collectionName] || [];
    }
    return collectionConfig;
}

function saveConfig(pkgPath: string, config: IPackageConfig): void {
    const pkgConfigFile = path.join(paths.config, path.basename(pkgPath), "config.json");
    try {
        writeFileSync(pkgConfigFile, JSON.stringify(config));
    } catch (err: unknown) {
        console.log(chalk.white.bgRed("❌ Error saving package config at \"" + pkgConfigFile + "\"", err));
    }
}

function saveCollectionConfig(pkgPath: string, collectionName: string, config: ICollectionConfig[]): void {
    const pkgConfigFile = path.join(paths.config, path.basename(pkgPath), "config.json");

    try {
        const pkgConfig: IPackageConfig = JSON.parse(readFileSync(pkgConfigFile, { encoding: "utf-8" }));
        pkgConfig[collectionName] = config;
        writeFileSync(pkgConfigFile, JSON.stringify(pkgConfig));
    } catch (err: unknown) {
        console.log(chalk.white.bgRed("❌ Error saving package config at \"" + pkgConfigFile + "\"", err));
    }
}

/**
 * Load all packages
 */
ipcMain.handle("pkg:load-pkgs", (): Promise<IPackageMetadata[]> => getPackageList());

ipcMain.handle("pkg:load-collection", (event: IpcMainInvokeEvent, pkg: IPackageMetadata, collection: ICollectionMetadata): Promise<ICollectionMetadata> => getCollection(event, pkg, collection));

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

ipcMain.handle("pkg:load-entry", async (_event: IpcMainInvokeEvent, pkg: IPackageMetadata, collectionId: string, entryId: string, lang: ISO639Code): Promise<IEntryMetadata | IMap | null> => getEntry(pkg, collectionId, entryId, lang));

ipcMain.handle("pkg:file-exists", (_event: IpcMainInvokeEvent, filePath: string): boolean => existsSync(filePath));

ipcMain.handle("config:load-config", async (_event: IpcMainInvokeEvent, pkg: unknown) => createOrLoadConfig(pkg));

ipcMain.handle("config:save-config", async (_event: IpcMainInvokeEvent, pkgPath: string, config: IPackageConfig) => saveConfig(pkgPath, config));

ipcMain.handle("config:load-collection-config", async (_event: IpcMainInvokeEvent, pkg: unknown, collection: string) => createOrLoadCollectionConfig(pkg, collection));

ipcMain.handle("config:save-collection-config", async (_event: IpcMainInvokeEvent, pkgPath: string, collection: string, config: ICollectionConfig[]) => saveCollectionConfig(pkgPath, collection, config));

ipcMain.on("context-menu:show-collection-menu", (event: IpcMainEvent, collection: string) => {
    const menu = Menu.buildFromTemplate([
        {
            label: collection,
            enabled: false
        },
        {
            label: "Manage collection",
            click: () => event.sender.send("context-menu:manage-collection", collection)
        }
    ]);
    const sender = BrowserWindow.fromWebContents(event.sender);
    if (sender) {
        menu.popup({ window: sender });
    }
});

ipcMain.handle("write", (_event: IpcMainInvokeEvent, ...message: string[]): void => console.log(chalk.magenta.bgGrey(...message)));

ipcMain.handle("write-error", (_event: IpcMainInvokeEvent, ...message: string[]): void => console.log(chalk.red.bgWhiteBright(...message)));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
ipcMain.handle("eval-formula", (_event: IpcMainInvokeEvent, expression: string, scope?: object): any => {
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