import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { existsSync, readFileSync } from 'fs';
import { mkdir, readdir } from 'fs/promises';
import envPaths from 'env-paths';
import IPackage, { IPackageMetadata } from './model/Package';
import chalk from 'chalk';

/**
 * Setup and logging
 */
const paths = envPaths('Bestiary', { suffix: '' });
console.log(chalk.blue(`🐬 Bestiary ${process.env.npm_package_version}\n⚡ Electron: ${process.versions.electron}\n📦 Package directory: ${paths.data}\n`));

/**
 * Creates the main app window
 * 
 * @param openDevTools If set to true, shows the dev tools menu when launched
 */
function createWindow(openDevTools: boolean = false) {
  console.log(chalk.bold.gray.bgYellow('Starting main app'));
  let win = new BrowserWindow({
    width: 1280,
    height: 720,
    title: `Bestiary | ${process.env.npm_package_version}`,
    darkTheme: true,
    autoHideMenuBar: true,
    // frame: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile('index.html');
  if (openDevTools) { win.webContents.openDevTools({ mode: 'detach' }); }
}

/**
 * Creates the Package Builder window
 * 
 * @param openDevTools If set to true, shows the dev tools menu when launched
 */
function createBuilderWindow(openDevTools: boolean = false) {
  console.log(chalk.bold.yellow.bgGrey('Starting package builder'));
  let win = new BrowserWindow({
    width: 1920,
    height: 1280,
    title: `Package Builder | ${process.env.npm_package_version}`,
    darkTheme: true,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile('pkgBuilder.html');
  if (openDevTools) { win.webContents.openDevTools({ mode: 'right' }); }
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

/**
 * Load all packages
 */
ipcMain.handle('load-pkgs', async (): Promise<IPackageMetadata[]> => {
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

ipcMain.handle('load-pkg', async (_event: any, pkgPath: string): Promise<IPackage | null> => loadPackage(pkgPath, true));

ipcMain.handle('parse-pkg', async (_event: any, pkgData: string): Promise<IPackage | null> => parsePackage(pkgData));

ipcMain.handle('file-exists', (_event: any, filePath: string): boolean => existsSync(filePath));

ipcMain.handle('write', (_event: any, ...message: string[]): void => console.log(chalk.magenta.bgGrey(message)));

ipcMain.handle('write-error', (_event: any, ...message: string[]): void => console.log(chalk.red.bgWhiteBright(message)));

/**
 * Create the main window
 */
app.whenReady().then(async () => {
  const launchedBuilder = app.commandLine.getSwitchValue('builder') === '1'
  const openDevTools = app.commandLine.getSwitchValue('dev') === '1';

  if (launchedBuilder) {
    createBuilderWindow(openDevTools);
  } else {
    createWindow(openDevTools);
  }
});
