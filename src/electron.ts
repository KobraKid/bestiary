import { app, BrowserWindow, ipcMain, IpcMainEvent, Menu } from 'electron';
import path from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { mkdir } from 'fs/promises';
import envPaths from 'env-paths';
import { IPackageMetadata, ISO639Code } from './model/Package';
import chalk from 'chalk';
import Formula from 'fparser';
import { ICollectionConfig, IPackageConfig } from './model/Config';
import { disconnect, getCollection, getEntry, getPackageList, setup as setupDB } from './database';
import IEntry from './model/Entry';
import { ICollectionMetadata } from './model/Collection';

/**
 * Setup and logging
 */
const isDev = !app.isPackaged;
const paths = envPaths('Bestiary', { suffix: '' });
console.log(chalk.blue(`
${isDev ? '🐬 ' : ''}Bestiary ${process.env.npm_package_version}
${isDev ? '⚡ ' : ''}Electron: ${process.versions.electron}
${isDev ? '📦 ' : ''}Package directory: ${paths.data}
${isDev ? '⚙ ' : ''}Config directory: ${paths.config}
`));

/**
 * Creates the main app window
 */
function createWindow() {
  let win = new BrowserWindow({
    width: 1280,
    height: 720,
    title: isDev ? `Bestiary | DEVELOPMENT | ${process.env.npm_package_version}` : 'Bestiary',
    darkTheme: true,
    autoHideMenuBar: true,
    // frame: isDev,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile('index.html');

  if (isDev) {
    win.webContents.openDevTools({ mode: 'detach' });
  }
}

async function createOrLoadConfig(pkg: any): Promise<IPackageConfig> {
  const pkgConfigPath = path.join(paths.config, path.basename(pkg.metadata.path));
  const pkgConfigFile = path.join(pkgConfigPath, 'config.json');

  try {
    await mkdir(pkgConfigPath, { recursive: true });

    if (!existsSync(pkgConfigFile)) {
      console.log(chalk.blue('Creating config file', pkgConfigFile));
      writeFileSync(pkgConfigFile, '{}');
    }

    const pkgConfig: IPackageConfig = JSON.parse(readFileSync(pkgConfigFile, { encoding: 'utf-8' }));
    return pkgConfig;
  } catch (err: any) {
    console.log(chalk.white.bgRed('❌ Error loading package config at "' + pkgConfigFile + '"', err));
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
async function createOrLoadCollectionConfig(pkg: any, collectionName: string): Promise<ICollectionConfig[]> {
  const pkgConfig = await createOrLoadConfig(pkg);
  let collectionConfig: ICollectionConfig[] = [];
  if (pkgConfig) {
    collectionConfig = pkgConfig[collectionName] || [];
  }
  return collectionConfig;
}

function saveConfig(pkgPath: string, config: IPackageConfig): void {
  const pkgConfigFile = path.join(paths.config, path.basename(pkgPath), 'config.json');
  try {
    writeFileSync(pkgConfigFile, JSON.stringify(config));
  } catch (err: any) {
    console.log(chalk.white.bgRed('❌ Error saving package config at "' + pkgConfigFile + '"', err));
  }
}

function saveCollectionConfig(pkgPath: string, collectionName: string, config: ICollectionConfig[]): void {
  const pkgConfigFile = path.join(paths.config, path.basename(pkgPath), 'config.json');

  try {
    const pkgConfig: IPackageConfig = JSON.parse(readFileSync(pkgConfigFile, { encoding: 'utf-8' }));
    pkgConfig[collectionName] = config;
    writeFileSync(pkgConfigFile, JSON.stringify(pkgConfig));
  } catch (err: any) {
    console.log(chalk.white.bgRed('❌ Error saving package config at "' + pkgConfigFile + '"', err));
  }
}

/**
 * Load all packages
 */
ipcMain.handle('pkg:load-pkgs', async (): Promise<IPackageMetadata[]> => getPackageList());

ipcMain.handle('pkg:load-collection', async (_event: any, pkg: IPackageMetadata, collection: ICollectionMetadata, lang: ISO639Code): Promise<ICollectionMetadata> => getCollection(pkg, collection, lang));

ipcMain.handle('pkg:load-entry', async (_event: any, pkg: IPackageMetadata, collection: ICollectionMetadata, entry: IEntry, lang: ISO639Code): Promise<IEntry> => getEntry(pkg, collection, entry, lang))

ipcMain.handle('pkg:file-exists', (_event: any, filePath: string): boolean => existsSync(filePath));

ipcMain.handle('config:load-config', async (_event: any, pkg: any) => createOrLoadConfig(pkg));

ipcMain.handle('config:save-config', async (_event: any, pkgPath: string, config: IPackageConfig) => saveConfig(pkgPath, config));

ipcMain.handle('config:load-collection-config', async (_event: any, pkg: any, collection: string) => createOrLoadCollectionConfig(pkg, collection));

ipcMain.handle('config:save-collection-config', async (_event: any, pkgPath: string, collection: string, config: ICollectionConfig[]) => saveCollectionConfig(pkgPath, collection, config));

ipcMain.on('context-menu:show-collection-menu', (event: IpcMainEvent, collection: string) => {
  const menu = Menu.buildFromTemplate([
    {
      label: collection,
      enabled: false
    },
    {
      label: 'Manage collection',
      click: () => event.sender.send('context-menu:manage-collection', collection)
    }
  ]);
  const sender = BrowserWindow.fromWebContents(event.sender);
  if (sender) {
    menu.popup({ window: sender });
  }
});

ipcMain.handle('write', (_event: any, ...message: string[]): void => console.log(chalk.magenta.bgGrey(...message)));

ipcMain.handle('write-error', (_event: any, ...message: string[]): void => console.log(chalk.red.bgWhiteBright(...message)));

ipcMain.handle('eval-formula', (_event: any, expression: string, scope?: object): any => {
  return new Formula(expression).evaluate(scope || {});
});

/**
 * Create the main window
 */
app.whenReady().then(async () => {
  await setupDB();
  createWindow();
});

/**
 * Teardown when exiting
 */
app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    await disconnect();
    app.quit();
  }
});