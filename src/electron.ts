import { app, BrowserWindow, ipcMain, IpcMainEvent, Menu } from 'electron';
import path from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { mkdir, readdir } from 'fs/promises';
import envPaths from 'env-paths';
import IPackage, { IPackageMetadata } from './model/Package';
import chalk from 'chalk';
import { ICollectionConfig, IPackageConfig } from './model/Config';

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
    title: isDev ? `Bestiary | ${process.env.npm_package_version}` : 'Bestiary',
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

/**
 * Load a single package
 * 
 * @param pkgPath The package's location on the filesystem
 * @param fullLoad Whether this should be a full package load or just package header load
 * @param showStatus If set to true, logs the status of the package load
 * @returns A Package if one could be loaded from the supplied path
 */
function loadPackage(pkgPath: string, fullLoad: boolean, showStatus: boolean = false): IPackage | null {
  let pkg = null;
  try {
    const pkgData = readFileSync(path.join(pkgPath, 'package.json'), { encoding: 'utf-8' });
    pkg = parsePackage(pkgData, pkgPath, fullLoad, showStatus);
  } catch (err: any) {
    if (showStatus) { console.log(chalk.white.bgRed('❌ Error loading package at "' + pkgPath + '"', err)); }
  }
  return pkg;
}

/**
 * Load a package from a string
 * 
 * @param pkgData The contents of the package.json file
 * @param pkgPath The location of the package.json file
 * @param fullLoad Whether this should be a full package load or just package header load
 * @param showStatus If set to true, logs the status of the package load
 * @returns A Package if one could be parsed from the supplied data
 */
function parsePackage(pkgData: string, pkgPath: string = '', fullLoad: boolean = false, showStatus: boolean = false): IPackage | null {
  let pkg = null;
  try {
    const parsedData = JSON.parse(pkgData);
    if (isPackage(parsedData)) {
      pkg = parsedData as IPackage;
      if (showStatus) { console.log(chalk.green('✔ Loaded package "' + pkg.metadata.name + '"')); }
      pkg.metadata.path = pkgPath;
      if (fullLoad) {
        pkg.collections.forEach(collection => {
          if (collection.source) {
            try {
              const parsedCollection = JSON.parse(readFileSync(path.join(pkgPath, collection.source), { encoding: 'utf-8' }));
              if (isCollection(parsedCollection)) {
                Object.assign(collection, parsedCollection);
              }
              delete collection.source;
            } catch (err: any) {
              console.log(chalk.white.bgRed('❌ Error parsing collection "' + collection.name + '" at <' + collection.source + '>, skipping'));
            }
          }
        });
      }
    }
    else {
      if (showStatus) { console.log(chalk.white.bgRed('❌ Error parsing package at "' + pkgPath + '"')); }
    }
  } catch (err: any) {
    if (showStatus) { console.log(chalk.white.bgRed('❌ Error parsing package at "' + pkgPath + '"', err)); }
  }
  return pkg;
}

/**
 * Determines if parsed data is a package
 * 
 * @param data The parsed data
 * @returns True if the data contains the minimum attributes required to be a package
 */
function isPackage(data: any): boolean {
  return ('metadata' in data) && ('name' in data.metadata) && ('collections' in data);
}

/**
 * Determines if parsed data is a collection
 * 
 * @param data The parsed data
 * @returns True if the data contains the minimum attributes required to be a collection
 */
function isCollection(data: any): boolean {
  return ('data' in data) && ('layout' in data) && ('layoutPreview' in data);
}

async function createOrLoadConfig(pkg: IPackage): Promise<IPackageConfig> {
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
async function createOrLoadCollectionConfig(pkg: IPackage, collectionName: string): Promise<ICollectionConfig[]> {
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
ipcMain.handle('pkg:load-pkgs', async (): Promise<IPackageMetadata[]> => {
  // Ensure Data directory exists
  await mkdir(paths.data, { recursive: true });

  // Get all packages in Data directory
  const pkgs: IPackageMetadata[] = [];
  try {
    const files = await readdir(paths.data, { withFileTypes: true });
    for (const file of files) {
      if (file.isDirectory()) {
        const pkg = loadPackage(path.join(paths.data, file.name), false, true);
        if (pkg !== null) {
          pkgs.push(pkg.metadata);
        }
      }
    }
  } catch (err: any) {
    console.log(chalk.white.bgRed(err));
  }

  return pkgs;
});

ipcMain.handle('pkg:load-pkg', async (_event: any, pkgPath: string): Promise<IPackage | null> => loadPackage(pkgPath, true));

ipcMain.handle('pkg:parse-pkg', async (_event: any, pkgData: string): Promise<IPackage | null> => parsePackage(pkgData));

ipcMain.handle('pkg:file-exists', (_event: any, filePath: string): boolean => existsSync(filePath));

ipcMain.handle('config:load-config', async (_event: any, pkg: IPackage) => createOrLoadConfig(pkg));

ipcMain.handle('config:save-config', async (_event: any, pkgPath: string, config: IPackageConfig) => saveConfig(pkgPath, config));

ipcMain.handle('config:load-collection-config', async (_event: any, pkg: IPackage, collection: string) => createOrLoadCollectionConfig(pkg, collection));

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

/**
 * Create the main window
 */
app.whenReady().then(async () => {
  createWindow();
});
