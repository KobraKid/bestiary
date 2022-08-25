import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { readFileSync } from 'fs';
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
 * @param pkgPath The package's location on the filesystem
 * @param showStatus If set to true, logs the status of the package load
 * @returns A Package if one could be loaded from the supplied path
 */
function loadPackage(pkgPath: string, showStatus: boolean = false): IPackage | null {
  let pkg = null;
  try {
    const pkgData = readFileSync(pkgPath + '\\package.json', { encoding: 'utf-8' });
    pkg = parsePackage(pkgData, pkgPath, showStatus);
  } catch (err: any) {
    if (showStatus) { console.log(chalk.white.bgRed('❌ Error loading package at "' + pkgPath + '"', err)); }
  }
  return pkg;
}

/**
 * Load a package from a string
 * @param pkgData The contents of the package.json file
 * @param pkgPath The location of the package.json file
 * @param showStatus If set to true, logs the status of the package load
 * @returns A Package if one could be parsed from the supplied data
 */
function parsePackage(pkgData: string, pkgPath: string = '', showStatus: boolean = false): IPackage | null {
  let pkg = null;
  try {
    const parsedData = JSON.parse(pkgData);
    if (parsedData?.metadata?.name) {
      if (showStatus) { console.log(chalk.green('✔ Loaded package "' + JSON.parse(pkgData).metadata.name + '"')); }
      pkg = parsedData;
      pkg.metadata.path = pkgPath;
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
        const pkg = loadPackage(paths.data + '\\' + file.name, true);
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

ipcMain.handle('load-pkg', async (_event: any, pkgPath: string): Promise<IPackage | null> => loadPackage(pkgPath));

ipcMain.handle('parse-pkg', async (_event: any, pkgData: string): Promise<IPackage | null> => parsePackage(pkgData));

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
